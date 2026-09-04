import { Hospital } from "../models/Hospital.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// Create a new hospital
// POST /api/v1/hospitals
export const createHospital = asyncHandler(async (req, res) => {
    const {
        hospitalId,
        name,
        address,
        location,
        contact,
        specializations,
        emergencyDepartment,
        hospitalType
    } = req.body;
    const normalizedHospitalId = hospitalId?.trim().toUpperCase();

    if (
        !normalizedHospitalId ||
        !name ||
        !address ||
        !contact ||
        !location ||
        !location.coordinates
    ) {
        throw new ApiError(
            400,
            "Name, address, contact and location are required"
        );
    }

    if (
        location.type !== "Point" ||
        location.coordinates.length !== 2
    ) {
        throw new ApiError(
            400,
            "Location must be a valid GeoJSON Point"
        );
    }

    const existingHospital = await Hospital.findOne({
        $or: [{ hospitalId: normalizedHospitalId }, { name }]
    });

    if (existingHospital) {
        throw new ApiError(
            409,
            "Hospital ID or name already exists"
        );
    }

    const hospital = await Hospital.create({
        hospitalId: normalizedHospitalId,
        name,
        address,
        location,
        contact,
        specializations: specializations || [],
        emergencyDepartment: emergencyDepartment || false,
        hospitalType
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                hospital,
                "Hospital created successfully"
            )
        );
});


// Get hospitals with optional geospatial radius filtering
// GET /api/v1/hospitals?lat=25.4358&lng=81.8463&radiusKm=50
export const getHospitals = asyncHandler(async (req, res) => {
    const { lat, latitude, lng, longitude, radiusKm, radius } = req.query;

    const queryLat = lat !== undefined ? Number(lat) : latitude !== undefined ? Number(latitude) : NaN;
    const queryLng = lng !== undefined ? Number(lng) : longitude !== undefined ? Number(longitude) : NaN;
    const queryRadiusKm = Number(radiusKm ?? radius ?? 50);

    const pipeline = [];

    // If geographic coordinates are supplied, perform fast indexed 2dsphere spatial filtering
    if (!isNaN(queryLat) && !isNaN(queryLng)) {
        pipeline.push({
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [queryLng, queryLat]
                },
                distanceField: "distanceMeters",
                maxDistance: Math.max(1, queryRadiusKm) * 1000,
                spherical: true
            }
        });
    }

    pipeline.push(
        {
            $lookup: {
                from: "hospitalresources",
                localField: "_id",
                foreignField: "hospitalId",
                as: "resources"
            }
        },
        {
            $lookup: {
                from: "bloodstocks",
                localField: "_id",
                foreignField: "hospitalId",
                as: "bloodStock"
            }
        }
    );

    const hospitals = await Hospital.aggregate(pipeline);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                hospitals,
                "Hospitals retrieved successfully"
            )
        );
});


// Get hospital by ID
// GET /api/v1/hospitals/:id
export const getHospitalById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const hospital = await Hospital.findById(id);

    if (!hospital) {
        throw new ApiError(404, "Hospital not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                hospital,
                "Hospital retrieved successfully"
            )
        );
});


// Update hospital
// PATCH /api/v1/hospitals/:id
export const updateHospital = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const allowedUpdates = [
        "name",
        "address",
        "contact",
        "specializations",
        "emergencyDepartment",
        "hospitalType"
    ];

    const updates = {};

    for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    // Handle location separately
    if (
        req.body.latitude !== undefined ||
        req.body.longitude !== undefined
    ) {
        const hospital = await Hospital.findById(id);

        if (!hospital) {
            throw new ApiError(404, "Hospital not found");
        }

        const latitude =
            req.body.latitude ??
            hospital.location.coordinates[1];

        const longitude =
            req.body.longitude ??
            hospital.location.coordinates[0];

        if (latitude < -90 || latitude > 90) {
            throw new ApiError(400, "Invalid latitude");
        }

        if (longitude < -180 || longitude > 180) {
            throw new ApiError(400, "Invalid longitude");
        }

        updates.location = {
            type: "Point",
            coordinates: [longitude, latitude]
        };
    }

    const hospital = await Hospital.findByIdAndUpdate(
        id,
        { $set: updates },
        {
            new: true,
            runValidators: true
        }
    );

    if (!hospital) {
        throw new ApiError(404, "Hospital not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                hospital,
                "Hospital updated successfully"
            )
        );
});