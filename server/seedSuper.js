import mongoose from "mongoose";
import "dotenv/config";
import { User } from "./src/models/user.models.js";

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas...");

    const existingAdmin = await User.findOne({ role: "SUPER_ADMIN" });
    if (existingAdmin) {
      console.log("Superadmin already exists. Exiting.");
      process.exit(0);
    }

    await User.create({
      userId: "superadmin",
      password: "Super123",
      role: "SUPER_ADMIN",
      hospitalId: null
    });

    console.log("✅ SuperAdmin successfully created!");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed superadmin:", error);
    process.exit(1);
  }
}

createSuperAdmin();