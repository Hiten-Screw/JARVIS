import { Router } from "express";

import {
    searchHospitals
} from "../controllers/hospitalSearch.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
    .route("/")
    .get(
        verifyJWT,
        searchHospitals
    );

export default router;