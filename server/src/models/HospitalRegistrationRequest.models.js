import mongoose, { Schema } from "mongoose";

const hospitalRegistrationRequestSchema = new Schema(
    {
        hospitalId: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        name: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        location: {
            type: { type: String, enum: ["Point"], default: "Point", required: true },
            coordinates: { type: [Number], required: true }
        },
        contact: { type: String, required: true, trim: true },
        specializations: [{ type: String, trim: true }],
        emergencyDepartment: { type: Boolean, default: false },
        hospitalType: {
            type: String,
            enum: ["government", "private", "specialized", "other"],
            required: true
        },
        adminUserId: { type: String, required: true, trim: true },
        adminPassword: { type: String, required: true },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING"
        },
        reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        reviewedAt: { type: Date, default: null },
        rejectionReason: { type: String, trim: true, default: null }
    },
    { timestamps: true }
);

hospitalRegistrationRequestSchema.index({ hospitalId: 1 }, { unique: true });

export const HospitalRegistrationRequest = mongoose.model(
    "HospitalRegistrationRequest",
    hospitalRegistrationRequestSchema
);
