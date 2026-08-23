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

        // Diseases/departments treated by the hospital
        specializations: {
            type: [String],
            default: []
        }
    },
    {
        timestamps: true
    }
);

// Required for nearby-hospital queries
hospitalSchema.index({ location: "2dsphere" });

export const Hospital = mongoose.model("Hospital", hospitalSchema);