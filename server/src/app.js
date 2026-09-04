import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import hospitalRouter from "./routes/hospital.routes.js";
import resourceRouter from "./routes/resource.routes.js";
import bedRouter from "./routes/bed.routes.js";
import medicineRouter from "./routes/medicine.routes.js";
import hospitalSearchRouter from "./routes/hospitalSearch.routes.js";
import resourceTransferRouter from "./routes/resourceTransfer.routes.js";
import authorityRouter from "./routes/authority.routes.js";
import hospitalRegistrationRouter from "./routes/hospitalRegistration.routes.js";
import bloodRouter from "./routes/blood.routes.js";
import mlRouter from "./routes/ml.routes.js";
import agentRouter from "./routes/agent.routes.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Root & Health check endpoints
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "JARVIS HealthGrid API Server is running",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", uptime: process.uptime() });
});

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
app.use("/api/v1/ml", mlRouter);
app.use("/api/v1/agent", agentRouter);

export { app };