/* Legacy demo fixtures disabled. Database-backed client queries are active.
// client/src/data/mockData.js
export const MOCK__HOSPITALS = [
  {
    id: "hosp-1",
    hospitalId: "HOSP-101",
    name: "Civil Hospital",
    address: "45 MG Road, Prayagraj",
    coordinates: [25.4358, 81.8463],
    distance: "1.4 km",
    contact: "+91-9876543210",
    specializations: ["Emergency", "Cardiology", "General Medicine"],
    hospitalType: "government",
    emergencyDepartment: true,
    totalBeds: 120,
    availableBeds: 18,
    icuAvailable: 4,
    oxygenBeds: 10,
    phone: "+91-9876543210",
    emergencyReady: true,
    bloodStock: { "A+": 12, "O-": 2, "B+": 8 }
  },
  {
    id: "hosp-2",
    hospitalId: "HOSP-102",
    name: "Swaroop Rani Nehru Hospital",
    address: "Civil Lines, Prayagraj",
    coordinates: [25.4520, 81.8380],
    distance: "3.2 km",
    contact: "+91-9876543211",
    specializations: ["Emergency", "Neurology", "Trauma Care"],
    hospitalType: "government",
    emergencyDepartment: true,
    totalBeds: 250,
    availableBeds: 5,
    icuAvailable: 1,
    oxygenBeds: 3,
    phone: "+91-9876543211",
    emergencyReady: true,
    bloodStock: { "A+": 4, "O-": 0, "B+": 1 }
  },
  {
    id: "hosp-3",
    hospitalId: "HOSP-103",
    name: "Apollo Clinic",
    address: "Tagore Town, Prayagraj",
    coordinates: [25.4415, 81.8290],
    distance: "5.1 km",
    contact: "+91-9876543212",
    specializations: ["General Medicine", "Diagnostics"],
    hospitalType: "private",
    emergencyDepartment: false,
    totalBeds: 60,
    availableBeds: 0,
    icuAvailable: 0,
    oxygenBeds: 0,
    phone: "+91-9876543212",
    emergencyReady: false,
    bloodStock: { "A+": 0, "O-": 0, "B+": 0 }
  }
];

export const MOCK__RESOURCES = [
  { id: "resource-1", hospitalId: "hosp-1", hospitalName: "Civil Hospital", resourceType: "generalBed", total: 120, available: 18 },
  { id: "resource-2", hospitalId: "hosp-1", hospitalName: "Civil Hospital", resourceType: "icuBed", total: 20, available: 4 },
  { id: "resource-3", hospitalId: "hosp-2", hospitalName: "Swaroop Rani Nehru Hospital", resourceType: "ventilator", total: 18, available: 6 },
  { id: "resource-4", hospitalId: "hosp-3", hospitalName: "Apollo Clinic", resourceType: "oxygen", total: 12, available: 3 }
];

export const MOCK__MEDICINES = [
  { id: "medicine-1", name: "Paracetamol 500mg", genericName: "Paracetamol", category: "Analgesic", manufacturer: "Cipla", unit: "tablet" },
  { id: "medicine-2", name: "Ceftriaxone 1g", genericName: "Ceftriaxone", category: "Antibiotic", manufacturer: "Sun Pharma", unit: "vial" },
  { id: "medicine-3", name: "Normal Saline 500ml", genericName: "Sodium Chloride", category: "IV Fluid", manufacturer: "B. Braun", unit: "bottle" }
];

export const MOCK__MEDICINE_INVENTORY = [
  { id: "inventory-1", hospitalId: "hosp-1", hospitalName: "Civil Hospital", medicineId: "medicine-1", medicineName: "Paracetamol 500mg", quantity: 840, minimumStock: 300, unitPrice: 1.2, expiryDate: "2027-02-28" },
  { id: "inventory-2", hospitalId: "hosp-2", hospitalName: "Swaroop Rani Nehru Hospital", medicineId: "medicine-2", medicineName: "Ceftriaxone 1g", quantity: 34, minimumStock: 50, unitPrice: 82, expiryDate: "2026-11-30" },
  { id: "inventory-3", hospitalId: "hosp-3", hospitalName: "Apollo Clinic", medicineId: "medicine-3", medicineName: "Normal Saline 500ml", quantity: 96, minimumStock: 40, unitPrice: 48, expiryDate: "2027-05-31" }
];

export const MOCK__BED_PREDICTIONS = [
  { id: "bed-prediction-1", hospitalId: "hosp-1", hospitalName: "Civil Hospital", predictedForDate: "2026-09-01", predictedBeds: 108, predictedICUBeds: 18, predictedEmergencyBeds: 15, confidence: 0.91, riskLevel: "high", modelVersion: "beds-v2.4" },
  { id: "bed-prediction-2", hospitalId: "hosp-2", hospitalName: "Swaroop Rani Nehru Hospital", predictedForDate: "2026-09-01", predictedBeds: 238, predictedICUBeds: 24, predictedEmergencyBeds: 20, confidence: 0.87, riskLevel: "critical", modelVersion: "beds-v2.4" }
];

export const MOCK__MEDICINE_PREDICTIONS = [
  { id: "medicine-prediction-1", hospitalId: "hosp-1", hospitalName: "Civil Hospital", medicineId: "medicine-1", medicineName: "Paracetamol 500mg", predictedForDate: "2026-09-01", predictedDemand: 620, confidence: 0.94, riskLevel: "medium", modelVersion: "meds-v1.8" },
  { id: "medicine-prediction-2", hospitalId: "hosp-2", hospitalName: "Swaroop Rani Nehru Hospital", medicineId: "medicine-2", medicineName: "Ceftriaxone 1g", predictedForDate: "2026-09-01", predictedDemand: 72, confidence: 0.89, riskLevel: "critical", modelVersion: "meds-v1.8" }
];

export const MOCK__TRANSFERS = [
  { id: "transfer-1", fromHospital: { name: "Civil Hospital" }, toHospital: { name: "Swaroop Rani Nehru Hospital" }, medicine: { name: "Ceftriaxone 1g", category: "Antibiotic" }, quantity: 20, status: "RECOMMENDED", transferDate: "2026-08-27" },
  { id: "transfer-2", fromHospital: { name: "Apollo Clinic" }, toHospital: { name: "Civil Hospital" }, medicine: { name: "Normal Saline 500ml", category: "IV Fluid" }, quantity: 30, status: "APPROVED", transferDate: "2026-08-26" }
];

export const MOCK__DONORS = [
  { id: "donor-1", name: "Verified donor near Civil Hospital", bloodGroup: "O-", status: "eligible", distance: "1.8 km", medicalDetails: "Last screening: 12 Aug 2026" },
  { id: "donor-2", name: "Verified donor near SRN Hospital", bloodGroup: "A+", status: "registered", distance: "3.6 km", medicalDetails: "Available after confirmation" }
];

export const MOCK__ORGAN_MATCHES = [
  { id: "match-1", organType: "kidney", bloodGroup: "A+", compatibilityScore: 96, status: "underReview", recipientHospital: "Civil Hospital", availableDate: "2026-09-04" },
  { id: "match-2", organType: "cornea", bloodGroup: "O+", compatibilityScore: 88, status: "suggested", recipientHospital: "Swaroop Rani Nehru Hospital", availableDate: "2026-09-08" }
];

export const MOCK__BED_HISTORY = [
  { id: "occupancy-1", hospitalName: "Civil Hospital", date: "2026-08-27", totalBeds: 120, occupiedBeds: 102, availableBeds: 18, totalICU: 20, occupiedICU: 16, availableICU: 4, totalEmergencyBeds: 24, occupiedEmergencyBeds: 17, availableEmergencyBeds: 7 }
];

export const MOCK__AUTHORITY_SUMMARY = {
  totalHospitals: 3,
  lowResourceHospitals: 2,
  lowMedicineStock: 1,
  pendingTransfers: 1,
  criticalBedPredictions: 1
}; */