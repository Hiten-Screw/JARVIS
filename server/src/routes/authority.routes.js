import { Router } from "express";

import {
    getAuthorityDashboard
} from "../controllers/authority.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router
    .route("/dashboard")
    .get(
        verifyJWT,
        authorizeRoles("SUPER_ADMIN"),
        getAuthorityDashboard
    );

export default router;