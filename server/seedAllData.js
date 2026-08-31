import mongoose from "mongoose";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "csv-parse/sync";

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
  { name: "Normal Saline IV 500ml", genericName: "Sodium Chloride 0.9%", category: "Intravenous Fluid", manufacturer: "Baxter India", unit: "bottle" }
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

async function seedAll() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connected to MongoDB Atlas.");

    // Clean existing operational collections for fresh consistent state
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
    console.log(" Collections cleared.");

    // 1. Seed Medicine Catalog
    console.log("Seeding Medicine Catalog...");
    const createdMedicines = await Medicine.insertMany(ESSENTIAL_MEDICINES);
    console.log(` Created ${createdMedicines.length} standard medicines in catalog.`);

    // 2. Create Super Admin (Global Role)
    console.log("Creating Super Admin account...");
    await User.create({
      userId: "superadmin",
      password: "123",
      role: "SUPER_ADMIN",
      hospitalId: null
    });
    console.log(" Super Admin created (userId: superadmin, password: 123)");

    // 3. Seed Primary Demo Facility: HOSP-101 (Prayagraj Central Hospital)
    console.log("Creating Primary Demo Hospital (HOSP-101)...");
    const primaryHospital = await Hospital.create({
      hospitalId: "HOSP-101",
      name: "Prayagraj Central Civil Hospital",
      address: "45 MG Road, Civil Lines, Prayagraj, Uttar Pradesh",
      location: {
        type: "Point",
        coordinates: [81.8463, 25.4358] // [lng, lat]
      },
      contact: "+91-532-2460123",
      specializations: ["Emergency", "Cardiology", "Neurology", "General Medicine", "Trauma Care", "Pulmonology"],
      emergencyDepartment: true,
      hospitalType: "government"
    });

    // 4. Create Standard Staff Logins for HOSP-101
    console.log("Creating Staff logins for HOSP-101...");
    const staffAccounts = [
      { userId: "admin", password: "123", role: "HOSPITAL_ADMIN", hospitalId: primaryHospital._id },
      { userId: "inventory101", password: "stock123", role: "INVENTORY_STAFF", hospitalId: primaryHospital._id },
      { userId: "nurse101", password: "nurse123", role: "NURSE", hospitalId: primaryHospital._id },
      { userId: "doctor101", password: "doctor123", role: "DOCTOR", hospitalId: primaryHospital._id }
    ];

    for (const acc of staffAccounts) {
      await User.create(acc);
    }
    console.log(" Staff accounts for HOSP-101 successfully created:");
    console.log("   - admin / 123 (HOSPITAL_ADMIN)");
    console.log("   - inventory101 / stock123 (INVENTORY_STAFF)");
    console.log("   - nurse101 / nurse123 (NURSE)");
    console.log("   - doctor101 / doctor123 (DOCTOR)");

    // 5. Seed Resources for HOSP-101
    await HospitalResource.insertMany([
      { hospitalId: primaryHospital._id, resourceType: "generalBed", total: 150, available: 28 },
      { hospitalId: primaryHospital._id, resourceType: "icuBed", total: 30, available: 6 },
      { hospitalId: primaryHospital._id, resourceType: "emergencyBed", total: 25, available: 8 },
      { hospitalId: primaryHospital._id, resourceType: "ventilator", total: 20, available: 5 },
      { hospitalId: primaryHospital._id, resourceType: "oxygen", total: 100, available: 45 }
    ]);

    // 6. Seed Blood Stock for HOSP-101
    const bloodStocks101 = [
      { hospitalId: primaryHospital._id, bloodGroup: "A+", currentStock: 18 },
      { hospitalId: primaryHospital._id, bloodGroup: "A-", currentStock: 4 },
      { hospitalId: primaryHospital._id, bloodGroup: "B+", currentStock: 22 },
      { hospitalId: primaryHospital._id, bloodGroup: "B-", currentStock: 6 },
      { hospitalId: primaryHospital._id, bloodGroup: "AB+", currentStock: 10 },
      { hospitalId: primaryHospital._id, bloodGroup: "AB-", currentStock: 2 },
      { hospitalId: primaryHospital._id, bloodGroup: "O+", currentStock: 30 },
      { hospitalId: primaryHospital._id, bloodGroup: "O-", currentStock: 5 }
    ];
    await BloodStock.insertMany(bloodStocks101);

    // 7. Seed Medicine Inventory for HOSP-101
    const medInventory101 = createdMedicines.map((med, idx) => ({
      hospitalId: primaryHospital._id,
      medicineId: med._id,
      quantity: idx % 3 === 0 ? 15 : 120 + idx * 25, // Some low stock items for shortage testing
      minimumStock: 40,
      unitPrice: 12.5 + idx * 4,
      expiryDate: new Date(2027, 8, 15)
    }));
    await MedicineInventory.insertMany(medInventory101);

    // 8. Seed Additional Hospitals from CSV starting at HOSP-200
    console.log("Reading hospital_master.csv for regional hospital seeding...");
    let seededFromCsvCount = 0;

    if (fs.existsSync(CSV_PATH)) {
      const csvRaw = fs.readFileSync(CSV_PATH, "utf-8");
      const records = parse(csvRaw, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true
      });

      // Filter valid entries with coordinates
      const validRecords = records.filter(
        (r) => r.latitude && r.longitude && !isNaN(Number(r.latitude)) && !isNaN(Number(r.longitude))
      );

      console.log(`Found ${validRecords.length} hospitals with valid coordinates in CSV.`);

      // Seed 60 representative regional hospitals starting at HOSP-200
      const targetCount = 60;
      let currIdCounter = 200;

      for (let i = 0; i < Math.min(validRecords.length, targetCount); i++) {
        const row = validRecords[i];
        const hId = `HOSP-${currIdCounter++}`;
        const name = (row.hospital_name || "Regional Hospital").trim();
        const lat = Number(row.latitude);
        const lng = Number(row.longitude);
        const address = [row.address_original_first_line, row.district, row.state].filter(Boolean).join(", ") || "Main Road, Regional Center";
        const phone = row.mobile_number || row.telephone || "+91-532-2460123";
        const totalBeds = Math.max(25, Number(row.total_num_beds) || (40 + (i % 8) * 20));
        const availBeds = Math.max(3, Math.floor(totalBeds * (0.15 + (i % 5) * 0.05)));

        // Extract specializations
        let rawSpecs = (row.specialties || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (rawSpecs.length === 0) {
          rawSpecs = ["General Medicine", "Emergency", "Pediatrics"];
        }

        const isEmergency = String(row.emergency_services || row.emergency_num || "yes").toLowerCase().includes("yes") || i % 2 === 0;

        const cat = String(row.hospital_category || "").toLowerCase().includes("govt") ? "government" : "private";

        const hospDoc = await Hospital.create({
          hospitalId: hId,
          name,
          address,
          location: {
            type: "Point",
            coordinates: [lng, lat]
          },
          contact: phone,
          specializations: rawSpecs.slice(0, 5),
          emergencyDepartment: isEmergency,
          hospitalType: cat
        });

        // Resources for this hospital
        await HospitalResource.insertMany([
          { hospitalId: hospDoc._id, resourceType: "generalBed", total: totalBeds, available: availBeds },
          { hospitalId: hospDoc._id, resourceType: "icuBed", total: Math.max(4, Math.floor(totalBeds * 0.15)), available: Math.max(1, Math.floor(totalBeds * 0.04)) },
          { hospitalId: hospDoc._id, resourceType: "emergencyBed", total: Math.max(4, Math.floor(totalBeds * 0.1)), available: Math.max(1, Math.floor(totalBeds * 0.03)) },
          { hospitalId: hospDoc._id, resourceType: "ventilator", total: Math.max(2, Math.floor(totalBeds * 0.08)), available: Math.max(1, Math.floor(totalBeds * 0.02)) },
          { hospitalId: hospDoc._id, resourceType: "oxygen", total: Math.max(10, Math.floor(totalBeds * 0.6)), available: Math.max(4, Math.floor(totalBeds * 0.25)) }
        ]);

        // Blood stock for this hospital
        const bStocks = BLOOD_GROUPS.map((bg, bIdx) => ({
          hospitalId: hospDoc._id,
          bloodGroup: bg,
          currentStock: Math.floor(5 + ((i + bIdx) % 15))
        }));
        await BloodStock.insertMany(bStocks);

        // Medicine inventory with surplus for inter-hospital transfer matching
        const medInvs = createdMedicines.map((m, mIdx) => ({
          hospitalId: hospDoc._id,
          medicineId: m._id,
          quantity: 150 + ((i * 17 + mIdx * 23) % 300), // Generous surplus stock for transfers
          minimumStock: 35,
          unitPrice: 15.0,
          expiryDate: new Date(2027, 5, 20)
        }));
        await MedicineInventory.insertMany(medInvs);

        seededFromCsvCount++;
      }
      console.log(` Successfully seeded ${seededFromCsvCount} hospitals starting from HOSP-200 to HOSP-${currIdCounter - 1}.`);
    }

    console.log("\n=======================================================");
    console.log(" SEEDING COMPLETE! ALL DATA POPULATED IN MONGODB ATLAS");
    console.log("=======================================================");
    console.log("Primary Hospital:");
    console.log("   - Facility ID: HOSP-101 (Prayagraj Central Civil Hospital)");
    console.log("Staff Logins (Hospital HOSP-101):");
    console.log("   - Admin:      userId: admin       / password: 123");
    console.log("   - Inventory:  userId: inventory101 / password: stock123");
    console.log("   - Nurse:      userId: nurse101     / password: nurse123");
    console.log("   - Doctor:     userId: doctor101    / password: doctor123");
    console.log("Super Admin Login (No hospital ID needed):");
    console.log("   - SuperAdmin: userId: superadmin   / password: 123");
    console.log(`Additional Seeded Regional Hospitals: HOSP-200 to HOSP-${200 + seededFromCsvCount - 1}`);
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding failed with error:", err);
    process.exit(1);
  }
}

seedAll();
