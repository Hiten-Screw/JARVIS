import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js"
import hospitalRouter from "./routes/hospital.routes.js"
import resourceRouter from "./routes/resource.routes.js";
import bedRouter from "./routes/bed.routes.js";
import medicineRouter from "./routes/medicine.routes.js";
import hospitalSearchRouter from "./routes/hospitalSearch.routes.js";
import resourceTransferRouter from "./routes/resourceTransfer.routes.js";
import authorityRouter from "./routes/authority.routes.js";
import hospitalRegistrationRouter from "./routes/hospitalRegistration.routes.js";
import bloodRouter from "./routes/blood.routes.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : ["http://localhost:5173", "https://localhost:5173", "http://127.0.0.1:5173", "https://127.0.0.1:5173"];

app.use(
    cors({
                origin: allowedOrigins,
        credentials: true
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/hospitals", hospitalRouter);
app.use("/api/v1/resources", resourceRouter);
app.use("/api/v1/beds", bedRouter);
app.use("/api/v1/medicines", medicineRouter);
app.use("/api/v1/search", hospitalSearchRouter);
app.use("/api/v1/transfers", resourceTransferRouter);
app.use("/api/v1/authority", authorityRouter);
app.use("/api/v1/hospital-registration", hospitalRegistrationRouter);
app.use("/api/v1/blood", bloodRouter);

export { app };