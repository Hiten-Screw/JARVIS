import { Router } from "express";

import {
    getHospitalResources,
    updateHospitalResource,
    updateResourceOccupancy
} from "../controllers/resource.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router
    .route("/:hospitalId")
    .get(
        getHospitalResources
    );

router
    .route("/:hospitalId/:resourceType")
    .patch(
        verifyJWT,
        authorizeRoles("HOSPITAL_ADMIN", "INVENTORY_STAFF", "NURSE", "DOCTOR", "SUPER_ADMIN"),
        updateHospitalResource
    );

router.patch(
    "/:hospitalId/:resourceType/occupancy",
    verifyJWT,
    authorizeRoles("NURSE", "DOCTOR"),
    updateResourceOccupancy
);

export default router;