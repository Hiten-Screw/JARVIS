import { Router } from "express";
import {
  logBedOccupancy,
  getOccupancyHistory,
  getBedDemandPredictions,
} from "../controllers/bed.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Log bed occupancy (Hospital Admin / Authority)
router
  .route("/occupancy")
  .post(
    verifyJWT,
    authorizeRoles("HOSPITAL_ADMIN", "AUTHORITY"),
    logBedOccupancy
  );

// Read occupancy history and predictions
router
  .route("/occupancy-history/:hospitalId")
  .get(verifyJWT, getOccupancyHistory);

router
  .route("/predictions/:hospitalId")
  .get(verifyJWT, getBedDemandPredictions);

export default router;