import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { User } from "../models/user.models.js";
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
        name,
        email,
        password,
        role,
        hospitalId
    } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(
            400,
            "Name, email, and password are required"
        );
    }

    const selectedRole = role || "PATIENT";

    if (!["PATIENT", "HOSPITAL_ADMIN", "AUTHORITY"].includes(selectedRole)) {
        throw new ApiError(400, "Invalid registration role");
    }

    if (selectedRole === "HOSPITAL_ADMIN" && !hospitalId) {
        throw new ApiError(
            400,
            "Hospital ID is required for hospital admin"
        );
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new ApiError(
            409,
            "User with this email already exists"
        );
    }

    const user = await User.create({
        name,
        email,
        password,
        role: selectedRole,
        hospitalId:
            selectedRole === "HOSPITAL_ADMIN"
                ? hospitalId
                : null
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
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(
            400,
            "Email and password are required"
        );
    }

    const user = await User.findOne({ email });

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