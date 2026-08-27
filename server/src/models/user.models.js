import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: [
                "SUPER_ADMIN",
                "HOSPITAL_ADMIN",
                "INVENTORY_STAFF",
                "NURSE",
                "DOCTOR"
            ],
            default: "NURSE",
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

userSchema.index(
    { hospitalId: 1, userId: 1 },
    { unique: true }
);

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return;

    if (
        this.password.startsWith("$2b$") ||
        this.password.startsWith("$2a$") ||
        this.password.startsWith("$2y$")
    ) return;

    this.password = await bcrypt.hash(this.password, 10);
});

export const User = mongoose.model("User", userSchema);