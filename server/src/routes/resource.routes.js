import { Router } from "express";

import {
    getHospitalResources,
    updateHospitalResource
} from "../controllers/resource.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router
    .route("/:hospitalId")
    .get(
        verifyJWT,
        getHospitalResources
    );

router
    .route("/:hospitalId/:resourceType")
    .patch(
        verifyJWT,
        authorizeRoles("HOSPITAL_ADMIN", "AUTHORITY"),
        updateHospitalResource
    );

export default router;