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

// 12 Clean, Well-Spaced, Realistic Prayagraj Hospitals
const PRAYAGRAJ_HOSPITALS = [
  {
    hospitalId: "HOSP-101",
    name: "Prayagraj Central Civil Hospital",
    address: "45 MG Road, Civil Lines, Prayagraj, Uttar Pradesh",
    coordinates: [81.8463, 25.4358],
    contact: "+91-532-2460123",
    specializations: ["Emergency", "Cardiology", "Neurology", "General Medicine", "Trauma Care", "Pulmonology"],
    emergencyDepartment: true,
    hospitalType: "government",
    totalBeds: 250,
    availableBeds: 45
  },
  {
    hospitalId: "HOSP-102",
    name: "Swaroop Rani Nehru Hospital (SRN)",
    address: "Chatham Lines, Medical College, Prayagraj, Uttar Pradesh",
    coordinates: [81.8380, 25.4520],
    contact: "+91-532-2256011",
    specializations: ["Emergency", "Trauma Care", "Neurology", "Cardiology", "General Surgery", "Nephrology"],
    emergencyDepartment: true,
    hospitalType: "government",
    totalBeds: 350,
    availableBeds: 62
  },
  {
    hospitalId: "HOSP-103",
    name: "Tej Bahadur Sapru (Beli) Hospital",
    address: "Stanley Road, Beli, Prayagraj, Uttar Pradesh",
    coordinates: [81.8540, 25.4610],
    contact: "+91-532-2420088",
    specializations: ["Emergency", "General Medicine", "Pediatrics", "Orthopedics"],
    emergencyDepartment: true,
    hospitalType: "government",
    totalBeds: 180,
    availableBeds: 38
  },
  {
    hospitalId: "HOSP-104",
    name: "Kamla Nehru Memorial Hospital (Cancer Centre)",
    address: "Tagore Town, Prayagraj, Uttar Pradesh",
    coordinates: [81.8620, 25.4480],
    contact: "+91-532-2466661",
    specializations: ["Oncology", "Radiology", "Chemotherapy", "General Surgery"],
    emergencyDepartment: true,
    hospitalType: "specialized",
    totalBeds: 160,
    availableBeds: 24
  },
  {
    hospitalId: "HOSP-105",
    name: "Motilal Nehru Divisional Hospital (Colvin)",
    address: "Katra Road, Prayagraj, Uttar Pradesh",
    coordinates: [81.8590, 25.4550],
    contact: "+91-532-2460300",
    specializations: ["Emergency", "General Medicine", "Orthopedics", "Cardiology"],
    emergencyDepartment: true,
    hospitalType: "government",
    totalBeds: 140,
    availableBeds: 30
  },
  {
    hospitalId: "HOSP-106",
    name: "Nazareth Hospital",
    address: "13A Thornhill Road, Civil Lines, Prayagraj, Uttar Pradesh",
    coordinates: [81.8390, 25.4490],
    contact: "+91-532-2407441",
    specializations: ["Emergency", "Cardiology", "Gastroenterology", "General Medicine", "ICU"],
    emergencyDepartment: true,
    hospitalType: "private",
    totalBeds: 200,
    availableBeds: 35
  },
  {
    hospitalId: "HOSP-107",
    name: "United Medicity Super Specialty Hospital",
    address: "Rawatpur, Near Jhalwa, Prayagraj, Uttar Pradesh",
    coordinates: [81.7650, 25.4310],
    contact: "+91-532-2441122",
    specializations: ["Emergency", "Cardiology", "Neurology", "Nephrology", "Trauma Care"],
    emergencyDepartment: true,
    hospitalType: "private",
    totalBeds: 300,
    availableBeds: 58
  },
  {
    hospitalId: "HOSP-108",
    name: "Jeevan Jyoti Super Specialty Hospital",
    address: "Lowther Road, George Town, Prayagraj, Uttar Pradesh",
    coordinates: [81.8530, 25.4390],
    contact: "+91-532-2466000",
    specializations: ["Cardiology", "Emergency", "Neurology", "Dialysis", "General Medicine"],
    emergencyDepartment: true,
    hospitalType: "private",
    totalBeds: 150,
    availableBeds: 28
  },
  {
    hospitalId: "HOSP-109",
    name: "Asha Hospital & Trauma Centre",
    address: "Triveni Nagar, Naini, Prayagraj, Uttar Pradesh",
    coordinates: [81.8650, 25.3980],
    contact: "+91-532-2697800",
    specializations: ["Emergency", "Trauma Care", "Orthopedics", "General Surgery"],
    emergencyDepartment: true,
    hospitalType: "private",
    totalBeds: 110,
    availableBeds: 22
  },
  {
    hospitalId: "HOSP-110",
    name: "Vatsalya Maternity & Surgical Hospital",
    address: "GTB Nagar, Kareli, Prayagraj, Uttar Pradesh",
    coordinates: [81.8250, 25.4210],
    contact: "+91-532-2550100",
    specializations: ["Obstetrics & Gynecology", "Pediatrics", "Emergency", "Neonatology"],
    emergencyDepartment: true,
    hospitalType: "private",
    totalBeds: 95,
    availableBeds: 20
  },
  {
    hospitalId: "HOSP-111",
    name: "Phoenix Super Specialty Hospital & Trauma Center",
    address: "Lukerganj, GT Road, Prayagraj, Uttar Pradesh",
    coordinates: [81.8150, 25.4470],
    contact: "+91-532-2601122",
    specializations: ["Emergency", "Trauma Care", "Neurology", "Cardiology"],
    emergencyDepartment: true,
    hospitalType: "private",
    totalBeds: 130,
    availableBeds: 25
  },
  {
    hospitalId: "HOSP-112",
    name: "Heritage Multi Specialty Hospital",
    address: "Teliyarganj, Lucknow Road, Prayagraj, Uttar Pradesh",
    coordinates: [81.8600, 25.4850],
    contact: "+91-532-2544333",
    specializations: ["Emergency", "General Medicine", "Orthopedics", "Cardiology"],
    emergencyDepartment: true,
    hospitalType: "private",
    totalBeds: 100,
    availableBeds: 22
  }
];

// Major UP Regional Anchor Centers (Varanasi, Lucknow, Kanpur, Agra, Gorakhpur, Noida, etc.)
const REGIONAL_UP_CENTERS = [
  { hospitalId: "HOSP-201", name: "BHU Sir Sunderlal Hospital", district: "Varanasi", coordinates: [82.9995, 25.2754], specializations: ["Emergency", "Cardiology", "Neurology", "Trauma Care", "Oncology"], totalBeds: 450, availableBeds: 82, hospitalType: "government" },
  { hospitalId: "HOSP-202", name: "Heritage Hospital Lanka", district: "Varanasi", coordinates: [82.9880, 25.2860], specializations: ["Cardiology", "Emergency", "General Surgery"], totalBeds: 180, availableBeds: 34, hospitalType: "private" },
  { hospitalId: "HOSP-203", name: "KGMU Super Specialty Hospital", district: "Lucknow", coordinates: [80.9168, 26.8687], specializations: ["Emergency", "Trauma Care", "Neurology", "Cardiology", "Nephrology"], totalBeds: 500, availableBeds: 95, hospitalType: "government" },
  { hospitalId: "HOSP-204", name: "Sanjay Gandhi PGIMS (SGPGI)", district: "Lucknow", coordinates: [80.9390, 26.7450], specializations: ["Cardiology", "Nephrology", "Oncology", "Gastroenterology"], totalBeds: 420, availableBeds: 70, hospitalType: "government" },
  { hospitalId: "HOSP-205", name: "Medanta Hospital Lucknow", district: "Lucknow", coordinates: [81.0020, 26.7950], specializations: ["Cardiology", "Emergency", "Neurology", "Organ Transplant"], totalBeds: 350, availableBeds: 60, hospitalType: "private" },
  { hospitalId: "HOSP-206", name: "GSVM Medical College & Hallet Hospital", district: "Kanpur", coordinates: [80.3120, 26.4820], specializations: ["Emergency", "Trauma Care", "Orthopedics", "Cardiology"], totalBeds: 380, availableBeds: 65, hospitalType: "government" },
  { hospitalId: "HOSP-207", name: "Regency Hospital Swaroop Nagar", district: "Kanpur", coordinates: [80.3240, 26.4780], specializations: ["Emergency", "Cardiology", "Neurology", "Dialysis"], totalBeds: 220, availableBeds: 40, hospitalType: "private" },
  { hospitalId: "HOSP-208", name: "SN Medical College & Hospital", district: "Agra", coordinates: [78.0120, 27.1850], specializations: ["Emergency", "Cardiology", "General Medicine", "Trauma Care"], totalBeds: 280, availableBeds: 52, hospitalType: "government" },
  { hospitalId: "HOSP-209", name: "BRD Medical College Hospital", district: "Gorakhpur", coordinates: [83.3850, 26.7820], specializations: ["Emergency", "Pediatrics", "Infectious Diseases", "Trauma Care"], totalBeds: 320, availableBeds: 55, hospitalType: "government" },
  { hospitalId: "HOSP-210", name: "Felix Super Specialty Hospital", district: "Noida", coordinates: [77.3910, 28.5355], specializations: ["Emergency", "Cardiology", "Neurology", "Orthopedics"], totalBeds: 200, availableBeds: 38, hospitalType: "private" },
  { hospitalId: "HOSP-211", name: "Yashoda Super Specialty Hospital", district: "Ghaziabad", coordinates: [77.4420, 28.6620], specializations: ["Cardiology", "Emergency", "Oncology", "Gastroenterology"], totalBeds: 250, availableBeds: 48, hospitalType: "private" },
  { hospitalId: "HOSP-212", name: "Maharani Laxmi Bai Medical College", district: "Jhansi", coordinates: [78.5820, 25.4490], specializations: ["Emergency", "Trauma Care", "Orthopedics", "General Medicine"], totalBeds: 260, availableBeds: 45, hospitalType: "government" }
];

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

async function runCleanSeed() {
  try {
    console.log("\n=======================================================");
    console.log(" SEEDING CLEAN, BALANCED HOSPITAL NETWORK (<= 25 TOTAL)");
    console.log("=======================================================\n");

    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" Connected to MongoDB Atlas cluster.");

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
    console.log("Seeding Medicine Catalog (15 standard pharmaceuticals)...");
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

    const hospitalDocs = [];
    const resourceDocs = [];
    const bloodDocs = [];
    const medicineDocs = [];
    const userDocs = [];

    // 3. Seed 12 Prayagraj Hospitals
    console.log("Seeding 12 Well-Spaced Prayagraj Hospitals (HOSP-101 to HOSP-112)...");

    for (let pIdx = 0; pIdx < PRAYAGRAJ_HOSPITALS.length; pIdx++) {
      const pHosp = PRAYAGRAJ_HOSPITALS[pIdx];
      const hObjId = new mongoose.Types.ObjectId();

      hospitalDocs.push({
        _id: hObjId,
        hospitalId: pHosp.hospitalId,
        name: pHosp.name,
        address: pHosp.address,
        location: {
          type: "Point",
          coordinates: pHosp.coordinates // [lng, lat]
        },
        contact: pHosp.contact,
        specializations: pHosp.specializations,
        emergencyDepartment: pHosp.emergencyDepartment,
        hospitalType: pHosp.hospitalType
      });

      const tBeds = pHosp.totalBeds;
      const aBeds = pHosp.availableBeds;

      resourceDocs.push(
        { hospitalId: hObjId, resourceType: "generalBed", total: tBeds, available: aBeds },
        { hospitalId: hObjId, resourceType: "icuBed", total: Math.max(5, Math.floor(tBeds * 0.15)), available: Math.max(2, Math.floor(tBeds * 0.04)) },
        { hospitalId: hObjId, resourceType: "emergencyBed", total: Math.max(5, Math.floor(tBeds * 0.1)), available: Math.max(2, Math.floor(tBeds * 0.03)) },
        { hospitalId: hObjId, resourceType: "ventilator", total: Math.max(3, Math.floor(tBeds * 0.08)), available: Math.max(1, Math.floor(tBeds * 0.02)) },
        { hospitalId: hObjId, resourceType: "oxygen", total: Math.max(15, Math.floor(tBeds * 0.6)), available: Math.max(5, Math.floor(tBeds * 0.25)) }
      );

      for (let bIdx = 0; bIdx < BLOOD_GROUPS.length; bIdx++) {
        bloodDocs.push({
          hospitalId: hObjId,
          bloodGroup: BLOOD_GROUPS[bIdx],
          currentStock: Math.floor(8 + ((pIdx * 5 + bIdx * 3) % 28))
        });
      }

      for (let mIdx = 0; mIdx < createdMedicines.length; mIdx++) {
        medicineDocs.push({
          hospitalId: hObjId,
          medicineId: createdMedicines[mIdx]._id,
          quantity: 120 + ((pIdx * 17 + mIdx * 23) % 320),
          minimumStock: 35,
          unitPrice: 15.0 + (mIdx * 2.5),
          expiryDate: new Date(2027, 7, 20)
        });
      }

      // Setup standard staff logins on HOSP-101
      if (pHosp.hospitalId === "HOSP-101") {
        userDocs.push(
          { userId: "admin", password: "123", role: "HOSPITAL_ADMIN", hospitalId: hObjId },
          { userId: "inventory101", password: "stock123", role: "INVENTORY_STAFF", hospitalId: hObjId },
          { userId: "nurse101", password: "nurse123", role: "NURSE", hospitalId: hObjId },
          { userId: "doctor101", password: "doctor123", role: "DOCTOR", hospitalId: hObjId }
        );
      }
    }

    // 4. Seed 12 Major UP Regional Anchor Centers (HOSP-201 to HOSP-212)
    console.log("Seeding 12 Major UP Regional Centers (HOSP-201 to HOSP-212)...");

    for (let rIdx = 0; rIdx < REGIONAL_UP_CENTERS.length; rIdx++) {
      const rHosp = REGIONAL_UP_CENTERS[rIdx];
      const hObjId = new mongoose.Types.ObjectId();

      hospitalDocs.push({
        _id: hObjId,
        hospitalId: rHosp.hospitalId,
        name: rHosp.name,
        address: `Main Medical Road, ${rHosp.district}, Uttar Pradesh`,
        location: {
          type: "Point",
          coordinates: rHosp.coordinates // [lng, lat]
        },
        contact: "+91-532-2460123",
        specializations: rHosp.specializations,
        emergencyDepartment: true,
        hospitalType: rHosp.hospitalType
      });

      const tBeds = rHosp.totalBeds;
      const aBeds = rHosp.availableBeds;

      resourceDocs.push(
        { hospitalId: hObjId, resourceType: "generalBed", total: tBeds, available: aBeds },
        { hospitalId: hObjId, resourceType: "icuBed", total: Math.max(5, Math.floor(tBeds * 0.15)), available: Math.max(2, Math.floor(tBeds * 0.04)) },
        { hospitalId: hObjId, resourceType: "emergencyBed", total: Math.max(5, Math.floor(tBeds * 0.1)), available: Math.max(2, Math.floor(tBeds * 0.03)) },
        { hospitalId: hObjId, resourceType: "ventilator", total: Math.max(3, Math.floor(tBeds * 0.08)), available: Math.max(1, Math.floor(tBeds * 0.02)) },
        { hospitalId: hObjId, resourceType: "oxygen", total: Math.max(15, Math.floor(tBeds * 0.6)), available: Math.max(5, Math.floor(tBeds * 0.25)) }
      );

      for (let bIdx = 0; bIdx < BLOOD_GROUPS.length; bIdx++) {
        bloodDocs.push({
          hospitalId: hObjId,
          bloodGroup: BLOOD_GROUPS[bIdx],
          currentStock: Math.floor(10 + ((rIdx * 4 + bIdx * 2) % 30))
        });
      }

      for (let mIdx = 0; mIdx < createdMedicines.length; mIdx++) {
        medicineDocs.push({
          hospitalId: hObjId,
          medicineId: createdMedicines[mIdx]._id,
          quantity: 140 + ((rIdx * 19 + mIdx * 21) % 300),
          minimumStock: 35,
          unitPrice: 15.0,
          expiryDate: new Date(2027, 6, 20)
        });
      }

      // Add admin logins for the first 3 regional centers
      if (rIdx < 3) {
        userDocs.push({
          userId: `admin_${rHosp.hospitalId.toLowerCase()}`,
          password: "123",
          role: "HOSPITAL_ADMIN",
          hospitalId: hObjId
        });
      }
    }

    console.log(`Inserting ${hospitalDocs.length} Hospital documents into Atlas...`);
    await Hospital.insertMany(hospitalDocs, { ordered: false });
    console.log(` Successfully inserted ${hospitalDocs.length} Hospitals.`);

    console.log(`Inserting ${resourceDocs.length} HospitalResource documents...`);
    await HospitalResource.insertMany(resourceDocs, { ordered: false });
    console.log(` Successfully inserted ${resourceDocs.length} HospitalResources.`);

    console.log(`Inserting ${bloodDocs.length} BloodStock documents...`);
    await BloodStock.insertMany(bloodDocs, { ordered: false });
    console.log(` Successfully inserted ${bloodDocs.length} BloodStocks.`);

    console.log(`Inserting ${medicineDocs.length} MedicineInventory documents...`);
    await MedicineInventory.insertMany(medicineDocs, { ordered: false });
    console.log(` Successfully inserted ${medicineDocs.length} MedicineInventories.`);

    if (userDocs.length > 0) {
      for (const u of userDocs) {
        await User.create(u);
      }
      console.log(` Created ${userDocs.length} staff and admin user credentials.`);
    }

    const finalStats = await Promise.all([
      Hospital.countDocuments(),
      User.countDocuments(),
      HospitalResource.countDocuments(),
      BloodStock.countDocuments(),
      MedicineInventory.countDocuments()
    ]);

    console.log("\n=======================================================");
    console.log(" SEEDING COMPLETE! CLEAN, UNCLUTTERED NETWORK ACTIVE");
    console.log("=======================================================");
    console.log(` Total Hospitals:          ${finalStats[0]} facilities (12 in Prayagraj + 12 regional UP centers)`);
    console.log(` Total Staff Users:        ${finalStats[1]} credentials in database`);
    console.log(` Total Hospital Resources: ${finalStats[2]} records`);
    console.log(` Total Blood Stocks:       ${finalStats[3]} records`);
    console.log(` Total Medicine Stock:     ${finalStats[4]} records`);
    console.log("=======================================================");
    console.log("Primary Hospital & Standard Logins:");
    console.log("   - Facility ID: HOSP-101 (Prayagraj Central Civil Hospital)");
    console.log("   - Admin:       userId: admin        | password: 123");
    console.log("   - Inventory:   userId: inventory101  | password: stock123");
    console.log("   - Nurse:       userId: nurse101      | password: nurse123");
    console.log("   - Doctor:      userId: doctor101     | password: doctor123");
    console.log("   - Super Admin: userId: superadmin    | password: 123 (No Hosp ID)");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

runCleanSeed();
