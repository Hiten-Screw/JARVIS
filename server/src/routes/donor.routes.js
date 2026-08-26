import { Router } from "express";

import {
    registerDonor,
    getMyDonorProfile,
    updateDonorProfile,
    registerOrgan,
    getMyOrgans,
    registerRecipient,
    getMyRecipientProfile,
    getMyMatches,
    updateMatchStatus
} from "../controllers/donor.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();


// Donor
router
    .route("/")
    .post(
        verifyJWT,
        authorizeRoles("PATIENT"),
        registerDonor
    );

router
    .route("/me")
    .get(
        verifyJWT,
        authorizeRoles("PATIENT"),
        getMyDonorProfile
    )
    .patch(
        verifyJWT,
        authorizeRoles("PATIENT"),
        updateDonorProfile
    );


// Organ
router
    .route("/organs")
    .post(
        verifyJWT,
        authorizeRoles("PATIENT"),
        registerOrgan
    )
    .get(
        verifyJWT,
        authorizeRoles("PATIENT"),
        getMyOrgans
    );


// Recipient
router
    .route("/recipients")
    .post(
        verifyJWT,
        authorizeRoles("PATIENT"),
        registerRecipient
    );

router
    .route("/recipients/me")
    .get(
        verifyJWT,
        authorizeRoles("PATIENT"),
        getMyRecipientProfile
    );


// Matches
router
    .route("/matches")
    .get(
        verifyJWT,
        authorizeRoles("PATIENT"),
        getMyMatches
    );

router
    .route("/matches/:id")
    .patch(
        verifyJWT,
        authorizeRoles("AUTHORITY"),
        updateMatchStatus
    );

export default router;