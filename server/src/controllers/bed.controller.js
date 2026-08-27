import { BedOccupancyHistory } from "../models/BedOccupancyHistory.models.js";
import { BedDemandPrediction } from "../models/BedDemandPrediction.models.js";
import { HospitalResource } from "../models/Hospital_resource.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const logBedOccupancy = asyncHandler(async (req, res) => {
    const {
        hospitalId,
        totalBeds,
        occupiedBeds,
        totalICU,
        occupiedICU,
        totalEmergencyBeds,
        occupiedEmergencyBeds
    } = req.body;

    if (!hospitalId) {
        throw new ApiError(400, "Hospital ID is required");
    }

    const values = [
        totalBeds,
        occupiedBeds,
        totalICU,
        occupiedICU,
        totalEmergencyBeds,
        occupiedEmergencyBeds
    ];

    if (values.some((value) => value === undefined)) {
        throw new ApiError(400, "All bed counts are required");
    }

    if (values.some((value) => value < 0)) {
        throw new ApiError(400, "Bed counts cannot be negative");
    }

    if (occupiedBeds > totalBeds) {
        throw new ApiError(
            400,
            "Occupied general beds cannot exceed total beds"
        );
    }

    if (occupiedICU > totalICU) {
        throw new ApiError(
            400,
            "Occupied ICU beds cannot exceed total ICU beds"
        );
    }

    if (occupiedEmergencyBeds > totalEmergencyBeds) {
        throw new ApiError(
            400,
            "Occupied emergency beds cannot exceed total emergency beds"
        );
    }

    if (
        ["HOSPITAL_ADMIN", "NURSE", "DOCTOR"].includes(req.user.role) &&
        req.user.hospitalId?.toString() !== hospitalId
    ) {
        throw new ApiError(
            403,
            "You can only update your assigned hospital"
        );
    }

    const availableBeds = totalBeds - occupiedBeds;
    const availableICU = totalICU - occupiedICU;
    const availableEmergencyBeds =
        totalEmergencyBeds - occupiedEmergencyBeds;

    const occupancyLog = await BedOccupancyHistory.create({
        hospitalId,
        date: new Date(),
        totalBeds,
        occupiedBeds,
        availableBeds,
        totalICU,
        occupiedICU,
        availableICU,
        totalEmergencyBeds,
        occupiedEmergencyBeds,
        availableEmergencyBeds
    });

    let generalBed = await HospitalResource.findOne({
        hospitalId,
        resourceType: "generalBed"
    });

    if (generalBed) {
        generalBed.total = totalBeds;
        generalBed.available = availableBeds;
    } else {
        generalBed = new HospitalResource({
            hospitalId,
            resourceType: "generalBed",
            total: totalBeds,
            available: availableBeds
        });
    }

    await generalBed.save();

    let icuBed = await HospitalResource.findOne({
        hospitalId,
        resourceType: "icuBed"
    });

    if (icuBed) {
        icuBed.total = totalICU;
        icuBed.available = availableICU;
    } else {
        icuBed = new HospitalResource({
            hospitalId,
            resourceType: "icuBed",
            total: totalICU,
            available: availableICU
        });
    }

    await icuBed.save();

    let emergencyBed = await HospitalResource.findOne({
        hospitalId,
        resourceType: "emergencyBed"
    });

    if (emergencyBed) {
        emergencyBed.total = totalEmergencyBeds;
        emergencyBed.available = availableEmergencyBeds;
    } else {
        emergencyBed = new HospitalResource({
            hospitalId,
            resourceType: "emergencyBed",
            total: totalEmergencyBeds,
            available: availableEmergencyBeds
        });
    }

    await emergencyBed.save();

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {
                    occupancyLog,
                    currentResources: {
                        generalBed,
                        icuBed,
                        emergencyBed
                    }
                },
                "Bed occupancy logged successfully"
            )
        );
});

export const getOccupancyHistory = asyncHandler(
    async (req, res) => {
        const { hospitalId } = req.params;

        const history = await BedOccupancyHistory
            .find({ hospitalId })
            .sort({ date: -1 });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    history,
                    "Occupancy history retrieved successfully"
                )
            );
    }
);

export const getBedDemandPredictions =
    asyncHandler(async (req, res) => {
        const { hospitalId } = req.params;

        const predictions = await BedDemandPrediction
            .find({ hospitalId })
            .sort({ predictedForDate: 1 });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    predictions,
                    "Bed demand predictions retrieved successfully"
                )
            );
    });