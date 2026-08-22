import mongoose, { Schema } from "mongoose";

const medicineSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        genericName: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            trim: true
        },

        manufacturer: {
            type: String,
            required: true,
            trim: true
        },

        unit: {
            type: String,
            required: true,
            enum: [
                "tablet",
                "capsule",
                "bottle",
                "vial",
                "injection",
                "strip",
                "tube",
                "sachet"
            ]
        }
    },
    {
        timestamps: true
    }
);

export const Medicine = mongoose.model("Medicine", medicineSchema);