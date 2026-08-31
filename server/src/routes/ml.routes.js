import { Router } from "express";
import {
  getHospitalRecommendations,
  getOutbreakSurveillance,
  getBedDemandForecasts
} from "../controllers/ml.controller.js";

const router = Router();

// ML Recommendations (XGBoost matching)
router.route("/recommend").get(getHospitalRecommendations).post(getHospitalRecommendations);

// Epidemiological Outbreak Surveillance
router.route("/outbreak").get(getOutbreakSurveillance);

// Bed Demand & Surge Forecasting
router.route("/forecasts").get(getBedDemandForecasts).post(getBedDemandForecasts);

export default router;
