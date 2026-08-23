import mongoose, { Schema } from "mongoose";

const bedOccupancyHistorySchema = new Schema(
    {
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        // General beds
        totalBeds: {
            type: Number,
            required: true,
            min: 0
        },

        occupiedBeds: {
            type: Number,
            required: true,
            min: 0
        },

        availableBeds: {
            type: Number,
            required: true,
            min: 0
        },

        // ICU beds
        totalICU: {
            type: Number,
            required: true,
            min: 0
        },

        occupiedICU: {
            type: Number,
            required: true,
            min: 0
        },

        availableICU: {
            type: Number,
            required: true,
            min: 0
        },

        // Emergency beds
        totalEmergencyBeds: {
            type: Number,
            required: true,
            min: 0
        },

        occupiedEmergencyBeds: {
            type: Number,
            required: true,
            min: 0
        },

        availableEmergencyBeds: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

bedOccupancyHistorySchema.index(
    { hospitalId: 1, date: 1 },
    { unique: true }
);

export const BedOccupancyHistory = mongoose.model(
    "BedOccupancyHistory",
    bedOccupancyHistorySchema
);