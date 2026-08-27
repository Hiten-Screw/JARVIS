/* Legacy demo fixtures disabled. Database-backed auth and portal data are active.
export const MOCK_CREDENTIALS = [
  {
    hospitalId: "ROOT",
    userId: "superadmin",
    password: "super123",
    role: "SUPER_ADMIN"
  },
  {
    hospitalId: "HOSP-101",
    userId: "admin101",
    password: "admin123",
    role: "HOSPITAL_ADMIN"
  },
  {
    hospitalId: "HOSP-101",
    userId: "inventory101",
    password: "stock123",
    role: "INVENTORY_STAFF"
  },
  {
    hospitalId: "HOSP-101",
    userId: "nurse101",
    password: "nurse123",
    role: "NURSE"
  },
  {
    hospitalId: "HOSP-101",
    userId: "doctor101",
    password: "doctor123",
    role: "DOCTOR"
  },
  {
    hospitalId: "HOSP-102",
    userId: "admin101",
    password: "admin123",
    role: "HOSPITAL_ADMIN"
  }
];

export const MOCK_HOSPITAL_REQUESTS = [
  {
    id: "request-1",
    hospitalName: "Sadar District Hospital",
    address: "Sadar, Prayagraj",
    contact: "+91-9876500001",
    requestedAdminId: "admin_sadar",
    submittedAt: "2026-08-27",
    status: "PENDING"
  },
  {
    id: "request-2",
    hospitalName: "Naini Community Health Centre",
    address: "Naini, Prayagraj",
    contact: "+91-9876500002",
    requestedAdminId: "admin_naini",
    submittedAt: "2026-08-26",
    status: "PENDING"
  }
];

export const MOCK_HOSPITAL_STAFF = [
  { id: "staff-1", userId: "nurse101", role: "NURSE", hospitalId: "HOSP-101", status: "ACTIVE" },
  { id: "staff-2", userId: "doctor101", role: "DOCTOR", hospitalId: "HOSP-101", status: "ACTIVE" },
  { id: "staff-3", userId: "inventory101", role: "INVENTORY_STAFF", hospitalId: "HOSP-101", status: "ACTIVE" }
]; */
