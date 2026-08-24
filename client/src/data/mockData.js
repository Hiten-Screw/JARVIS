// client/src/data/mockData.js
export const MOCK__HOSPITALS = [
  {
    id: "hosp-1",
    name: "Civil Hospital",
    coordinates: [25.4358, 81.8463],
    distance: "1.4 km",
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
    name: "Swaroop Rani Nehru Hospital",
    coordinates: [25.4520, 81.8380],
    distance: "3.2 km",
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
    name: "Apollo Clinic",
    coordinates: [25.4415, 81.8290],
    distance: "5.1 km",
    totalBeds: 60,
    availableBeds: 0,
    icuAvailable: 0,
    oxygenBeds: 0,
    phone: "+91-9876543212",
    emergencyReady: false,
    bloodStock: { "A+": 0, "O-": 0, "B+": 0 }
  }
];