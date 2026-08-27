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

export default function App() {
  const [activeTab, setActiveTab] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRadius] = useState("10 km");
  const [hospitals, setHospitals] = useState([]);
  useEffect(() => {
    api.hospitals().then(async (items) => setHospitals(await Promise.all(items.map(async (hospital) => {
      const [resources, blood] = await Promise.all([
        api.resources(hospital.hospitalId),
        api.bloodStock(hospital.hospitalId)
      ]);
      const resource = (type) => resources.find((item) => item.resourceType === type);
      const general = resource("generalBed");
      const icu = resource("icuBed");
      const oxygen = resource("oxygen");
      return {
      ...hospital,
      id: hospital._id,
      coordinates: [hospital.location.coordinates[1], hospital.location.coordinates[0]],
      phone: hospital.contact,
      availableBeds: general?.available || 0,
      totalBeds: general?.total || 0,
      icuAvailable: icu?.available || 0,
      oxygenBeds: oxygen?.available || 0,
      bloodStock: Object.fromEntries(blood.stock.map((item) => [item.bloodGroup, item.currentStock]))
      };
    })))).catch(() => setHospitals([]));
  }, []);
  const categoryData = {
    beds: hospitals,
    blood: hospitals,
    nearest: hospitals,
    outbreak: [],
    resources: [],
    medicines: [],
    predictions: [],
    transfers: [],
    donors: [],
    organs: [],
    authority: []
  };

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
            hospitals={hospitals}
            onTriggerSos={() => setActiveTab("sos")}
            selectedRadius={selectedRadius}
          />
        </div>

        {/* Right Column: Cards vs Expanded Drawer */}
        <div className={`transition-all duration-300 ${activeTab ? "lg:col-span-4" : "lg:col-span-7"}`}>
          {!activeTab ? (
            <FeatureGrid onSelectCategory={(cat) => setActiveTab(cat)} />
          ) : (
            <HospitalDrawer
              activeTab={activeTab}
              onBack={() => setActiveTab(null)}
              records={categoryData[activeTab] || hospitals}
              medicineCatalog={[]}
            />
          )}
        </div>
      </main>

      <AiThoughtStream />
      {/* Staff Auth & Registration Modal */}
      {/* Staff Auth & Registration Modal */}
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