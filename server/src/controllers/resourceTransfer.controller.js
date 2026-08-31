import { ResourceTransfer } from "../models/ResourceTransfer.models.js";
import { MedicineInventory } from "../models/MedicineInventory.models.js";
import { Hospital } from "../models/Hospital.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Manual transfer creation
 */
export const createTransfer = asyncHandler(async (req, res) => {
  const { fromHospital, toHospital, medicine, quantity } = req.body;

  if (!fromHospital || !toHospital || !medicine || quantity === undefined) {
    throw new ApiError(400, "From hospital, to hospital, medicine, and quantity are required");
  }

  if (fromHospital === toHospital) {
    throw new ApiError(400, "Source and destination hospitals cannot be the same");
  }

  if (Number(quantity) <= 0) {
    throw new ApiError(400, "Transfer quantity must be greater than 0");
  }

  const [sourceHospital, destinationHospital] = await Promise.all([
    Hospital.findById(fromHospital),
    Hospital.findById(toHospital)
  ]);

  if (!sourceHospital) throw new ApiError(404, "Source hospital not found");
  if (!destinationHospital) throw new ApiError(404, "Destination hospital not found");

  const inventory = await MedicineInventory.findOne({
    hospitalId: fromHospital,
    medicineId: medicine
  });

  if (!inventory) {
    throw new ApiError(404, "Medicine inventory not found at source hospital");
  }

  if (inventory.quantity < quantity) {
    throw new ApiError(400, `Source hospital has only ${inventory.quantity} units in stock`);
  }

  const transfer = await ResourceTransfer.create({
    fromHospital,
    toHospital,
    medicine,
    quantity: Number(quantity),
    status: "RECOMMENDED"
  });

  const populated = await ResourceTransfer.findById(transfer._id)
    .populate("fromHospital", "name address location contact")
    .populate("toHospital", "name address location contact")
    .populate("medicine", "name category genericName");

  return res.status(201).json(
    new ApiResponse(201, populated, "Resource transfer requested successfully")
  );
});

/**
 * Automatically locate nearest hospital with surplus stock and create transfer request
 */
export const autoRecommendTransfer = asyncHandler(async (req, res) => {
  const { toHospital, medicine, quantity = 50 } = req.body;

  if (!toHospital || !medicine) {
    throw new ApiError(400, "Destination hospital (toHospital) and medicine are required");
  }

  const destHosp = await Hospital.findById(toHospital);
  if (!destHosp) {
    throw new ApiError(404, "Destination hospital not found");
  }

  const destCoords = destHosp.location?.coordinates
    ? [destHosp.location.coordinates[1], destHosp.location.coordinates[0]]
    : [25.4358, 81.8463];

  // Find all inventories of this medicine in other hospitals with available stock
  const inventories = await MedicineInventory.find({
    medicineId: medicine,
    hospitalId: { $ne: toHospital },
    quantity: { $gt: 0 }
  }).populate("hospitalId", "name address location contact");

  if (!inventories || inventories.length === 0) {
    throw new ApiError(404, "No other hospitals currently have stock for this medicine");
  }

  // Score candidate hospitals by surplus and geographic distance
  const candidates = inventories
    .map((inv) => {
      const hosp = inv.hospitalId;
      if (!hosp) return null;

      const coords = hosp.location?.coordinates
        ? [hosp.location.coordinates[1], hosp.location.coordinates[0]]
        : [25.4358, 81.8463];

      const dist = calculateDistance(destCoords[0], destCoords[1], coords[0], coords[1]);
      const surplus = inv.quantity - (inv.minimumStock || 0);

      return {
        hospital: hosp,
        inventory: inv,
        distanceKm: dist,
        surplus,
        availableUnits: inv.quantity
      };
    })
    .filter(Boolean);

  if (candidates.length === 0) {
    throw new ApiError(404, "No valid candidate hospitals found with stock");
  }

  // Prioritize hospitals with true surplus (> 0) sorted by nearest distance
  candidates.sort((a, b) => {
    if (a.surplus > 0 && b.surplus <= 0) return -1;
    if (b.surplus > 0 && a.surplus <= 0) return 1;
    return a.distanceKm - b.distanceKm;
  });

  const bestMatch = candidates[0];
  const requestedQty = Math.min(Number(quantity), bestMatch.availableUnits);

  const transfer = await ResourceTransfer.create({
    fromHospital: bestMatch.hospital._id,
    toHospital,
    medicine,
    quantity: requestedQty,
    status: "RECOMMENDED"
  });

  const populated = await ResourceTransfer.findById(transfer._id)
    .populate("fromHospital", "name address location contact")
    .populate("toHospital", "name address location contact")
    .populate("medicine", "name category genericName");

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        transfer: populated,
        matchedSupplier: {
          name: bestMatch.hospital.name,
          distanceKm: Math.round(bestMatch.distanceKm * 10) / 10,
          currentStock: bestMatch.availableUnits,
          surplusUnits: bestMatch.surplus
        }
      },
      `Auto-matched nearest surplus hospital (${bestMatch.hospital.name}, ${Math.round(bestMatch.distanceKm * 10) / 10} km away)`
    )
  );
});

/**
 * Get all transfers (public or role-filtered)
 */
export const getTransfers = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user && req.user.role === "HOSPITAL_ADMIN" && req.user.hospitalId) {
    filter = {
      $or: [{ fromHospital: req.user.hospitalId }, { toHospital: req.user.hospitalId }]
    };
  }

  const transfers = await ResourceTransfer.find(filter)
    .populate("fromHospital", "name address location contact")
    .populate("toHospital", "name address location contact")
    .populate("medicine", "name category genericName")
    .populate("approvedBy", "userId role")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, transfers, "Resource transfers retrieved successfully")
  );
});

export const getTransferById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transfer = await ResourceTransfer.findById(id)
    .populate("fromHospital", "name address location contact")
    .populate("toHospital", "name address location contact")
    .populate("medicine", "name category genericName")
    .populate("approvedBy", "userId role");

  if (!transfer) {
    throw new ApiError(404, "Resource transfer not found");
  }

  return res.status(200).json(
    new ApiResponse(200, transfer, "Resource transfer retrieved successfully")
  );
});

export const approveTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transfer = await ResourceTransfer.findById(id);
  if (!transfer) throw new ApiError(404, "Resource transfer not found");

  if (transfer.status !== "RECOMMENDED") {
    throw new ApiError(400, `Cannot approve transfer with status ${transfer.status}`);
  }

  transfer.status = "APPROVED";
  if (req.user) {
    transfer.approvedBy = req.user._id;
  }

  await transfer.save();

  const populated = await ResourceTransfer.findById(transfer._id)
    .populate("fromHospital", "name address location contact")
    .populate("toHospital", "name address location contact")
    .populate("medicine", "name category genericName")
    .populate("approvedBy", "userId role");

  return res.status(200).json(
    new ApiResponse(200, populated, "Resource transfer approved successfully")
  );
});

export const rejectTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transfer = await ResourceTransfer.findById(id);
  if (!transfer) throw new ApiError(404, "Resource transfer not found");

  if (transfer.status !== "RECOMMENDED") {
    throw new ApiError(400, `Cannot reject transfer with status ${transfer.status}`);
  }

  transfer.status = "REJECTED";
  if (req.user) {
    transfer.approvedBy = req.user._id;
  }

  await transfer.save();

  const populated = await ResourceTransfer.findById(transfer._id)
    .populate("fromHospital", "name address location contact")
    .populate("toHospital", "name address location contact")
    .populate("medicine", "name category genericName");

  return res.status(200).json(
    new ApiResponse(200, populated, "Resource transfer rejected successfully")
  );
});

export const completeTransfer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const transfer = await ResourceTransfer.findById(id);
  if (!transfer) throw new ApiError(404, "Resource transfer not found");

  if (transfer.status !== "APPROVED") {
    throw new ApiError(400, "Only approved transfers can be marked as completed");
  }

  const sourceInventory = await MedicineInventory.findOne({
    hospitalId: transfer.fromHospital,
    medicineId: transfer.medicine
  });

  if (!sourceInventory) {
    throw new ApiError(404, "Source hospital medicine inventory not found");
  }

  if (sourceInventory.quantity < transfer.quantity) {
    throw new ApiError(400, `Insufficient stock at source hospital (${sourceInventory.quantity} available)`);
  }

  const minimumStock = sourceInventory.minimumStock ?? 50;
  const expiryDate = sourceInventory.expiryDate ?? new Date("2027-08-26");

  sourceInventory.quantity -= transfer.quantity;
  await sourceInventory.save();

  let destinationInventory = await MedicineInventory.findOne({
    hospitalId: transfer.toHospital,
    medicineId: transfer.medicine
  });

  if (destinationInventory) {
    destinationInventory.quantity += transfer.quantity;
  } else {
    destinationInventory = new MedicineInventory({
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

  const populated = await ResourceTransfer.findById(transfer._id)
    .populate("fromHospital", "name address location contact")
    .populate("toHospital", "name address location contact")
    .populate("medicine", "name category genericName");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        transfer: populated,
        sourceInventory,
        destinationInventory
      },
      "Resource transfer completed and inventory updated successfully"
    )
  );
});