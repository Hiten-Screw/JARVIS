import React, { useEffect, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { PhoneCall, SlidersHorizontal, MapPin, Crosshair } from "lucide-react";
import L from "leaflet";
import { getHospitalMarkerIcon } from "../utils/mapIcons";
import { DEFAULT_MAP_CENTER, RADIUS_OPTIONS_KM } from "../utils/geo";

const userLocationIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-md"></span>
    </div>
  `,
  className: "user-gps-marker",
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const droppedPinIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="#7c3aed"/>
        <circle cx="14" cy="14" r="6" fill="white"/>
      </svg>
    </div>
  `,
  className: "dropped-origin-pin",
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -32]
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom(), { duration: 1.2 });
  }, [center, map]);
  return null;
}

function DropPinHandler({ enabled, onDrop }) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onDrop([event.latlng.lat, event.latlng.lng]);
    }
  });
  return null;
}

export default function MapCanvas({
  hospitals = [],
  onTriggerSos,
  origin,
  originMode,
  userLivePos,
  radiusKm,
  pinDropMode,
  onRadiusChange,
  onPinDropModeChange,
  onDropPin,
  onUseGps
}) {
  const [isLocating, setIsLocating] = useState(false);
  const mapCenter = origin || DEFAULT_MAP_CENTER;

  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onUseGps([position.coords.latitude, position.coords.longitude]);
        setIsLocating(false);
      },
      (error) => {
        console.warn("GPS error, falling back to default center:", error.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    handleGetLiveLocation();
  }, []);

  return (
    <section className="flex flex-col gap-3">
      <div className={`w-full h-[360px] md:h-[420px] bg-slate-100 border border-slate-200 rounded-2xl relative overflow-hidden shadow-inner z-0 ${pinDropMode ? "cursor-crosshair" : ""}`}>
        <MapContainer
          center={mapCenter}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <MapRecenter center={mapCenter} />
          <DropPinHandler enabled={pinDropMode} onDrop={onDropPin} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Circle
            center={mapCenter}
            radius={radiusKm * 1000}
            pathOptions={{ color: "#059669", weight: 2, fillColor: "#10b981", fillOpacity: 0.1 }}
          />

          {userLivePos && (
            <Marker position={userLivePos} icon={userLocationIcon}>
              <Popup>
                <div className="p-1 text-xs font-semibold text-slate-800">
                  Your live location
                </div>
              </Popup>
            </Marker>
          )}

          {originMode === "pin" && origin && (
            <Marker
              position={origin}
              icon={droppedPinIcon}
              draggable={true}
              eventHandlers={{
                dragend: (event) => {
                  const next = event.target.getLatLng();
                  onDropPin([next.lat, next.lng]);
                }
              }}
            >
              <Popup>
                <div className="p-1 text-xs font-semibold text-slate-800">
                  Search origin (drag to move)
                </div>
              </Popup>
            </Marker>
          )}

          {hospitals.map((hosp) => {
            const position = hosp.coordinates || DEFAULT_MAP_CENTER;
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

        {pinDropMode && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[400] bg-violet-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
            Tap the map to drop your search pin
          </div>
        )}

        <button
          onClick={handleGetLiveLocation}
          title="Use my live location"
          className="absolute bottom-3 right-3 z-[400] bg-white text-slate-700 p-2.5 rounded-xl shadow-md hover:bg-slate-50 border border-slate-200 transition-transform active:scale-95 cursor-pointer"
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? "animate-spin text-emerald-600" : originMode === "gps" ? "text-emerald-600" : "text-slate-600"}`} />
        </button>

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

      <button
        onClick={onTriggerSos}
        className="w-full bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 text-sm tracking-wide uppercase transition-all cursor-pointer"
      >
        <PhoneCall className="w-4 h-4 animate-pulse" />
        Instant Emergency SOS / Ambulance
      </button>

      <div className="grid grid-cols-2 gap-2">
        <label className="bg-white border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs shadow-xs">
          <span className="text-slate-500 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" /> Radius
          </span>
          <select
            value={radiusKm}
            onChange={(event) => onRadiusChange(Number(event.target.value))}
            className="font-semibold text-slate-700 bg-transparent text-xs outline-none cursor-pointer"
          >
            {RADIUS_OPTIONS_KM.map((km) => (
              <option key={km} value={km}>{km} km</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => onPinDropModeChange(!pinDropMode)}
          className={`bg-white border rounded-xl p-2.5 flex items-center justify-between text-xs shadow-xs cursor-pointer ${pinDropMode ? "border-violet-400 bg-violet-50" : "border-slate-200/80 hover:border-slate-300"}`}
        >
          <span className="text-slate-500 flex items-center gap-1.5">
            <MapPin className={`w-3.5 h-3.5 ${pinDropMode || originMode === "pin" ? "text-violet-600" : "text-emerald-600"}`} /> Drop pin
          </span>
          <span className="font-semibold text-slate-700">
            {pinDropMode ? "Tap map" : originMode === "pin" ? "Pinned" : "Set origin"}
          </span>
        </button>
      </div>
    </section>
  );
}
