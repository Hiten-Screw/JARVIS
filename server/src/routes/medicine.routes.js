import { Router } from "express";

import {
    createMedicine,
    getMedicines,
    getInventory,
    getHospitalInventory,
    updateInventory,
    logConsumption,
    getMedicinePredictions
} from "../controllers/medicine.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router
    .route("/")
    .get(getMedicines)
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

router.route("/inventory/:hospitalId").get(getHospitalInventory);

router
    .route("/consumption")
    .post(
        verifyJWT,
        authorizeRoles("HOSPITAL_ADMIN", "INVENTORY_STAFF"),
        logConsumption
    );

router
    .route("/predictions/:hospitalId")
    .get(verifyJWT, getMedicinePredictions);

export default router;
