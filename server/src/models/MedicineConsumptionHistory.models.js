import mongoose, { Schema } from "mongoose";

const medicineConsumptionHistorySchema = new Schema(
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

        date: {
            type: Date,
            required: true
        },

        openingStock: {
            type: Number,
            required: true,
            min: 0
        },

        received: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        consumed: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        closingStock: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

//closingStock = openingStock + received - consumed



//"For each hospital, a particular medicine can have only one consumption-history record for a particular date."
medicineConsumptionHistorySchema.index(
    { hospitalId: 1, medicineId: 1, date: 1 },
    { unique: true }
);

export const MedicineConsumptionHistory = mongoose.model(
    "MedicineConsumptionHistory",
    medicineConsumptionHistorySchema
);