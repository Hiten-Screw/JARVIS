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
import donorRouter from "./routes/donor.routes.js";
import authorityRouter from "./routes/authority.routes.js";

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
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
app.use("/api/v1/donors", donorRouter);
app.use("/api/v1/authority", authorityRouter);

export { app };