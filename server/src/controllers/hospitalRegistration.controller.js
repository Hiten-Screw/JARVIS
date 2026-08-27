import bcrypt from "bcrypt";
import { HospitalRegistrationRequest } from "../models/HospitalRegistrationRequest.models.js";
import { Hospital } from "../models/Hospital.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const validateRequest = (body) => {
    const required = [
        "hospitalId", "name", "address", "location", "contact",
        "hospitalType", "adminUserId", "adminPassword"
    ];
    if (required.some((field) => !body[field])) {
        throw new ApiError(400, "All hospital and initial admin fields are required");
    }
    if (
        body.location.type !== "Point" ||
        !Array.isArray(body.location.coordinates) ||
        body.location.coordinates.length !== 2
    ) {
        throw new ApiError(400, "Location must be a valid GeoJSON Point");
    }
};

export const submitHospitalRegistration = asyncHandler(async (req, res) => {
    validateRequest(req.body);
    const hospitalId = req.body.hospitalId.trim().toUpperCase();

    const [existingHospital, existingRequest] = await Promise.all([
        Hospital.findOne({ hospitalId }),
        HospitalRegistrationRequest.findOne({ hospitalId, status: "PENDING" })
    ]);
    if (existingHospital || existingRequest) {
        throw new ApiError(409, "Hospital ID already exists or has a pending request");
    }

    const request = await HospitalRegistrationRequest.create({
        ...req.body,
        hospitalId,
        specializations: req.body.specializations || [],
        adminPassword: await bcrypt.hash(req.body.adminPassword, 10)
    });

    return res.status(201).json(
        new ApiResponse(201, request, "Hospital registration request submitted")
    );
});

export const getHospitalRegistrationRequests = asyncHandler(async (req, res) => {
    const requests = await HospitalRegistrationRequest.find()
        .select("-adminPassword")
        .populate("reviewedBy", "userId role")
        .sort({ createdAt: -1 });
    return res.status(200).json(
        new ApiResponse(200, requests, "Hospital registration requests retrieved")
    );
});

export const approveHospitalRegistration = asyncHandler(async (req, res) => {
    const request = await HospitalRegistrationRequest.findById(req.params.id);
    if (!request || request.status !== "PENDING") {
        throw new ApiError(404, "Pending hospital registration request not found");
    }

    const existingHospital = await Hospital.findOne({ hospitalId: request.hospitalId });
    if (existingHospital) throw new ApiError(409, "Hospital ID already exists");

    const hospital = await Hospital.create({
        hospitalId: request.hospitalId,
        name: request.name,
        address: request.address,
        location: request.location,
        contact: request.contact,
        specializations: request.specializations,
        emergencyDepartment: request.emergencyDepartment,
        hospitalType: request.hospitalType
    });

    try {
        const admin = await User.create({
            userId: request.adminUserId,
            password: request.adminPassword,
            role: "HOSPITAL_ADMIN",
            hospitalId: hospital._id
        });
        request.status = "APPROVED";
        request.reviewedBy = req.user._id;
        request.reviewedAt = new Date();
        await request.save();
        return res.status(200).json(new ApiResponse(200, { hospital, admin: { _id: admin._id, userId: admin.userId } }, "Hospital registration approved"));
    } catch (error) {
        await Hospital.findByIdAndDelete(hospital._id);
        throw error;
    }
});

export const rejectHospitalRegistration = asyncHandler(async (req, res) => {
    const request = await HospitalRegistrationRequest.findOneAndUpdate(
        { _id: req.params.id, status: "PENDING" },
        { status: "REJECTED", reviewedBy: req.user._id, reviewedAt: new Date(), rejectionReason: req.body.reason || "Rejected by super admin" },
        { new: true }
    ).select("-adminPassword");
    if (!request) throw new ApiError(404, "Pending hospital registration request not found");
    return res.status(200).json(new ApiResponse(200, request, "Hospital registration rejected"));
});
