import { HospitalResource } from "../models/Hospital_resource.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getHospitalResources = asyncHandler(async (req, res) => {
    const { hospitalId } = req.params;

    const resources = await HospitalResource.find({
        hospitalId
    }).populate(
        "hospitalId",
        "name address contact"
    );

    if (!resources.length) {
        throw new ApiError(
            404,
            "Resources not found for this hospital"
        );
    }

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
        const { hospitalId, resourceType } = req.params;
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
            req.user.role === "HOSPITAL_ADMIN" &&
            req.user.hospitalId?.toString() !== hospitalId
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
