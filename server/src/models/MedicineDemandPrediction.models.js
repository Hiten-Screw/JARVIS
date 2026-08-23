import mongoose, { Schema } from "mongoose";

const medicineDemandPredictionSchema = new Schema(
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

        // When prediction was generated
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

        // Predicted medicine requirement
        predictedDemand: {
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

        // Risk of medicine shortage
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

medicineDemandPredictionSchema.index(
    {
        hospitalId: 1,
        medicineId: 1,
        predictedForDate: 1
    },
    {
        unique: true
    }
);

export const MedicineDemandPrediction = mongoose.model(
    "MedicineDemandPrediction",
    medicineDemandPredictionSchema
);