// client/src/components/MapCanvas.jsx
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { PhoneCall, SlidersHorizontal, Hospital, ChevronDown, Crosshair } from "lucide-react";
import L from "leaflet";
import { getHospitalMarkerIcon } from "../utils/mapIcons";

// TEMP__DEFAULT_CENTER: Prayagraj Coordinates [lat, lng]
const DEFAULT_CENTER = [25.4358, 81.8463];

// Helper: Custom Blue Pulse Icon for Live User Location
const userLocationIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></span>
    </div>
  `,
  className: "user-gps-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Helper Component: Pans map whenever target center changes
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function MapCanvas({ hospitals = [], onTriggerSos, selectedRadius }) {
  const [currentPosition, setCurrentPosition] = useState(DEFAULT_CENTER);
  const [userLivePos, setUserLivePos] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  // 1. Fetch User's Live GPS Location
  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        setUserLivePos(coords);
        setCurrentPosition(coords);
        setIsLocating(false);
      },
      (error) => {
        console.warn("GPS error, falling back to default center:", error.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Attempt to fetch GPS on initial mount
  useEffect(() => {
    handleGetLiveLocation();
  }, []);

  return (
    <section className="flex flex-col gap-3">
      {/* 1. Leaflet Interactive Container */}
      <div className="w-full h-[360px] md:h-[420px] bg-slate-100 border border-slate-200 rounded-2xl relative overflow-hidden shadow-inner z-0">
        <MapContainer
          center={currentPosition}
          zoom={13}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <MapRecenter center={currentPosition} />

          {/* OpenStreetMap Base Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User's Live GPS Pin */}
          {userLivePos && (
            <Marker position={userLivePos} icon={userLocationIcon}>
              <Popup>
                <div className="p-1 text-xs font-semibold text-slate-800">
                  📍 Your Live Location
                </div>
              </Popup>
            </Marker>
          )}

          {/* Dynamic Hospital Pins */}
          {hospitals.map((hosp) => {
            const position = hosp.coordinates || [25.4358, 81.8463];
            const total = hosp.totalBeds || 1;
            const available = hosp.availableBeds || 0;

            return (
              <Marker
                key={hosp.id}
                position={position}
                icon={getHospitalMarkerIcon(available, total)}
              >
                <Popup>
                  <div className="p-1 flex flex-col gap-1 text-slate-800">
                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
                      {hosp.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      Distance: {hosp.distance || "Nearby"}
                    </p>

                    <div className="grid grid-cols-2 gap-1 py-1.5 text-center text-xs">
                      <div className="bg-emerald-50 text-emerald-700 font-semibold p-1 rounded">
                        {hosp.availableBeds} Free Beds
                      </div>
                      <div className="bg-blue-50 text-blue-700 font-semibold p-1 rounded">
                        {hosp.icuAvailable} ICU Units
                      </div>
                    </div>

                    <div className="flex gap-1.5 mt-1">
                      <a
                        href={`tel:${hosp.phone}`}
                        className="flex-1 py-1 bg-emerald-600 text-white rounded text-center text-[11px] font-bold no-underline"
                      >
                        Call Desk
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-1 bg-slate-800 text-white rounded text-center text-[11px] font-bold no-underline"
                      >
                        GPS Route
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* GPS Re-center Floating Action Button */}
        <button
          onClick={handleGetLiveLocation}
          title="Locate Me"
          className="absolute bottom-3 right-3 z-[400] bg-white text-slate-700 p-2.5 rounded-xl shadow-md hover:bg-slate-50 border border-slate-200 transition-transform active:scale-95 cursor-pointer"
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? "animate-spin text-emerald-600" : "text-slate-600"}`} />
        </button>

        {/* Floating Legend Overlay */}
        <div className="absolute top-3 left-3 z-[400] flex gap-2 bg-white/90 backdrop-blur border border-slate-200 px-2.5 py-1 rounded-lg text-xs shadow-xs pointer-events-none">
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Open (&gt;20%)
          </span>
          <span className="flex items-center gap-1.5 text-amber-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Low (&lt;10%)
          </span>
          <span className="flex items-center gap-1.5 text-rose-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Full
          </span>
        </div>
      </div>

      {/* 2. Emergency Action Button */}
      <button
        onClick={onTriggerSos}
        className="w-full bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 text-sm tracking-wide uppercase transition-all cursor-pointer"
      >
        <PhoneCall className="w-4 h-4 animate-pulse" />
        Instant Emergency SOS / Ambulance
      </button>

      {/* 3. Radius & Facility Selector */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs cursor-pointer hover:border-slate-300 shadow-xs">
          <span className="text-slate-500 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" /> Radius
          </span>
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            {selectedRadius} <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </span>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs cursor-pointer hover:border-slate-300 shadow-xs">
          <span className="text-slate-500 flex items-center gap-1.5">
            <Hospital className="w-3.5 h-3.5 text-emerald-600" /> Facility
          </span>
          <span className="font-semibold text-slate-700 flex items-center gap-1">
            All Types <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </span>
        </div>
      </div>
    </section>
  );
}