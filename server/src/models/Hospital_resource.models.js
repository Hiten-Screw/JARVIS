import mongoose, { Schema } from "mongoose";

const hospitalResourceSchema = new Schema(
    {
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },

        resourceType: {
            type: String,
            required: true,
            enum: [
                "generalBed",
                "icuBed",
                "emergencyBed",
                "ventilator",
                "oxygen"
            ]
        },

        total: {
            type: Number,
            required: true,
            min: 0
        },

        available: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

hospitalResourceSchema.index(
    { hospitalId: 1, resourceType: 1 },
    { unique: true }
);

export const HospitalResource = mongoose.model(
    "HospitalResource",
    hospitalResourceSchema
);