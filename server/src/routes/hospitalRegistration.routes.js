import { Router } from "express";
import {
    submitHospitalRegistration,
    getHospitalRegistrationRequests,
    approveHospitalRegistration,
    rejectHospitalRegistration
} from "../controllers/hospitalRegistration.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/", submitHospitalRegistration);
router.get("/", verifyJWT, authorizeRoles("SUPER_ADMIN"), getHospitalRegistrationRequests);
router.patch("/:id/approve", verifyJWT, authorizeRoles("SUPER_ADMIN"), approveHospitalRegistration);
router.patch("/:id/reject", verifyJWT, authorizeRoles("SUPER_ADMIN"), rejectHospitalRegistration);

export default router;
