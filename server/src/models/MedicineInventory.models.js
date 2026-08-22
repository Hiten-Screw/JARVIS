import mongoose, { Schema } from "mongoose";

const medicineInventorySchema = new Schema(
    {
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },

        medicineId: {
            type: Schema.Types.ObjectId,
            ref: "Medicine",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 0
        },

        minimumStock: {
            type: Number,
            required: true,
            min: 0
        },

        expiryDate: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// One medicine should have only one inventory record per hospital
medicineInventorySchema.index(
    { hospitalId: 1, medicineId: 1 },
    { unique: true }
);

export const MedicineInventory = mongoose.model(
    "MedicineInventory",
    medicineInventorySchema
);