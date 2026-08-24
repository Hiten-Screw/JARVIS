import mongoose, { Schema } from "mongoose";

const resourceTransferSchema = new Schema(
    {
        fromHospital: {
            type: Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },

        toHospital: {
            type: Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },

        resourceType: {
            type: String,
            required: true,
            enum: [
                "medicine",
                "blood",
                "oxygen",
                "equipment"
            ]
        },

        resourceId: {
            type: Schema.Types.ObjectId,
            ref: "HospitalResource"
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: [
                "requested",
                "approved",
                "rejected",
                "inTransit",
                "completed",
                "cancelled"
            ],
            default: "requested"
        },

        requestedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },

        completedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

export const ResourceTransfer = mongoose.model(
    "ResourceTransfer",
    resourceTransferSchema
);