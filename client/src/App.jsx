// client/src/App.jsx
import React, { useState } from "react";
import Navbar from "./components/Navbar";
import MapCanvas from "./components/MapCanvas";
import FeatureGrid from "./components/FeatureGrid";
import HospitalDrawer from "./components/HospitalDrawer";
import AiThoughtStream from "./components/AiThoughtStream";
import { MOCK__HOSPITALS } from "./data/mockData";

export default function App() {
  const [activeTab, setActiveTab] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRadius] = useState("10 km");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      <main className="flex-1 p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-7xl w-full mx-auto">
        {/* Left Column: Map & SOS */}
        <div className={`transition-all duration-300 ${activeTab ? "lg:col-span-8" : "lg:col-span-5"}`}>
          <MapCanvas
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
              hospitals={MOCK__HOSPITALS}
            />
          )}
        </div>
      </main>

      <AiThoughtStream />
    </div>
  );
}