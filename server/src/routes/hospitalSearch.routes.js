import { Router } from "express";
import { searchHospitals } from "../controllers/hospitalSearch.controller.js";

const router = Router();

router.route("/").get(searchHospitals);

export default router;