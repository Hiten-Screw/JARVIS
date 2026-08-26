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

        medicine: {
            type: Schema.Types.ObjectId,
            ref: "Medicine",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        status: {
            type: String,
            enum: [
                "RECOMMENDED",
                "APPROVED",
                "REJECTED",
                "COMPLETED"
            ],
            default: "RECOMMENDED"
        },

        approvedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        transferDate: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

export const ResourceTransfer =
    mongoose.model("ResourceTransfer", resourceTransferSchema);