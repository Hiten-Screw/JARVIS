import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["PATIENT", "HOSPITAL_ADMIN", "AUTHORITY"],
            default: "PATIENT",
            required: true
        },

        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: "Hospital",
            default: null
        }
    },
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

export const User = mongoose.model("User", userSchema);