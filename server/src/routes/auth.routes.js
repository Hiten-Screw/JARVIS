import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getHospitalStaff,
  createHospitalStaff,
  removeHospitalStaff,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/staff").get(verifyJWT, authorizeRoles("HOSPITAL_ADMIN"), getHospitalStaff).post(verifyJWT, authorizeRoles("HOSPITAL_ADMIN"), createHospitalStaff);
router.route("/staff/:id").delete(verifyJWT, authorizeRoles("HOSPITAL_ADMIN"), removeHospitalStaff);

export default router;