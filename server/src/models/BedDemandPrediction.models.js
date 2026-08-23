import mongoose, { Schema } from "mongoose";

const bedDemandPredictionSchema = new Schema(
    {
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },

        // When the prediction was generated
        predictionDate: {
            type: Date,
            required: true,
            default: Date.now
        },

        // Date for which demand is predicted
        predictedForDate: {
            type: Date,
            required: true
        },

        // Predicted general-bed demand
        predictedBeds: {
            type: Number,
            required: true,
            min: 0
        },

        // Predicted ICU-bed demand
        predictedICUBeds: {
            type: Number,
            required: true,
            min: 0
        },

        // Predicted emergency-bed demand
        predictedEmergencyBeds: {
            type: Number,
            required: true,
            min: 0
        },

        // Model confidence: 0 to 1
        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 1
        },

        // Risk classification
        riskLevel: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            required: true
        },

        // ML model version
        modelVersion: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);

bedDemandPredictionSchema.index(
    {
        hospitalId: 1,
        predictedForDate: 1
    },
    {
        unique: true
    }
);

export const BedDemandPrediction = mongoose.model(
    "BedDemandPrediction",
    bedDemandPredictionSchema
);