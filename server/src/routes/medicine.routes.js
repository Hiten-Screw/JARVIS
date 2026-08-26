import { Router } from "express";

import {
    createMedicine,
    updateInventory,
    logConsumption,
    getMedicinePredictions
} from "../controllers/medicine.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();


// Global medicine master catalog
// Authority only
router
    .route("/")
    .post(
        verifyJWT,
        authorizeRoles("AUTHORITY"),
        createMedicine
    );


// Hospital medicine inventory
// Hospital Admin / Authority
router
    .route("/inventory")
    .post(
        verifyJWT,
        authorizeRoles(
            "HOSPITAL_ADMIN",
            "AUTHORITY"
        ),
        updateInventory
    );


// Medicine consumption
// Hospital Admin only
router
    .route("/consumption")
    .post(
        verifyJWT,
        authorizeRoles("HOSPITAL_ADMIN"),
        logConsumption
    );


// ML medicine demand predictions
router
    .route("/predictions/:hospitalId")
    .get(
        verifyJWT,
        getMedicinePredictions
    );


export default router;