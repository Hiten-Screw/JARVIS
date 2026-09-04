import mongoose from "mongoose";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse";

import { Hospital } from "./src/models/Hospital.models.js";
import { User } from "./src/models/user.models.js";
import { HospitalResource } from "./src/models/Hospital_resource.models.js";
import { BloodStock } from "./src/models/BloodStock.models.js";
import { Medicine } from "./src/models/Medicine.models.js";
import { MedicineInventory } from "./src/models/MedicineInventory.models.js";
import { ResourceTransfer } from "./src/models/ResourceTransfer.models.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_PATH = path.resolve(__dirname, "../ml/hospital_master.csv");

const ESSENTIAL_MEDICINES = [
  { name: "Paracetamol 500mg", genericName: "Acetaminophen", category: "Analgesic / Antipyretic", manufacturer: "Cipla Ltd", unit: "tablet" },
  { name: "Amoxicillin 500mg", genericName: "Amoxicillin Trihydrate", category: "Antibiotic", manufacturer: "Sun Pharma", unit: "capsule" },
  { name: "Azithromycin 500mg", genericName: "Azithromycin", category: "Macrolide Antibiotic", manufacturer: "Zydus Cadila", unit: "tablet" },
  { name: "Insulin Regular 100IU", genericName: "Human Insulin", category: "Endocrine / Antidiabetic", manufacturer: "Novo Nordisk", unit: "vial" },
  { name: "Salbutamol Inhaler 100mcg", genericName: "Albuterol", category: "Bronchodilator", manufacturer: "GlaxoSmithKline", unit: "bottle" },
  { name: "Pantoprazole 40mg", genericName: "Pantoprazole Sodium", category: "Gastrointestinal (PPI)", manufacturer: "Lupin Ltd", unit: "tablet" },
  { name: "Atorvastatin 20mg", genericName: "Atorvastatin Calcium", category: "Cardiovascular / Statin", manufacturer: "Torrent Pharma", unit: "tablet" },
  { name: "Ceftriaxone Injection 1g", genericName: "Ceftriaxone Sodium", category: "Cephalosporin Antibiotic", manufacturer: "Alkem Labs", unit: "vial" },
  { name: "Dexamethasone 4mg", genericName: "Dexamethasone Sodium", category: "Corticosteroid", manufacturer: "Cadila Healthcare", unit: "vial" },
  { name: "Normal Saline IV 500ml", genericName: "Sodium Chloride 0.9%", category: "Intravenous Fluid", manufacturer: "Baxter India", unit: "bottle" },
  { name: "Metformin 500mg", genericName: "Metformin Hydrochloride", category: "Antidiabetic", manufacturer: "USV Ltd", unit: "tablet" },
  { name: "Amlodipine 5mg", genericName: "Amlodipine Besylate", category: "Antihypertensive", manufacturer: "Pfizer India", unit: "tablet" },
  { name: "Ciprofloxacin 500mg", genericName: "Ciprofloxacin", category: "Fluoroquinolone Antibiotic", manufacturer: "Bayer", unit: "tablet" },
  { name: "Ondansetron 4mg", genericName: "Ondansetron", category: "Antiemetic", manufacturer: "Dr. Reddy's", unit: "tablet" },
  { name: "Heparin Injection 5000IU", genericName: "Heparin Sodium", category: "Anticoagulant", manufacturer: "Biological E", unit: "vial" }
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

async function seedAll30k() {
  const startTime = Date.now();
  try {
    console.log("\n=======================================================");
    console.log(" SEEDING COMPLETE 30,000+ HOSPITALS DATASET INTO ATLAS ");
    console.log("=======================================================\n");

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in server/.env");
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connected to MongoDB Atlas cluster.");

    // Clear previous collections
    console.log("Clearing previous collections...");
    await Promise.all([
      Hospital.deleteMany({}),
      User.deleteMany({}),
      HospitalResource.deleteMany({}),
      BloodStock.deleteMany({}),
      Medicine.deleteMany({}),
      MedicineInventory.deleteMany({}),
      ResourceTransfer.deleteMany({})
    ]);
    console.log(" Operational collections cleared.");

    // 1. Seed Medicine Catalog
    console.log("Seeding Medicine Catalog (15 standard pharmaceuticals)...");
    const createdMedicines = await Medicine.insertMany(ESSENTIAL_MEDICINES);
    console.log(` Created ${createdMedicines.length} standard medicines in catalog.`);

    // 2. Create Super Admin
    console.log("Creating Super Admin account...");
    await User.create({
      userId: "superadmin",
      password: "123",
      role: "SUPER_ADMIN",
      hospitalId: null
    });
    console.log(" Super Admin created (userId: superadmin, password: 123)");

    // 3. Stream & Batch Insert Hospitals and Sub-collections
    console.log(`Streaming ${CSV_PATH}...`);

    const BATCH_SIZE = 1500;
    let hospitalBatch = [];
    let resourceBatch = [];
    let bloodBatch = [];
    let medicineBatch = [];
    let userBatch = [];

    let totalHospitalsProcessed = 0;
    let primaryHospitalId = null;

    const regionalAdminMap = {
      "delhi": "admin_delhi",
      "mumbai": "admin_mumbai",
      "bengaluru": "admin_bengaluru",
      "chennai": "admin_chennai",
      "kolkata": "admin_kolkata",
      "hyderabad": "admin_hyderabad",
      "ahmedabad": "admin_ahmedabad",
      "pune": "admin_pune",
      "jaipur": "admin_jaipur",
      "lucknow": "admin_lucknow",
      "chandigarh": "admin_chandigarh",
      "kochi": "admin_kochi",
      "patna": "admin_patna",
      "bhopal": "admin_bhopal",
      "bhubaneswar": "admin_bhubaneswar",
      "guwahati": "admin_guwahati"
    };
    const createdRegionalAdmins = new Set();

    async function flushBatches() {
      if (hospitalBatch.length === 0) return;

      await Promise.all([
        Hospital.insertMany(hospitalBatch, { ordered: false }),
        HospitalResource.insertMany(resourceBatch, { ordered: false }),
        BloodStock.insertMany(bloodBatch, { ordered: false }),
        MedicineInventory.insertMany(medicineBatch, { ordered: false })
      ]);

      totalHospitalsProcessed += hospitalBatch.length;
      process.stdout.write(`\r Seeding progress: ${totalHospitalsProcessed.toLocaleString()} hospitals inserted with resources, blood, and meds...`);

      hospitalBatch = [];
      resourceBatch = [];
      bloodBatch = [];
      medicineBatch = [];
    }

    const parser = fs.createReadStream(CSV_PATH).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true
      })
    );

    let rowIdx = 0;
    for await (const row of parser) {
      rowIdx++;
      const hObjId = new mongoose.Types.ObjectId();
      const hid = String(row.hospital_id || `HOSP-${1000 + rowIdx}`).trim();

      if (hid === "HOSP-101") {
        primaryHospitalId = hObjId;
      }

      let specializations = String(row.specialties || "General Medicine, Emergency, Pediatrics")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (specializations.length === 0) {
        specializations = ["General Medicine", "Emergency", "Cardiology"];
      }

      const isEmergency =
        String(row.emergency_services || "yes").toLowerCase().includes("yes") ||
        rowIdx % 2 === 0;

      let hType = "private";
      const catLower = String(row.hospital_category || "").toLowerCase();
      if (catLower.includes("govt") || catLower.includes("government") || catLower.includes("civil")) {
        hType = "government";
      } else if (catLower.includes("special")) {
        hType = "specialized";
      }

      const lat = Number(row.latitude) || 25.4358;
      const lng = Number(row.longitude) || 81.8463;

      hospitalBatch.push({
        _id: hObjId,
        hospitalId: hid,
        name: String(row.hospital_name || "Community Hospital").trim(),
        address: String(row.address || `${row.district || ""}, ${row.state || ""}`).trim(),
        location: {
          type: "Point",
          coordinates: [lng, lat]
        },
        contact: String(row.contact || "+91-532-2460123").trim(),
        specializations: specializations.slice(0, 6),
        emergencyDepartment: isEmergency,
        hospitalType: hType
      });

      const totalBeds = Math.max(25, Number(row.total_num_beds) || (40 + (rowIdx % 10) * 20));
      const availBeds = Math.max(3, Math.floor(totalBeds * (0.12 + (rowIdx % 5) * 0.04)));

      // 5 Hospital Resources
      resourceBatch.push(
        { hospitalId: hObjId, resourceType: "generalBed", total: totalBeds, available: availBeds },
        { hospitalId: hObjId, resourceType: "icuBed", total: Math.max(4, Math.floor(totalBeds * 0.15)), available: Math.max(1, Math.floor(totalBeds * 0.04)) },
        { hospitalId: hObjId, resourceType: "emergencyBed", total: Math.max(4, Math.floor(totalBeds * 0.1)), available: Math.max(1, Math.floor(totalBeds * 0.03)) },
        { hospitalId: hObjId, resourceType: "ventilator", total: Math.max(2, Math.floor(totalBeds * 0.08)), available: Math.max(1, Math.floor(totalBeds * 0.02)) },
        { hospitalId: hObjId, resourceType: "oxygen", total: Math.max(10, Math.floor(totalBeds * 0.6)), available: Math.max(3, Math.floor(totalBeds * 0.25)) }
      );

      // 8 Blood Stocks
      for (let bIdx = 0; bIdx < BLOOD_GROUPS.length; bIdx++) {
        bloodBatch.push({
          hospitalId: hObjId,
          bloodGroup: BLOOD_GROUPS[bIdx],
          currentStock: Math.floor(5 + ((rowIdx * 7 + bIdx * 3) % 25))
        });
      }

      // 15 Medicine Inventories
      for (let mIdx = 0; mIdx < createdMedicines.length; mIdx++) {
        const isLow = (rowIdx + mIdx) % 8 === 0;
        const qty = isLow ? 12 : 100 + ((rowIdx * 17 + mIdx * 23) % 300);
        medicineBatch.push({
          hospitalId: hObjId,
          medicineId: createdMedicines[mIdx]._id,
          quantity: qty,
          minimumStock: 35,
          unitPrice: 12.0 + (mIdx * 3.0),
          expiryDate: new Date(2027, (rowIdx + mIdx) % 12, 15)
        });
      }

      // HOSP-101 staff accounts
      if (hid === "HOSP-101") {
        userBatch.push(
          { userId: "admin", password: "123", role: "HOSPITAL_ADMIN", hospitalId: hObjId },
          { userId: "inventory101", password: "stock123", role: "INVENTORY_STAFF", hospitalId: hObjId },
          { userId: "nurse101", password: "nurse123", role: "NURSE", hospitalId: hObjId },
          { userId: "doctor101", password: "doctor123", role: "DOCTOR", hospitalId: hObjId }
        );
      }

      // Regional major city admin logins
      const dtKey = String(row.district || "").toLowerCase();
      const stKey = String(row.state || "").toLowerCase();
      for (const [cityKey, adminUsername] of Object.entries(regionalAdminMap)) {
        if ((dtKey.includes(cityKey) || stKey.includes(cityKey)) && !createdRegionalAdmins.has(adminUsername)) {
          createdRegionalAdmins.add(adminUsername);
          userBatch.push({
            userId: adminUsername,
            password: "123",
            role: "HOSPITAL_ADMIN",
            hospitalId: hObjId
          });
        }
      }

      if (hospitalBatch.length >= BATCH_SIZE) {
        await flushBatches();
      }
    }

    // Flush any remaining records
    await flushBatches();
    console.log(`\n\nAll batches inserted.`);

    // Insert staff & admin users
    if (userBatch.length > 0) {
      console.log(`Creating ${userBatch.length} staff and admin accounts...`);
      for (const u of userBatch) {
        await User.create(u);
      }
      console.log(` Created ${userBatch.length} user credentials.`);
    }

    const durationSec = Math.round((Date.now() - startTime) / 1000);

    const [hCount, uCount, rCount, bCount, mCount] = await Promise.all([
      Hospital.countDocuments(),
      User.countDocuments(),
      HospitalResource.countDocuments(),
      BloodStock.countDocuments(),
      MedicineInventory.countDocuments()
    ]);

    console.log("\n=======================================================");
    console.log(" SEEDING COMPLETE! FULL 30,000+ NETWORK NOW ACTIVE");
    console.log("=======================================================");
    console.log(` Total Hospitals:          ${hCount.toLocaleString()} facilities across India`);
    console.log(` Total Hospital Resources: ${rCount.toLocaleString()} bed/ICU/ventilator/oxygen records`);
    console.log(` Total Blood Stock Units:  ${bCount.toLocaleString()} blood stock records (8 blood groups per hospital)`);
    console.log(` Total Medicine Stocks:    ${mCount.toLocaleString()} pharmaceutical inventory records`);
    console.log(` Total User Credentials:   ${uCount} staff & admin accounts`);
    console.log(` Total Seeding Time:       ${durationSec} seconds`);
    console.log("=======================================================");
    console.log("Primary Demo Hospital Logins (HOSP-101 Prayagraj):");
    console.log("   - Admin:       userId: admin        | password: 123");
    console.log("   - Inventory:   userId: inventory101  | password: stock123");
    console.log("   - Nurse:       userId: nurse101      | password: nurse123");
    console.log("   - Doctor:      userId: doctor101     | password: doctor123");
    console.log("Super Admin Login (Global Access):");
    console.log("   - SuperAdmin:  userId: superadmin    | password: 123");
    console.log("Regional Admin Logins:");
    console.log("   - Delhi:       userId: admin_delhi       | password: 123");
    console.log("   - Mumbai:      userId: admin_mumbai      | password: 123");
    console.log("   - Bengaluru:   userId: admin_bengaluru   | password: 123");
    console.log("   - Kolkata:     userId: admin_kolkata     | password: 123");
    console.log("   - Chennai:     userId: admin_chennai     | password: 123");
    console.log("   - Hyderabad:   userId: admin_hyderabad   | password: 123");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed with error:", err);
    process.exit(1);
  }
}

seedAll30k();
