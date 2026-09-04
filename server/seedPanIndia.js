import mongoose from "mongoose";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { Hospital } from "./src/models/Hospital.models.js";
import { User } from "./src/models/user.models.js";
import { HospitalResource } from "./src/models/Hospital_resource.models.js";
import { BloodStock } from "./src/models/BloodStock.models.js";
import { Medicine } from "./src/models/Medicine.models.js";
import { MedicineInventory } from "./src/models/MedicineInventory.models.js";
import { ResourceTransfer } from "./src/models/ResourceTransfer.models.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATASET_JSON_PATH = path.resolve(__dirname, "pan_india_400_hospitals.json");

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

async function seedPanIndia400() {
  try {
    console.log("\n=======================================================");
    console.log(" SEEDING 400 PAN-INDIA HOSPITALS ACROSS ALL MAJOR HUBS ");
    console.log("=======================================================\n");

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in server/.env");
    }

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connected to MongoDB Atlas cluster.");

    // Clean existing operational collections for fresh consistent state
    console.log("Clearing operational collections...");
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

    // 2. Create Global Super Admin
    console.log("Creating Super Admin account...");
    await User.create({
      userId: "superadmin",
      password: "123",
      role: "SUPER_ADMIN",
      hospitalId: null
    });
    console.log(" Super Admin created (userId: superadmin, password: 123)");

    // 3. Load 400 Curated Pan-India Hospitals from JSON
    if (!fs.existsSync(DATASET_JSON_PATH)) {
      throw new Error(`Dataset file not found at ${DATASET_JSON_PATH}. Run generate_pan_india_dataset.py first.`);
    }

    const rawData = fs.readFileSync(DATASET_JSON_PATH, "utf-8");
    const hospitalsList = JSON.parse(rawData);
    console.log(`Loaded ${hospitalsList.length} hospitals from pan-India dataset.`);

    const hospitalDocs = [];
    const resourceDocs = [];
    const bloodDocs = [];
    const medicineDocs = [];
    const userDocs = [];

    // Map of major cities to create regional administrator logins
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

    for (let idx = 0; idx < hospitalsList.length; idx++) {
      const h = hospitalsList[idx];
      const hObjId = new mongoose.Types.ObjectId();

      let specializations = Array.isArray(h.specialties)
        ? h.specialties
        : String(h.specialties || "General Medicine, Emergency, Pediatrics")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

      if (specializations.length === 0) {
        specializations = ["Emergency", "General Medicine", "Cardiology", "Trauma Care"];
      }

      const isEmergency =
        String(h.emergency_services || "yes").toLowerCase().includes("yes") ||
        idx % 2 === 0;

      let hType = "private";
      const catLower = String(h.hospital_category || "").toLowerCase();
      if (catLower.includes("govt") || catLower.includes("government") || catLower.includes("civil")) {
        hType = "government";
      } else if (catLower.includes("special")) {
        hType = "specialized";
      }

      hospitalDocs.push({
        _id: hObjId,
        hospitalId: h.hospital_id,
        name: h.hospital_name,
        address: h.address,
        location: {
          type: "Point",
          coordinates: [Number(h.longitude), Number(h.latitude)] // [lng, lat] GeoJSON
        },
        contact: h.contact || "+91-532-2460123",
        specializations: specializations.slice(0, 7),
        emergencyDepartment: isEmergency,
        hospitalType: hType
      });

      const totalBeds = Math.max(30, Number(h.total_num_beds) || (50 + (idx % 12) * 25));
      const availBeds = Math.max(4, Math.floor(totalBeds * (0.12 + (idx % 5) * 0.04)));

      // 5 Resource records per hospital
      resourceDocs.push(
        { hospitalId: hObjId, resourceType: "generalBed", total: totalBeds, available: availBeds },
        { hospitalId: hObjId, resourceType: "icuBed", total: Math.max(4, Math.floor(totalBeds * 0.15)), available: Math.max(1, Math.floor(totalBeds * 0.04)) },
        { hospitalId: hObjId, resourceType: "emergencyBed", total: Math.max(4, Math.floor(totalBeds * 0.1)), available: Math.max(1, Math.floor(totalBeds * 0.03)) },
        { hospitalId: hObjId, resourceType: "ventilator", total: Math.max(2, Math.floor(totalBeds * 0.08)), available: Math.max(1, Math.floor(totalBeds * 0.02)) },
        { hospitalId: hObjId, resourceType: "oxygen", total: Math.max(12, Math.floor(totalBeds * 0.6)), available: Math.max(4, Math.floor(totalBeds * 0.25)) }
      );

      // 8 Blood Stock records per hospital
      for (let bIdx = 0; bIdx < BLOOD_GROUPS.length; bIdx++) {
        bloodDocs.push({
          hospitalId: hObjId,
          bloodGroup: BLOOD_GROUPS[bIdx],
          currentStock: Math.floor(6 + ((idx * 7 + bIdx * 5) % 25))
        });
      }

      // 15 Medicine Inventory records per hospital
      for (let mIdx = 0; mIdx < createdMedicines.length; mIdx++) {
        const isShortage = (idx + mIdx) % 7 === 0;
        const qty = isShortage ? 12 : 120 + ((idx * 19 + mIdx * 23) % 320);
        medicineDocs.push({
          hospitalId: hObjId,
          medicineId: createdMedicines[mIdx]._id,
          quantity: qty,
          minimumStock: 35,
          unitPrice: 12.0 + (mIdx * 3.5),
          expiryDate: new Date(2027, (idx + mIdx) % 12, 15)
        });
      }

      // Standard Staff Logins for Primary Demo Facility: HOSP-101
      if (h.hospital_id === "HOSP-101") {
        userDocs.push(
          { userId: "admin", password: "123", role: "HOSPITAL_ADMIN", hospitalId: hObjId },
          { userId: "inventory101", password: "stock123", role: "INVENTORY_STAFF", hospitalId: hObjId },
          { userId: "nurse101", password: "nurse123", role: "NURSE", hospitalId: hObjId },
          { userId: "doctor101", password: "doctor123", role: "DOCTOR", hospitalId: hObjId }
        );
      }

      // Regional Admin user credentials for key metropolitan centers
      const districtKey = String(h.district || "").toLowerCase();
      const stateKey = String(h.state || "").toLowerCase();
      for (const [cityKey, adminUsername] of Object.entries(regionalAdminMap)) {
        if ((districtKey.includes(cityKey) || stateKey.includes(cityKey)) && !createdRegionalAdmins.has(adminUsername)) {
          createdRegionalAdmins.add(adminUsername);
          userDocs.push({
            userId: adminUsername,
            password: "123",
            role: "HOSPITAL_ADMIN",
            hospitalId: hObjId
          });
        }
      }
    }

    // High performance bulk insertion
    console.log(`Inserting ${hospitalDocs.length} Hospital documents...`);
    await Hospital.insertMany(hospitalDocs, { ordered: false });
    console.log(` Inserted ${hospitalDocs.length} Hospitals.`);

    console.log(`Inserting ${resourceDocs.length} HospitalResource documents...`);
    await HospitalResource.insertMany(resourceDocs, { ordered: false });
    console.log(` Inserted ${resourceDocs.length} HospitalResources.`);

    console.log(`Inserting ${bloodDocs.length} BloodStock documents...`);
    await BloodStock.insertMany(bloodDocs, { ordered: false });
    console.log(` Inserted ${bloodDocs.length} BloodStocks.`);

    console.log(`Inserting ${medicineDocs.length} MedicineInventory documents...`);
    await MedicineInventory.insertMany(medicineDocs, { ordered: false });
    console.log(` Inserted ${medicineDocs.length} MedicineInventories.`);

    if (userDocs.length > 0) {
      console.log(`Creating ${userDocs.length} user accounts...`);
      for (const u of userDocs) {
        await User.create(u);
      }
      console.log(` Created ${userDocs.length} user accounts.`);
    }

    // Verification queries
    const [hCount, uCount, rCount, bCount, mCount] = await Promise.all([
      Hospital.countDocuments(),
      User.countDocuments(),
      HospitalResource.countDocuments(),
      BloodStock.countDocuments(),
      MedicineInventory.countDocuments()
    ]);

    console.log("\n=======================================================");
    console.log(" SEEDING COMPLETE! 400 PAN-INDIA NETWORK FULLY ACTIVE");
    console.log("=======================================================");
    console.log(` Total Hospitals:          ${hCount} facilities across all 36 Indian states & UTs`);
    console.log(` Total Hospital Resources: ${rCount} resource records (general/ICU beds, ventilators, oxygen)`);
    console.log(` Total Blood Stock Units:  ${bCount} blood stock records (8 blood groups per hospital)`);
    console.log(` Total Medicine Stocks:    ${mCount} pharmaceutical inventory records`);
    console.log(` Total User Credentials:   ${uCount} staff & admin accounts`);
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

seedPanIndia400();
