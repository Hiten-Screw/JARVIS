import mongoose, { Schema } from "mongoose";

const hospitalSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        // Hospital's geographical location
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
                default: "Point"
            },

            // GeoJSON format: [longitude, latitude]
            coordinates: {
                type: [Number],
                required: true
            }
        },

        contact: {
            type: String,
            required: true,
            trim: true
        },

        // Diseases/departments the hospital specializes in
        specializations: {
            type: [String],
            default: []
        },

        totalBeds: {
            type: Number,
            required: true,
            min: 0
        },

        icuBeds: {
            type: Number,
            required: true,
            min: 0
        },

        emergencyBeds: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

// Required for MongoDB geospatial queries
hospitalSchema.index({ location: "2dsphere" });

export const Hospital = mongoose.model("Hospital", hospitalSchema);