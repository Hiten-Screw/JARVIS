// client/src/App.jsx
import { useEffect, useState, useCallback } from "react";
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

  // ML State
  const [mlCondition, setMlCondition] = useState("Heart Attack");
  const [mlSpecialty, setMlSpecialty] = useState("");
  const [mlRecommendations, setMlRecommendations] = useState([]);
  const [outbreakData, setOutbreakData] = useState(null);
  const [bedForecasts, setBedForecasts] = useState([]);
  const [isMlLoading, setIsMlLoading] = useState(false);

  // Initial Data Loading
  useEffect(() => {
    api.medicines()
      .then((items) => setMedicineCatalog((Array.isArray(items) ? items : []).map((medicine) => ({
        id: medicine._id,
        name: medicine.name
      }))))
      .catch(() => setMedicineCatalog([]));

    api.hospitals().then((items) => {
      const hospitalList = Array.isArray(items) ? items : [];
      const mappedHospitals = [];
      const mappedResources = [];

      for (const hospital of hospitalList) {
        if (!hospital.location?.coordinates || hospital.location.coordinates.length < 2) continue;

        const resourceList = Array.isArray(hospital.resources) ? hospital.resources : [];
        const bloodList = Array.isArray(hospital.bloodStock) ? hospital.bloodStock : [];

        const resource = (type) => resourceList.find((item) => item.resourceType === type);
        const general = resource("generalBed");
        const icu = resource("icuBed");
        const oxygen = resource("oxygen");

        const totalBeds = general?.total || 60;
        const availBeds = general?.available ?? Math.max(4, Math.floor(totalBeds * 0.2));
        const icuAvail = icu?.available ?? Math.max(1, Math.floor(totalBeds * 0.05));
        const oxyBeds = oxygen?.available ?? Math.max(3, Math.floor(totalBeds * 0.3));

        mappedHospitals.push({
          ...hospital,
          id: hospital._id,
          coordinates: [hospital.location.coordinates[1], hospital.location.coordinates[0]],
          phone: hospital.contact || "+91-532-2460123",
          availableBeds: availBeds,
          totalBeds: totalBeds,
          icuAvailable: icuAvail,
          oxygenBeds: oxyBeds,
          number_doctor: hospital.number_doctor || Math.max(8, Math.floor(totalBeds * 0.2)),
          specializations: hospital.specializations?.length ? hospital.specializations : ["Emergency", "General Medicine"],
          bloodStock: Object.fromEntries((bloodList || []).map((item) => [item.bloodGroup, item.currentStock]))
        });

        mappedResources.push(...resourceList.map((item) => ({
          id: item._id,
          hospitalId: hospital._id,
          hospitalName: hospital.name,
          resourceType: item.resourceType,
          available: item.available,
          total: item.total
        })));
      }

      setHospitals(mappedHospitals);
      setResourceRecords(mappedResources);
    }).catch((err) => {
      console.error("Failed to load hospitals:", err);
      setHospitals([]);
      setResourceRecords([]);
    });

    // Load Outbreak Surveillance Data
    api.outbreakSurveillance()
      .then((data) => setOutbreakData(data))
      .catch(() => setOutbreakData(null));

    // Load Bed Forecasts
    api.bedForecasts()
      .then((data) => setBedForecasts(Array.isArray(data) ? data : []))
      .catch(() => setBedForecasts([]));

    // Prefetch ML recommendations from dataset
    api.recommendHospitals({
      latitude: 25.4358,
      longitude: 81.8463,
      specialty: "",
      condition: "Heart Attack",
      state: "Uttar Pradesh"
    }).then((res) => {
      const recs = res?.recommendations || (Array.isArray(res) ? res : []);
      if (Array.isArray(recs) && recs.length > 0) {
        setMlRecommendations(recs);
      }
    }).catch(() => {});
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

  const [transfers, setTransfers] = useState([]);

  // Handler to run XGBoost ML recommendation on dataset
  const handleRunRecommendation = useCallback(async (overrideCondition) => {
    setIsMlLoading(true);
    const cond = overrideCondition || mlCondition || "Heart Attack";
    try {
      const payload = {
        latitude: origin[0],
        longitude: origin[1],
        specialty: mlSpecialty,
        condition: cond,
        state: "Uttar Pradesh"
      };

      const res = await api.recommendHospitals(payload);
      const recs = res?.recommendations || (Array.isArray(res) ? res : []);
      if (Array.isArray(recs) && recs.length > 0) {
        setMlRecommendations(recs);
      }
    } catch (err) {
      console.warn("ML Recommendation error:", err);
    } finally {
      setIsMlLoading(false);
    }
  }, [origin, mlSpecialty, mlCondition]);

  // Handle global search triggering ML recommendation
  const handleGlobalSearch = (query) => {
    setSearchQuery(query);
    if (query && query.trim()) {
      setMlCondition(query.trim());
      setActiveTab("nearest");
      handleRunRecommendation(query.trim());
    }
  };

  const categoryData = {
    beds: hospitalsInRange,
    blood: hospitalsInRange,
    nearest: mlRecommendations,
    outbreak: outbreakData?.conditions || [],
    resources: attachRange(resourceRecords),
    medicines: attachRange(medicineRecords),
    predictions: bedForecasts,
    transfers: transfers
    // donors: [],
    // organs: [],
    // authority: []
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
          onSearchSubmit={handleGlobalSearch}
          onOpenStaffPortal={() => setIsLoginOpen(true)}
          activeStaff={staffSession}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-7xl w-full mx-auto">
          {/* Left Column: Map & SOS */}
          <div className={`transition-all duration-300 ${activeTab ? "lg:col-span-8" : "lg:col-span-5"}`}>
            <MapCanvas
              hospitals={hospitalsInRange}
              onTriggerSos={() => {
                setMlCondition("Emergency Trauma");
                setActiveTab("nearest");
                handleRunRecommendation("Emergency Trauma");
              }}
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
              <FeatureGrid
                onSelectCategory={(cat) => {
                  setActiveTab(cat);
                  if (cat === "nearest") {
                    handleRunRecommendation();
                  } else if (cat === "predictions") {
                    api.bedForecasts()
                      .then((data) => setBedForecasts(Array.isArray(data) ? data : []))
                      .catch(() => {});
                  }
                }}
              />
            ) : (
              <HospitalDrawer
                activeTab={activeTab}
                onBack={() => setActiveTab(null)}
                records={categoryData[activeTab] || hospitalsInRange}
                hospitals={hospitals}
                medicineCatalog={resolvedCatalog}
                rangeLabel={`${radiusKm} km of ${originLabel}`}
                activeStaff={staffSession}
                onOpenStaffPortal={() => setIsLoginOpen(true)}
                // ML props
                mlCondition={mlCondition}
                setMlCondition={setMlCondition}
                mlSpecialty={mlSpecialty}
                setMlSpecialty={setMlSpecialty}
                onRunRecommendation={handleRunRecommendation}
                isMlLoading={isMlLoading}
                mlRecommendations={mlRecommendations}
                outbreakData={outbreakData}
                bedForecasts={bedForecasts}
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
