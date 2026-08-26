import { Donor } from "../models/Donor.models.js";
import { Organ } from "../models/Organ.models.js";
import { Recipient } from "../models/Recipient.models.js";
import { OrganMatch } from "../models/OrganMatch.models.js";
import { Hospital } from "../models/Hospital.models.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// Register current user as a donor
// POST /api/v1/donors
export const registerDonor = asyncHandler(async (req, res) => {
    const {
        bloodGroup,
        latitude,
        longitude,
        medicalDetails
    } = req.body;

    if (
        !bloodGroup ||
        latitude === undefined ||
        longitude === undefined
    ) {
        throw new ApiError(
            400,
            "Blood group, latitude and longitude are required"
        );
    }

    const existingDonor = await Donor.findOne({
        userId: req.user._id
    });

    if (existingDonor) {
        throw new ApiError(
            409,
            "You are already registered as a donor"
        );
    }

    const donor = await Donor.create({
        userId: req.user._id,
        bloodGroup,
        location: {
            type: "Point",
            coordinates: [
                Number(longitude),
                Number(latitude)
            ]
        },
        medicalDetails
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                donor,
                "Donor registered successfully"
            )
        );
});


// Get current user's donor profile
// GET /api/v1/donors/me
export const getMyDonorProfile = asyncHandler(async (req, res) => {
    const donor = await Donor.findOne({
        userId: req.user._id
    }).populate(
        "userId",
        "name email"
    );

    if (!donor) {
        throw new ApiError(
            404,
            "Donor profile not found"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                donor,
                "Donor profile retrieved successfully"
            )
        );
});


// Update donor profile
// PATCH /api/v1/donors/me
export const updateDonorProfile = asyncHandler(async (req, res) => {
    const {
        bloodGroup,
        latitude,
        longitude,
        medicalDetails,
        status
    } = req.body;

    const donor = await Donor.findOne({
        userId: req.user._id
    });

    if (!donor) {
        throw new ApiError(
            404,
            "Donor profile not found"
        );
    }

    if (bloodGroup !== undefined) {
        donor.bloodGroup = bloodGroup;
    }

    if (medicalDetails !== undefined) {
        donor.medicalDetails = medicalDetails;
    }

    if (
        latitude !== undefined &&
        longitude !== undefined
    ) {
        donor.location = {
            type: "Point",
            coordinates: [
                Number(longitude),
                Number(latitude)
            ]
        };
    }

    // Donor can make themselves unavailable,
    // but eligibility should normally be controlled
    // by the authority/medical team.
    if (status === "unavailable") {
        donor.status = "unavailable";
    }

    await donor.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                donor,
                "Donor profile updated successfully"
            )
        );
});


// Register an organ for the current donor
// POST /api/v1/donors/organs
export const registerOrgan = asyncHandler(async (req, res) => {
    const {
        organType,
        availableDate
    } = req.body;

    if (!organType) {
        throw new ApiError(
            400,
            "Organ type is required"
        );
    }

    const donor = await Donor.findOne({
        userId: req.user._id
    });

    if (!donor) {
        throw new ApiError(
            404,
            "Donor profile not found"
        );
    }

    if (
        donor.status === "notEligible" ||
        donor.status === "unavailable"
    ) {
        throw new ApiError(
            400,
            "Donor is not currently eligible"
        );
    }

    const organ = await Organ.create({
        donorId: donor._id,
        organType,
        availableDate
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                organ,
                "Organ registered successfully"
            )
        );
});


// Get organs belonging to current donor
// GET /api/v1/donors/organs
export const getMyOrgans = asyncHandler(async (req, res) => {
    const donor = await Donor.findOne({
        userId: req.user._id
    });

    if (!donor) {
        throw new ApiError(
            404,
            "Donor profile not found"
        );
    }

    const organs = await Organ.find({
        donorId: donor._id
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                organs,
                "Donor organs retrieved successfully"
            )
        );
});


// Register a recipient
// POST /api/v1/donors/recipients
export const registerRecipient = asyncHandler(async (req, res) => {
    const {
        requiredOrgan,
        bloodGroup,
        hospitalId,
        urgency
    } = req.body;

    if (
        !requiredOrgan ||
        !bloodGroup ||
        !hospitalId
    ) {
        throw new ApiError(
            400,
            "Required organ, blood group and hospital ID are required"
        );
    }

    const hospital = await Hospital.findById(hospitalId);

    if (!hospital) {
        throw new ApiError(
            404,
            "Hospital not found"
        );
    }

    const existingRecipient = await Recipient.findOne({
        userId: req.user._id
    });

    if (existingRecipient) {
        throw new ApiError(
            409,
            "Recipient profile already exists"
        );
    }

    const recipient = await Recipient.create({
        userId: req.user._id,
        requiredOrgan,
        bloodGroup,
        hospitalId,
        urgency
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                recipient,
                "Recipient registered successfully"
            )
        );
});


// Get current recipient profile
// GET /api/v1/donors/recipients/me
export const getMyRecipientProfile = asyncHandler(async (req, res) => {
    const recipient = await Recipient.findOne({
        userId: req.user._id
    }).populate(
        "hospitalId",
        "name address contact"
    );

    if (!recipient) {
        throw new ApiError(
            404,
            "Recipient profile not found"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                recipient,
                "Recipient profile retrieved successfully"
            )
        );
});


// Get organ matches for current recipient
// GET /api/v1/donors/matches
export const getMyMatches = asyncHandler(async (req, res) => {
    const recipient = await Recipient.findOne({
        userId: req.user._id
    });

    if (!recipient) {
        throw new ApiError(
            404,
            "Recipient profile not found"
        );
    }

    const matches = await OrganMatch.find({
        recipientId: recipient._id
    })
        .populate({
            path: "organId",
            populate: {
                path: "donorId",
                select: "bloodGroup location status"
            }
        })
        .sort({
            compatibilityScore: -1
        });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                matches,
                "Organ matches retrieved successfully"
            )
        );
});


// Update organ match status
// PATCH /api/v1/donors/matches/:id
export const updateMatchStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
        "underReview",
        "approved",
        "rejected",
        "allocated",
        "completed"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new ApiError(
            400,
            "Invalid match status"
        );
    }

    const match = await OrganMatch.findById(id);

    if (!match) {
        throw new ApiError(
            404,
            "Organ match not found"
        );
    }

    match.status = status;

    await match.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                match,
                "Organ match status updated successfully"
            )
        );
});