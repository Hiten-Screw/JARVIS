import { HospitalResource } from "../models/Hospital_resource.models.js";
import { Hospital } from "../models/Hospital.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

const resolveHospital = async (value) => {
    if (!value) return null;
    return mongoose.isValidObjectId(value)
        ? Hospital.findById(value)
        : Hospital.findOne({ hospitalId: value.trim().toUpperCase() });
};

export const getHospitalResources = asyncHandler(async (req, res) => {
    const { hospitalId: publicHospitalId } = req.params;
    const hospital = await resolveHospital(publicHospitalId);
    if (!hospital) throw new ApiError(404, "Hospital not found");
    const hospitalId = hospital._id;

    const resources = await HospitalResource.find({
        hospitalId
    }).populate(
        "hospitalId",
        "name address contact"
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                resources,
                "Hospital resources retrieved successfully"
            )
        );
});

export const updateHospitalResource = asyncHandler(
    async (req, res) => {
        const { hospitalId: publicHospitalId, resourceType } = req.params;
        const hospital = await resolveHospital(publicHospitalId);
        if (!hospital) throw new ApiError(404, "Hospital not found");
        const hospitalId = hospital._id;
        const { total, available } = req.body;

        if (total === undefined || available === undefined) {
            throw new ApiError(
                400,
                "Total and available values are required"
            );
        }

        if (total < 0 || available < 0) {
            throw new ApiError(
                400,
                "Total and available values cannot be negative"
            );
        }

        if (available > total) {
            throw new ApiError(
                400,
                "Available resources cannot exceed total resources"
            );
        }

        if (
            ["HOSPITAL_ADMIN", "INVENTORY_STAFF", "NURSE", "DOCTOR"].includes(req.user.role) &&
            req.user.hospitalId?.toString() !== hospitalId.toString()
        ) {
            throw new ApiError(
                403,
                "You can only update your assigned hospital resources"
            );
        }

        let resource = await HospitalResource.findOne({
            hospitalId,
            resourceType
        });

        if (resource) {
            resource.total = total;
            resource.available = available;
        } else {
            resource = new HospitalResource({
                hospitalId,
                resourceType,
                total,
                available
            });
        }

        await resource.save();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    resource,
                    "Hospital resource updated successfully"
                )
            );
    }
);

export const updateResourceOccupancy = asyncHandler(async (req, res) => {
    const { hospitalId: publicHospitalId, resourceType } = req.params;
    const hospital = await resolveHospital(publicHospitalId);
    if (!hospital) throw new ApiError(404, "Hospital not found");
    if (req.user.hospitalId?.toString() !== hospital._id.toString()) {
        throw new ApiError(403, "You can only update your assigned hospital resources");
    }

    const { available } = req.body;
    if (available === undefined || available < 0) {
        throw new ApiError(400, "Available value must be a non-negative number");
    }

    const resource = await HospitalResource.findOne({ hospitalId: hospital._id, resourceType });
    if (!resource) throw new ApiError(404, "Resource not found for this hospital");
    if (available > resource.total) {
        throw new ApiError(400, "Available resources cannot exceed the current total");
    }

    resource.available = available;
    await resource.save();
    return res.status(200).json(new ApiResponse(200, resource, "Resource occupancy updated successfully"));
});
