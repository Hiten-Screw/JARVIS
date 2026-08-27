import { Router } from "express";

import {
    createMedicine,
    getMedicines,
    getInventory,
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
    .get(verifyJWT, getMedicines)
    .post(
        verifyJWT,
        authorizeRoles("SUPER_ADMIN", "INVENTORY_STAFF"),
        createMedicine
    );

router
    .route("/inventory")
    .get(
        verifyJWT,
        authorizeRoles("SUPER_ADMIN", "HOSPITAL_ADMIN", "INVENTORY_STAFF"),
        getInventory
    )
    .post(
        verifyJWT,
        authorizeRoles("SUPER_ADMIN", "HOSPITAL_ADMIN", "INVENTORY_STAFF"),
        updateInventory
    );


// Medicine consumption
// Hospital Admin only
router
    .route("/consumption")
    .post(
        verifyJWT,
        authorizeRoles("HOSPITAL_ADMIN", "INVENTORY_STAFF"),
        logConsumption
    );

// ML predictions remain read-only and outside the current portal workflow.
router
    .route("/predictions/:hospitalId")
    .get(verifyJWT, getMedicinePredictions);


export default router;