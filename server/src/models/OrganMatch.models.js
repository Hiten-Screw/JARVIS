import mongoose, { Schema } from "mongoose";

const organMatchSchema = new Schema(
    {
        organId: {
            type: Schema.Types.ObjectId,
            ref: "Organ",
            required: true
        },

        recipientId: {
            type: Schema.Types.ObjectId,
            ref: "Recipient",
            required: true
        },

        compatibilityScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        status: {
            type: String,
            enum: [
                "suggested",
                "underReview",
                "approved",
                "rejected",
                "allocated",
                "completed"
            ],
            default: "suggested"
        }
    },
    {
        timestamps: true
    }
);

organMatchSchema.index(
    {
        organId: 1,
        recipientId: 1
    },
    {
        unique: true
    }
);


export const OrganMatch = mongoose.model(
    "OrganMatch",
    organMatchSchema
);