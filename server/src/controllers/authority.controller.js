import { Hospital } from "../models/Hospital.models.js";
import { HospitalResource } from "../models/Hospital_resource.models.js";
import { MedicineInventory } from "../models/MedicineInventory.models.js";
import { ResourceTransfer } from "../models/ResourceTransfer.models.js";
import { BedDemandPrediction } from "../models/BedDemandPrediction.models.js";

import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// Authority dashboard
// GET /api/v1/authority/dashboard
export const getAuthorityDashboard = asyncHandler(
    async (req, res) => {

        const [
            totalHospitals,
            hospitalResources,
            medicineInventory,
            pendingTransfers,
            criticalBedPredictions
        ] = await Promise.all([
            Hospital.countDocuments(),

            HospitalResource.find(),

            MedicineInventory.find(),

            ResourceTransfer.countDocuments({
                status: "RECOMMENDED"
            }),

            BedDemandPrediction.find({
                riskLevel: {
                    $in: ["high", "critical"]
                }
            })
                .populate(
                    "hospitalId",
                    "name address"
                )
                .sort({
                    predictedForDate: 1
                })
        ]);

        // Hospitals with low current resources
        const lowResourceHospitals =
            hospitalResources.filter(
                (resource) => {
                    if (resource.total === 0) {
                        return false;
                    }

                    const availability =
                        resource.available /
                        resource.total;

                    return availability <= 0.2;
                }
            );

        // Medicines with low stock
        const lowMedicineStock =
            medicineInventory.filter(
                (inventory) =>
                    inventory.quantity <=
                    (inventory.minimumStock ?? 0)
            );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        totalHospitals,

                        lowResourceHospitals:
                            lowResourceHospitals.length,

                        lowMedicineStock:
                            lowMedicineStock.length,

                        pendingTransfers,

                        criticalBedPredictions,

                        summary: {
                            hospitalsWithLowResources:
                                lowResourceHospitals,

                            medicinesWithLowStock:
                                lowMedicineStock
                        }
                    },
                    "Authority dashboard retrieved successfully"
                )
            );
    }
);