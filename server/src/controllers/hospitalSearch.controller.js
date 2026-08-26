import { Hospital } from "../models/Hospital.models.js";
import { HospitalResource } from "../models/Hospital_resource.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const searchHospitals = asyncHandler(async (req, res) => {
    const { latitude, longitude, disease } = req.query;

    if (
        latitude === undefined ||
        longitude === undefined ||
        !disease
    ) {
        throw new ApiError(
            400,
            "Latitude, longitude and disease are required"
        );
    }

    const userLatitude = Number(latitude);
    const userLongitude = Number(longitude);

    if (
        Number.isNaN(userLatitude) ||
        userLatitude < -90 ||
        userLatitude > 90
    ) {
        throw new ApiError(400, "Invalid latitude");
    }

    if (
        Number.isNaN(userLongitude) ||
        userLongitude < -180 ||
        userLongitude > 180
    ) {
        throw new ApiError(400, "Invalid longitude");
    }

    // Find nearby hospitals
    const hospitals = await Hospital.find({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [
                        userLongitude,
                        userLatitude
                    ]
                }
            }
        }
    }).limit(20);

    if (!hospitals.length) {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    [],
                    "No nearby hospitals found"
                )
            );
    }

    // Get current resources of these hospitals
    const hospitalIds = hospitals.map(
        (hospital) => hospital._id
    );

    const resources = await HospitalResource.find({
        hospitalId: {
            $in: hospitalIds
        }
    });

    // Group resources by hospital
    const resourceMap = {};

    for (const resource of resources) {
        const hospitalId =
            resource.hospitalId.toString();

        if (!resourceMap[hospitalId]) {
            resourceMap[hospitalId] = [];
        }

        resourceMap[hospitalId].push(resource);
    }

    // Prepare data for ranking / ML
    const results = hospitals.map((hospital) => ({
        hospital,
        resources:
            resourceMap[hospital._id.toString()] || []
    }));

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    disease,
                    patientLocation: {
                        latitude: userLatitude,
                        longitude: userLongitude
                    },
                    hospitals: results
                },
                "Nearby hospitals retrieved successfully"
            )
        );
});