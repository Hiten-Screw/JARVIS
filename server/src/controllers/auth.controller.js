import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { User } from "../models/user.models.js";
import { Hospital } from "../models/Hospital.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateToken = (userId) => {
    return jwt.sign(
        { _id: userId },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d"
        }
    );
};

export const registerUser = asyncHandler(async (req, res) => {
    const {
        userId,
        password,
        role,
        hospitalId
    } = req.body;
    const normalizedHospitalId = hospitalId?.trim().toUpperCase();

    if (!userId || !password) {
        throw new ApiError(
            400,
            "User ID and password are required"
        );
    }

    const selectedRole = role || "NURSE";

    if (!["HOSPITAL_ADMIN", "INVENTORY_STAFF", "NURSE", "DOCTOR"].includes(selectedRole)) {
        throw new ApiError(400, "Invalid registration role");
    }

    if (selectedRole !== "SUPER_ADMIN" && !normalizedHospitalId) {
        throw new ApiError(
            400,
            "Hospital ID is required for hospital admin"
        );
    }

    const hospital = selectedRole === "SUPER_ADMIN"
        ? null
        : await Hospital.findOne({ hospitalId: normalizedHospitalId });

    if (selectedRole !== "SUPER_ADMIN" && !hospital) {
        throw new ApiError(404, "Hospital ID not found");
    }

    const existingUser = await User.findOne({
        hospitalId: hospital?._id,
        userId
    });

    if (existingUser) {
        throw new ApiError(
            409,
            "User with this ID already exists"
        );
    }

    const user = await User.create({
        userId,
        password,
        role: selectedRole,
        hospitalId: hospital?._id || null
    });

    const createdUser = await User
        .findById(user._id)
        .select("-password");

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdUser,
                "User registered successfully"
            )
        );
});

export const loginUser = asyncHandler(async (req, res) => {
    const { userId, password, hospitalId } = req.body;
    const normalizedHospitalId = hospitalId?.trim().toUpperCase();

    if (!userId || !password) {
        throw new ApiError(
            400,
            "User ID and password are required"
        );
    }

    const hospital = normalizedHospitalId
        ? await Hospital.findOne({ hospitalId: normalizedHospitalId })
        : null;

    const user = await User.findOne(
        hospital
            ? { hospitalId: hospital._id, userId }
            : { userId, role: "SUPER_ADMIN" }
    );

    if (!user) {
        throw new ApiError(
            401,
            "Invalid user credentials"
        );
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new ApiError(
            401,
            "Invalid user credentials"
        );
    }

    const token = generateToken(user._id);

    const loggedInUser = await User
        .findById(user._id)
        .select("-password");

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .cookie("accessToken", token, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    token
                },
                "User logged in successfully"
            )
        );
});

export const logoutUser = asyncHandler(async (req, res) => {
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        );
});

export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetched successfully"
            )
        );
});

export const getHospitalStaff = asyncHandler(async (req, res) => {
    const staff = await User.find({ hospitalId: req.user.hospitalId })
        .select("-password")
        .sort({ userId: 1 });
    return res.status(200).json(new ApiResponse(200, staff, "Hospital staff retrieved successfully"));
});

export const createHospitalStaff = asyncHandler(async (req, res) => {
    const { userId, password, role } = req.body;
    const allowedRoles = ["INVENTORY_STAFF", "NURSE", "DOCTOR"];
    if (!userId || !password || !allowedRoles.includes(role)) {
        throw new ApiError(400, "User ID, password, and a valid staff role are required");
    }
    const existing = await User.findOne({ hospitalId: req.user.hospitalId, userId });
    if (existing) throw new ApiError(409, "This user ID already exists in your hospital");
    const staff = await User.create({ userId, password, role, hospitalId: req.user.hospitalId });
    return res.status(201).json(new ApiResponse(201, await User.findById(staff._id).select("-password"), "Staff account created successfully"));
});

export const removeHospitalStaff = asyncHandler(async (req, res) => {
    const staff = await User.findOneAndDelete({ _id: req.params.id, hospitalId: req.user.hospitalId, role: { $in: ["INVENTORY_STAFF", "NURSE", "DOCTOR"] } });
    if (!staff) throw new ApiError(404, "Staff account not found");
    return res.status(200).json(new ApiResponse(200, {}, "Staff account removed successfully"));
});