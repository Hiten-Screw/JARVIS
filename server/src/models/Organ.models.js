import mongoose, { Schema } from "mongoose";

const organSchema = new Schema(
    {
        donorId: {
            type: Schema.Types.ObjectId,
            ref: "Donor",
            required: true
        },

        organType: {
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

        status: {
            type: String,
            enum: [
                "registered",
                "available",
                "reserved",
                "allocated",
                "transplanted",
                "unavailable"
            ],
            default: "registered"
        },

        availableDate: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

export const Organ = mongoose.model("Organ", organSchema);