import { BloodStock } from "../models/BloodStock.models.js";
import { Hospital } from "../models/Hospital.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const resolveHospital = async (publicHospitalId, user) => {
    const hospital = mongoose.isValidObjectId(publicHospitalId)
        ? await Hospital.findById(publicHospitalId)
        : await Hospital.findOne({ hospitalId: publicHospitalId?.trim().toUpperCase() });
    if (!hospital) throw new ApiError(404, "Hospital not found");
    if (user && user.role !== "SUPER_ADMIN" && user.hospitalId?.toString() !== hospital._id.toString()) {
        throw new ApiError(403, "You can only update your assigned hospital blood stock");
    }
    return hospital;
};

const getBloodTotal = async (hospitalId) => {
    const groups = await BloodStock.find({ hospitalId });
    return groups.reduce((sum, group) => sum + group.currentStock, 0);
};

export const getBloodStock = asyncHandler(async (req, res) => {
    const hospital = await resolveHospital(req.params.hospitalId, req.user);
    const stock = await BloodStock.find({ hospitalId: hospital._id }).sort({ bloodGroup: 1 });
    const total = await getBloodTotal(hospital._id);
    return res.status(200).json(new ApiResponse(200, { stock, total, available: total }, "Blood stock retrieved successfully"));
});

export const updateBloodStock = asyncHandler(async (req, res) => {
    const hospital = await resolveHospital(req.params.hospitalId, req.user);
    const { bloodGroup, currentStock } = req.body;
    if (!bloodGroup || currentStock === undefined || currentStock < 0) throw new ApiError(400, "Blood group and a non-negative current stock are required");
    const stock = await BloodStock.findOneAndUpdate(
        { hospitalId: hospital._id, bloodGroup },
        { currentStock },
        { upsert: true, new: true, runValidators: true }
    );
    const total = await getBloodTotal(hospital._id);
    return res.status(200).json(new ApiResponse(200, { stock, total, available: total }, "Blood stock updated successfully"));
});

export const useBloodStock = asyncHandler(async (req, res) => {
    const hospital = await resolveHospital(req.params.hospitalId, req.user);
    const { bloodGroup, unitsUsed } = req.body;
    if (!bloodGroup || unitsUsed === undefined || unitsUsed <= 0) {
        throw new ApiError(400, "Blood group and units used greater than zero are required");
    }
    const stock = await BloodStock.findOne({ hospitalId: hospital._id, bloodGroup });
    if (!stock || stock.currentStock < unitsUsed) {
        throw new ApiError(400, "Insufficient blood stock for this blood group");
    }
    stock.currentStock -= unitsUsed;
    await stock.save();
    const total = await getBloodTotal(hospital._id);
    return res.status(200).json(new ApiResponse(200, { stock, total, available: total }, "Blood usage recorded successfully"));
});
