import { Router } from "express";
import {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
} from "../controllers/hospital.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Public / Authenticated read routes
router.route("/").get(getHospitals);
router.route("/:id").get(getHospitalById);

// Protected write routes (AUTHORITY only)
router
  .route("/")
  .post(verifyJWT, authorizeRoles("SUPER_ADMIN"), createHospital);

router
  .route("/:id")
  .patch(verifyJWT, authorizeRoles("SUPER_ADMIN"), updateHospital);

export default router;