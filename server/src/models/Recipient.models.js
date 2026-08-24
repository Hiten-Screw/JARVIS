import mongoose, { Schema } from "mongoose";

const recipientSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        requiredOrgan: {
            type: String,
            enum: [
                "kidney",
                "liver",
                "heart",
                "lung",
                "pancreas",
                "cornea"
            ],
            required: true
        },

        bloodGroup: {
            type: String,
            enum: [
                "A+",
                "A-",
                "B+",
                "B-",
                "AB+",
                "AB-",
                "O+",
                "O-"
            ],
            required: true
        },

        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },

        urgency: {
            type: String,
            enum: [
                "low",
                "medium",
                "high",
                "critical"
            ],
            default: "medium"
        },

        status: {
            type: String,
            enum: [
                "waiting",
                "matched",
                "allocated",
                "transplanted",
                "cancelled"
            ],
            default: "waiting"
        }
    },
    {
        timestamps: true
    }
);

export const Recipient = mongoose.model(
    "Recipient",
    recipientSchema
);