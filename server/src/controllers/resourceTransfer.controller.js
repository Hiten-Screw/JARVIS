import { ResourceTransfer } from "../models/ResourceTransfer.models.js";
import { MedicineInventory } from "../models/MedicineInventory.models.js";
import { Hospital } from "../models/Hospital.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createTransfer = asyncHandler(async (req, res) => {
    const {
        fromHospital,
        toHospital,
        medicine,
        quantity
    } = req.body;

    if (
        !fromHospital ||
        !toHospital ||
        !medicine ||
        quantity === undefined
    ) {
        throw new ApiError(
            400,
            "From hospital, to hospital, medicine and quantity are required"
        );
    }

    if (fromHospital === toHospital) {
        throw new ApiError(
            400,
            "Source and destination hospitals cannot be the same"
        );
    }

    if (quantity <= 0) {
        throw new ApiError(
            400,
            "Transfer quantity must be greater than 0"
        );
    }

    const [sourceHospital, destinationHospital] =
        await Promise.all([
            Hospital.findById(fromHospital),
            Hospital.findById(toHospital)
        ]);

    if (!sourceHospital) {
        throw new ApiError(
            404,
            "Source hospital not found"
        );
    }

    if (!destinationHospital) {
        throw new ApiError(
            404,
            "Destination hospital not found"
        );
    }

    const inventory = await MedicineInventory.findOne({
        hospitalId: fromHospital,
        medicineId: medicine
    });

    if (!inventory) {
        throw new ApiError(
            404,
            "Medicine inventory not found at source hospital"
        );
    }

    if (inventory.quantity < quantity) {
        throw new ApiError(
            400,
            "Source hospital does not have enough medicine stock"
        );
    }

    const transfer = await ResourceTransfer.create({
        fromHospital,
        toHospital,
        medicine,
        quantity,
        status: "RECOMMENDED"
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                transfer,
                "Resource transfer recommended successfully"
            )
        );
});

export const getTransfers = asyncHandler(async (req, res) => {
    let filter = {};

    if (req.user.role === "HOSPITAL_ADMIN") {
        filter = {
            $or: [
                {
                    fromHospital: req.user.hospitalId
                },
                {
                    toHospital: req.user.hospitalId
                }
            ]
        };
    }

    const transfers = await ResourceTransfer
        .find(filter)
        .populate("fromHospital", "name address")
        .populate("toHospital", "name address")
        .populate("medicine", "name category")
        .populate("approvedBy", "userId role")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                transfers,
                "Resource transfers retrieved successfully"
            )
        );
});

export const getTransferById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const transfer = await ResourceTransfer
        .findById(id)
        .populate("fromHospital", "name address")
        .populate("toHospital", "name address")
        .populate("medicine", "name category")
        .populate("approvedBy", "userId role");

    if (!transfer) {
        throw new ApiError(
            404,
            "Resource transfer not found"
        );
    }

    if (
        req.user.role === "HOSPITAL_ADMIN" &&
        transfer.fromHospital._id.toString() !==
            req.user.hospitalId?.toString() &&
        transfer.toHospital._id.toString() !==
            req.user.hospitalId?.toString()
    ) {
        throw new ApiError(
            403,
            "You do not have access to this transfer"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                transfer,
                "Resource transfer retrieved successfully"
            )
        );
});

export const approveTransfer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const transfer = await ResourceTransfer.findById(id);

    if (!transfer) {
        throw new ApiError(
            404,
            "Resource transfer not found"
        );
    }

    if (transfer.status !== "RECOMMENDED") {
        throw new ApiError(
            400,
            "Only recommended transfers can be approved"
        );
    }

    transfer.status = "APPROVED";
    transfer.approvedBy = req.user._id;

    await transfer.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                transfer,
                "Resource transfer approved successfully"
            )
        );
});

export const rejectTransfer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const transfer = await ResourceTransfer.findById(id);

    if (!transfer) {
        throw new ApiError(
            404,
            "Resource transfer not found"
        );
    }

    if (transfer.status !== "RECOMMENDED") {
        throw new ApiError(
            400,
            "Only recommended transfers can be rejected"
        );
    }

    transfer.status = "REJECTED";
    transfer.approvedBy = req.user._id;

    await transfer.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                transfer,
                "Resource transfer rejected successfully"
            )
        );
});

export const completeTransfer = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const transfer = await ResourceTransfer.findById(id);

    if (!transfer) {
        throw new ApiError(
            404,
            "Resource transfer not found"
        );
    }

    if (transfer.status !== "APPROVED") {
        throw new ApiError(
            400,
            "Only approved transfers can be completed"
        );
    }

    const sourceInventory = await MedicineInventory.findOne({
        hospitalId: transfer.fromHospital,
        medicineId: transfer.medicine
    });

    if (!sourceInventory) {
        throw new ApiError(
            404,
            "Source hospital medicine inventory not found"
        );
    }

    if (sourceInventory.quantity < transfer.quantity) {
        throw new ApiError(
            400,
            "Insufficient medicine stock at source hospital"
        );
    }

    const minimumStock =
        sourceInventory.minimumStock ?? 50;

    const expiryDate =
        sourceInventory.expiryDate ??
        new Date("2027-08-26");

    sourceInventory.quantity -= transfer.quantity;

    sourceInventory.minimumStock = minimumStock;
    sourceInventory.expiryDate = expiryDate;

    await sourceInventory.save();

    let destinationInventory =
        await MedicineInventory.findOne({
            hospitalId: transfer.toHospital,
            medicineId: transfer.medicine
        });

    if (destinationInventory) {
        destinationInventory.quantity += transfer.quantity;
        destinationInventory.minimumStock =
            destinationInventory.minimumStock ?? minimumStock;
        destinationInventory.expiryDate =
            destinationInventory.expiryDate ?? expiryDate;
    } else {
        destinationInventory =
            new MedicineInventory({
                hospitalId: transfer.toHospital,
                medicineId: transfer.medicine,
                quantity: transfer.quantity,
                minimumStock,
                expiryDate
            });
    }

    await destinationInventory.save();

    transfer.status = "COMPLETED";

    await transfer.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    transfer,
                    sourceInventory,
                    destinationInventory
                },
                "Resource transfer completed successfully"
            )
        );
});