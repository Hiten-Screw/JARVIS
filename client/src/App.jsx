// client/src/App.jsx
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import MapCanvas from "./components/MapCanvas";
import FeatureGrid from "./components/FeatureGrid";
import HospitalDrawer from "./components/HospitalDrawer";
import AiThoughtStream from "./components/AiThoughtStream";
import StaffLoginModal from "./components/StaffLoginModal";
import StaffPortal from "./components/StaffPortal";
import { api } from "./services/api";
import { DEFAULT_MAP_CENTER, formatDistance, withinRadius } from "./utils/geo";

export default function App() {
  const [activeTab, setActiveTab] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const [origin, setOrigin] = useState(DEFAULT_MAP_CENTER);
  const [originMode, setOriginMode] = useState("default");
  const [userLivePos, setUserLivePos] = useState(null);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [resourceRecords, setResourceRecords] = useState([]);
  const [medicineRecords, setMedicineRecords] = useState([]);
  const [medicineCatalog, setMedicineCatalog] = useState([]);

  useEffect(() => {
    api.medicines()
      .then((items) => setMedicineCatalog((Array.isArray(items) ? items : []).map((medicine) => ({
        id: medicine._id,
        name: medicine.name
      }))))
      .catch(() => setMedicineCatalog([]));

    api.hospitals().then(async (items) => {
      const mappedHospitals = [];
      const mappedResources = [];
      const mappedMedicines = [];

      for (const hospital of items) {
        const [resources, blood, inventory] = await Promise.all([
          api.resources(hospital.hospitalId).catch(() => []),
          api.bloodStock(hospital.hospitalId).catch(() => ({ stock: [] })),
          api.hospitalInventory(hospital.hospitalId).catch(() => [])
        ]);
        const resourceList = Array.isArray(resources) ? resources : [];
        const inventoryList = Array.isArray(inventory) ? inventory : [];
        const resource = (type) => resourceList.find((item) => item.resourceType === type);
        const general = resource("generalBed");
        const icu = resource("icuBed");
        const oxygen = resource("oxygen");

        mappedHospitals.push({
          ...hospital,
          id: hospital._id,
          coordinates: [hospital.location.coordinates[1], hospital.location.coordinates[0]],
          phone: hospital.contact,
          availableBeds: general?.available || 0,
          totalBeds: general?.total || 0,
          icuAvailable: icu?.available || 0,
          oxygenBeds: oxygen?.available || 0,
          bloodStock: Object.fromEntries((blood?.stock || []).map((item) => [item.bloodGroup, item.currentStock]))
        });

        mappedResources.push(...resourceList.map((item) => ({
          id: item._id,
          hospitalId: hospital._id,
          hospitalName: hospital.name,
          resourceType: item.resourceType,
          available: item.available,
          total: item.total
        })));

        mappedMedicines.push(...inventoryList.map((item) => ({
          id: item._id,
          hospitalId: hospital._id,
          hospitalName: hospital.name,
          medicineId: item.medicineId?._id || item.medicineId,
          medicineName: item.medicineId?.name || "Unknown medicine",
          quantity: item.quantity,
          minimumStock: item.minimumStock,
          expiryDate: item.expiryDate ? String(item.expiryDate).slice(0, 10) : "—"
        })));
      }

      setHospitals(mappedHospitals);
      setResourceRecords(mappedResources);
      setMedicineRecords(mappedMedicines);
    }).catch(() => {
      setHospitals([]);
      setResourceRecords([]);
      setMedicineRecords([]);
    });
  }, []);

  const catalogFromStock = medicineRecords.map((record) => ({ id: record.medicineId, name: record.medicineName }));
  const resolvedCatalog = (medicineCatalog.length ? medicineCatalog : catalogFromStock)
    .filter((medicine, index, list) => medicine.id && list.findIndex((item) => item.id === medicine.id) === index);

  const hospitalsInRange = withinRadius(hospitals, origin, radiusKm);
  const inRangeHospitalIds = new Set(hospitalsInRange.map((hospital) => hospital.id));
  const attachRange = (records) => records
    .filter((record) => inRangeHospitalIds.has(record.hospitalId))
    .map((record) => {
      const hospital = hospitalsInRange.find((item) => item.id === record.hospitalId);
      return { ...record, distance: hospital?.distance || formatDistance(hospital?.distanceKm) };
    });

  const categoryData = {
    beds: hospitalsInRange,
    blood: hospitalsInRange,
    nearest: hospitalsInRange,
    outbreak: [],
    resources: attachRange(resourceRecords),
    medicines: attachRange(medicineRecords),
    predictions: [],
    transfers: [],
    donors: [],
    organs: [],
    authority: []
  };

  const originLabel = originMode === "pin" ? "dropped pin" : originMode === "gps" ? "your location" : "map center";

  // Staff Auth & Modal States
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [staffSession, setStaffSession] = useState(() => {
    const saved = localStorage.getItem("staffSession");
    if (!saved) return null;

    try {
      return JSON.parse(saved);
    } catch {
      localStorage.removeItem("staffSession");
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("staffSession");
    setStaffSession(null);
  };

  return (
    staffSession ? (
      <StaffPortal session={staffSession} onExit={handleLogout} />
    ) : (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar 
        searchQuery={searchQuery}  
        setSearchQuery={setSearchQuery} 
        onOpenStaffPortal={() => setIsLoginOpen(true)}
        activeStaff={staffSession}
        onLogout={handleLogout} />

      <main className="flex-1 p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-7xl w-full mx-auto">
        {/* Left Column: Map & SOS */}
        <div className={`transition-all duration-300 ${activeTab ? "lg:col-span-8" : "lg:col-span-5"}`}>
          <MapCanvas
            hospitals={hospitalsInRange}
            onTriggerSos={() => setActiveTab("sos")}
            origin={origin}
            originMode={originMode}
            userLivePos={userLivePos}
            radiusKm={radiusKm}
            pinDropMode={pinDropMode}
            onRadiusChange={setRadiusKm}
            onPinDropModeChange={setPinDropMode}
            onDropPin={(coords) => {
              setOrigin(coords);
              setOriginMode("pin");
              setPinDropMode(false);
            }}
            onUseGps={(coords) => {
              setUserLivePos(coords);
              setOrigin(coords);
              setOriginMode("gps");
              setPinDropMode(false);
            }}
          />
        </div>

        {/* Right Column: Cards vs Expanded Drawer */}
        <div className={`transition-all duration-300 ${activeTab ? "lg:col-span-4" : "lg:col-span-7"}`}>
          <p className="text-xs text-slate-500 mb-3">
            Showing {hospitalsInRange.length} hospital{hospitalsInRange.length === 1 ? "" : "s"} within {radiusKm} km of {originLabel}. Drop a pin to search from another place.
          </p>
          {!activeTab ? (
            <FeatureGrid onSelectCategory={(cat) => setActiveTab(cat)} />
          ) : (
            <HospitalDrawer
              activeTab={activeTab}
              onBack={() => setActiveTab(null)}
              records={categoryData[activeTab] || hospitalsInRange}
              medicineCatalog={resolvedCatalog}
              rangeLabel={`${radiusKm} km of ${originLabel}`}
            />
          )}
        </div>
      </main>

      <AiThoughtStream />
      <StaffLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(sessionData) => {
          setStaffSession(sessionData);
        }}
      />
    </div>
    )
  );
}
