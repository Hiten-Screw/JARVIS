import { Router } from "express";
import { getBloodStock, updateBloodStock, useBloodStock } from "../controllers/blood.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();
const bloodRoles = ["SUPER_ADMIN", "HOSPITAL_ADMIN", "INVENTORY_STAFF"];

router.get("/:hospitalId", getBloodStock);
router.patch("/:hospitalId", verifyJWT, authorizeRoles(...bloodRoles), updateBloodStock);
router.post("/:hospitalId/use", verifyJWT, authorizeRoles("NURSE", "DOCTOR"), useBloodStock);

export default router;
