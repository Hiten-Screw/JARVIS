import mongoose, { Schema } from "mongoose";

const bloodStockSchema = new Schema(
    {
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: "Hospital",
            required: true
        },
        bloodGroup: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
            required: true
        },
        currentStock: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { timestamps: true }
);

bloodStockSchema.index({ hospitalId: 1, bloodGroup: 1 }, { unique: true });

export const BloodStock = mongoose.model("BloodStock", bloodStockSchema);
