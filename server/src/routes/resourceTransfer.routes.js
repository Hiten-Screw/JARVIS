import { Router } from "express";
import {
  createTransfer,
  autoRecommendTransfer,
  getTransfers,
  getTransferById,
  approveTransfer,
  rejectTransfer,
  completeTransfer
} from "../controllers/resourceTransfer.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// Auto recommend / request transfer from surplus hospital
router.route("/auto-recommend").post(autoRecommendTransfer);

// Create transfer recommendation manually
router.route("/").post(createTransfer);

// Get all transfers
router.route("/").get(getTransfers);

// Get one transfer
router.route("/:id").get(getTransferById);

// Approve transfer
router.route("/:id/approve").patch(approveTransfer);

// Reject transfer
router.route("/:id/reject").patch(rejectTransfer);

// Complete transfer
router.route("/:id/complete").patch(completeTransfer);

export default router;