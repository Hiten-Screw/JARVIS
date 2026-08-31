import { Medicine } from "../models/Medicine.models.js";
import { MedicineInventory } from "../models/MedicineInventory.models.js";
import { MedicineConsumptionHistory } from "../models/MedicineConsumptionHistory.models.js";
import { MedicineDemandPrediction } from "../models/MedicineDemandPrediction.models.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Hospital } from "../models/Hospital.models.js";
import mongoose from "mongoose";

const resolveHospital = async (value) => {
    if (!value) return null;
    return mongoose.isValidObjectId(value)
        ? Hospital.findById(value)
        : Hospital.findOne({ hospitalId: value.trim().toUpperCase() });
};

export const getMedicines = asyncHandler(async (req, res) => {
    const medicines = await Medicine.find().sort({ name: 1 });

    return res.status(200).json(
        new ApiResponse(200, medicines, "Medicines retrieved successfully")
    );
});

export const getInventory = asyncHandler(async (req, res) => {
    const hospitalId = req.user.role === "SUPER_ADMIN"
        ? req.query.hospitalId
        : req.user.hospitalId;

    if (!hospitalId) {
        throw new ApiError(400, "Hospital ID is required");
    }

    const inventory = await MedicineInventory.find({ hospitalId })
        .populate("medicineId", "name genericName category manufacturer unit")
        .sort({ updatedAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, inventory, "Medicine inventory retrieved successfully")
    );
});

export const getHospitalInventory = asyncHandler(async (req, res) => {
    const hospital = await resolveHospital(req.params.hospitalId);
    if (!hospital) throw new ApiError(404, "Hospital not found");

    const inventory = await MedicineInventory.find({ hospitalId: hospital._id })
        .populate("medicineId", "name genericName category manufacturer unit")
        .sort({ updatedAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, inventory, "Medicine inventory retrieved successfully")
    );
});


// Create a medicine in the global master catalog
// POST /api/v1/medicines
export const createMedicine = asyncHandler(async (req, res) => {
    const {
        name,
        genericName,
        category,
        manufacturer,
        unit
    } = req.body;

    if (
        !name ||
        !genericName ||
        !category ||
        !manufacturer ||
        !unit
    ) {
        throw new ApiError(
            400,
            "Name, generic name, category, manufacturer and unit are required"
        );
    }

    const medicine = await Medicine.create({
        name,
        genericName,
        category,
        manufacturer,
        unit
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                medicine,
                "Medicine created successfully"
            )
        );
});

// Update hospital medicine inventory
// POST /api/v1/medicines/inventory
export const updateInventory = asyncHandler(async (req, res) => {
    const {
        hospitalId,
        medicineId,
        quantity,
        unitPrice,
        minimumStock,
        expiryDate
    } = req.body;
    const hospital = await resolveHospital(
        req.user.role === "SUPER_ADMIN" ? hospitalId : req.user.hospitalId
    );
    const hospitalObjectId = hospital?._id;
    if (!hospital) throw new ApiError(404, "Hospital not found");

    if (
        !hospitalId ||
        !medicineId ||
        quantity === undefined ||
        minimumStock === undefined ||
        !expiryDate
    ) {
        throw new ApiError(
            400,
            "Hospital ID, Medicine ID, and quantity are required"
        );
    }

    if (quantity < 0) {
        throw new ApiError(
            400,
            "Medicine quantity cannot be negative"
        );
    }

    // Hospital admin can update only their own hospital
    if (
        ["HOSPITAL_ADMIN", "INVENTORY_STAFF"].includes(req.user.role) &&
        req.user.hospitalId?.toString() !== hospitalObjectId.toString()
    ) {
        throw new ApiError(
            403,
            "You can only update your assigned hospital inventory"
        );
    }

    const medicine = await Medicine.findById(medicineId);

    if (!medicine) {
        throw new ApiError(
            404,
            "Medicine not found"
        );
    }

    const inventory =
        await MedicineInventory.findOneAndUpdate(
            {
                hospitalId: hospitalObjectId,
                medicineId
            },
            {
                $set: {
                    quantity,
                    unitPrice,
                    minimumStock,
                    expiryDate
                }
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                inventory,
                "Medicine inventory updated successfully"
            )
        );
});


// Log medicine consumption
// POST /api/v1/medicines/consumption
export const logConsumption = asyncHandler(async (req, res) => {
    const {
                hospitalId: hospitalObjectId,
        medicineId,
        quantityConsumed
    } = req.body;

    if (
        !hospitalId ||
        !medicineId ||
        quantityConsumed === undefined
    ) {
        throw new ApiError(
            400,
            "Hospital ID, Medicine ID, and quantity consumed are required"
        );
    }

    if (quantityConsumed <= 0) {
        throw new ApiError(
            400,
            "Quantity consumed must be greater than 0"
        );
    }

    // Hospital admin can update only their own hospital
    if (
        req.user.role === "HOSPITAL_ADMIN" &&
        req.user.hospitalId?.toString() !== hospitalId
    ) {
        throw new ApiError(
            403,
            "You can only update your assigned hospital inventory"
        );
    }

    const inventory =
        await MedicineInventory.findOne({
            hospitalId,
            medicineId
        });

    if (!inventory) {
        throw new ApiError(
            404,
            "Medicine inventory not found"
        );
    }

    if (inventory.quantity < quantityConsumed) {
        throw new ApiError(
            400,
            "Insufficient medicine stock"
        );
    }

    // Deduct consumed quantity
    inventory.quantity -= quantityConsumed;

    await inventory.save();

    // Store consumption history
    const consumptionLog =
        await MedicineConsumptionHistory.create({
            hospitalId,
            medicineId,
            quantityConsumed,
            date: new Date()
        });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {
                    consumptionLog,
                    inventory
                },
                "Medicine consumption logged successfully"
            )
        );
});


// Get medicine demand predictions
// GET /api/v1/medicines/predictions/:hospitalId
export const getMedicinePredictions =
    asyncHandler(async (req, res) => {
        const { hospitalId } = req.params;

        const predictions =
            await MedicineDemandPrediction
                .find({ hospitalId })
                .populate(
                    "medicineId",
                    "name category"
                )
                .sort({
                    date: 1
                });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    predictions,
                    "Medicine demand predictions retrieved successfully"
                )
            );
    });