import { Router } from "express";

import {
    createTransfer,
    getTransfers,
    getTransferById,
    approveTransfer,
    rejectTransfer,
    completeTransfer
} from "../controllers/resourceTransfer.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();


// Create transfer recommendation
router
    .route("/")
    .post(
        verifyJWT,
        authorizeRoles("AUTHORITY"),
        createTransfer
    );


// Get all transfers
router
    .route("/")
    .get(
        verifyJWT,
        authorizeRoles(
            "AUTHORITY",
            "HOSPITAL_ADMIN"
        ),
        getTransfers
    );


// Get one transfer
router
    .route("/:id")
    .get(
        verifyJWT,
        authorizeRoles(
            "AUTHORITY",
            "HOSPITAL_ADMIN"
        ),
        getTransferById
    );


// Approve
router
    .route("/:id/approve")
    .patch(
        verifyJWT,
        authorizeRoles("AUTHORITY"),
        approveTransfer
    );


// Reject
router
    .route("/:id/reject")
    .patch(
        verifyJWT,
        authorizeRoles("AUTHORITY"),
        rejectTransfer
    );


// Complete
router
    .route("/:id/complete")
    .patch(
        verifyJWT,
        authorizeRoles("AUTHORITY"),
        completeTransfer
    );

export default router;