// client/src/components/StaffLoginModal.jsx
import { useState } from "react";
import { Lock, Hospital, UserCheck, ShieldCheck, ArrowRight, ArrowLeft, Plus, X } from "lucide-react";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { api } from "../services/api";

const DEFAULT_MAP_CENTER = [25.4358, 81.8463];

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click: (event) => onSelect(event.latlng.lat, event.latlng.lng)
  });
  return null;
}

function RegistrationMap({ position, onSelect }) {
  const mapPosition = position || DEFAULT_MAP_CENTER;

  return <div className="h-44 rounded-xl overflow-hidden border border-slate-200">
    <MapContainer center={mapPosition} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onSelect={onSelect} />
      {position && <CircleMarker center={position} radius={9} pathOptions={{ color: "#047857", fillColor: "#10b981", fillOpacity: 0.9 }} />}
    </MapContainer>
  </div>;
}

export default function StaffLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegisteringHospital, setIsRegisteringHospital] = useState(false);
  const [formData, setFormData] = useState({
    hospitalId: "",
    userId: "",
    password: "",
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    contact: "",
    specializations: "",
    hospitalType: "government",
    emergencyDepartment: false
  });
  const [message, setMessage] = useState("");
  const [coordinateMode, setCoordinateMode] = useState("manual");

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (isRegisteringHospital) {
      try {
        await api.submitHospitalRegistration({
          hospitalId: formData.hospitalId,
          name: formData.name,
          address: formData.address,
          location: { type: "Point", coordinates: [Number(formData.longitude), Number(formData.latitude)] },
          contact: formData.contact,
          specializations: formData.specializations.split(",").map((item) => item.trim()).filter(Boolean),
          hospitalType: formData.hospitalType,
          emergencyDepartment: formData.emergencyDepartment,
          adminUserId: formData.userId,
          adminPassword: formData.password
        });
        setMessage("Registration request submitted for super-admin approval.");
        setIsRegisteringHospital(false);
      } catch (error) {
        setMessage(error.message);
      }
    } else {
      try {
        const result = await api.login({
          userId: formData.userId,
          password: formData.password,
          hospitalId: formData.hospitalId || undefined
        });
        const user = result.user;
        const session = { ...user, token: result.token };
        localStorage.setItem("staffSession", JSON.stringify(session));
        onLoginSuccess(session);
        onClose();
      } catch (error) {
        setMessage(error.message);
      }
    }
  };

  // Demo 1-Click Fast Fill for Evaluators
  // const handleFastFill = (roleType) => {
  //   setIsRegisteringHospital(false);
  //   if (roleType === "ADMIN") {
  //     setFormData({ hospitalId: "HOSP-101", userId: "admin", password: "123", hospitalName: "" });
  //   } else if (roleType === "NURSE") {
  //     setFormData({ hospitalId: "HOSP-101", userId: "nurse_01", password: "123", hospitalName: "" });
  //   } else if (roleType === "PHARM") {
  //     setFormData({ hospitalId: "HOSP-101", userId: "pharm_01", password: "123", hospitalName: "" });
  //   }
  // };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 flex flex-col gap-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {isRegisteringHospital ? "Register Facility & Admin" : "Hospital Staff Login"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRegisteringHospital
              ? "Register a hospital to obtain your Facility ID and Admin credentials."
              : "Enter your assigned Hospital ID, User ID, and password."}
          </p>
          {message && <p className="text-xs font-semibold text-amber-700 mt-3">{message}</p>}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {isRegisteringHospital ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 text-xs font-semibold text-slate-700">Hospital ID<input type="text" name="hospitalId" required value={formData.hospitalId} onChange={handleChange} placeholder="e.g. HOSP-101" className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase" /></label>
              <label className="col-span-2 text-xs font-semibold text-slate-700">Hospital name<input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Sadar District Hospital" className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs" /></label>
              <label className="col-span-2 text-xs font-semibold text-slate-700">Address<input type="text" name="address" required value={formData.address} onChange={handleChange} placeholder="Full hospital address" className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs" /></label>
              <div className="col-span-2 flex items-center justify-between"><span className="text-xs font-semibold text-slate-700">Location coordinates</span><div className="flex rounded-lg border border-slate-200 overflow-hidden"><button type="button" onClick={() => setCoordinateMode("manual")} className={`px-2.5 py-1.5 text-[11px] font-semibold ${coordinateMode === "manual" ? "bg-slate-800 text-white" : "bg-white text-slate-500"}`}>Manual</button><button type="button" onClick={() => setCoordinateMode("map")} className={`px-2.5 py-1.5 text-[11px] font-semibold ${coordinateMode === "map" ? "bg-emerald-600 text-white" : "bg-white text-slate-500"}`}>Drop pin</button></div></div>
              {coordinateMode === "map" && <div className="col-span-2"><RegistrationMap position={formData.latitude && formData.longitude ? [Number(formData.latitude), Number(formData.longitude)] : null} onSelect={(latitude, longitude) => setFormData({ ...formData, latitude: latitude.toFixed(6), longitude: longitude.toFixed(6) })} /><p className="text-[11px] text-slate-500 mt-1">Click anywhere on the map to place the hospital pin.</p></div>}
              <label className="text-xs font-semibold text-slate-700">Latitude<input type="number" name="latitude" required min="-90" max="90" step="any" value={formData.latitude} onChange={handleChange} placeholder="25.4358" className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs" /></label>
              <label className="text-xs font-semibold text-slate-700">Longitude<input type="number" name="longitude" required min="-180" max="180" step="any" value={formData.longitude} onChange={handleChange} placeholder="81.8463" className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs" /></label>
              <label className="text-xs font-semibold text-slate-700">Contact<input type="text" name="contact" required value={formData.contact} onChange={handleChange} placeholder="Phone number" className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs" /></label>
              <label className="text-xs font-semibold text-slate-700">Hospital type<select name="hospitalType" value={formData.hospitalType} onChange={handleChange} className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs"><option value="government">Government</option><option value="private">Private</option><option value="specialized">Specialized</option><option value="other">Other</option></select></label>
              <label className="col-span-2 text-xs font-semibold text-slate-700">Specializations<input type="text" name="specializations" value={formData.specializations} onChange={handleChange} placeholder="Emergency, Cardiology, Trauma" className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs" /></label>
              <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-700"><input type="checkbox" name="emergencyDepartment" checked={formData.emergencyDepartment} onChange={(event) => setFormData({ ...formData, emergencyDepartment: event.target.checked })} /> Emergency department available</label>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Hospital Facility ID {formData.userId.toLowerCase() === "superadmin" && <span className="font-normal text-slate-400">(not required for super admin)</span>}</label>
              <div className="relative flex items-center">
                <Hospital className="w-4 h-4 absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  name="hospitalId"
                  required={formData.userId.toLowerCase() !== "superadmin"}
                  value={formData.hospitalId}
                  onChange={handleChange}
                  placeholder="e.g. HOSP-101"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono uppercase"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">
              {isRegisteringHospital ? "Admin User ID" : "Staff User ID"}
            </label>
            <div className="relative flex items-center">
              <UserCheck className="w-4 h-4 absolute left-3.5 text-slate-400" />
              <input
                type="text"
                name="userId"
                required
                value={formData.userId}
                onChange={handleChange}
                placeholder={isRegisteringHospital ? "admin" : "e.g. nurse_ward1"}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-700">Security Passcode</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3.5 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            {isRegisteringHospital ? "Submit registration request" : "Access Staff Dashboard"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsRegisteringHospital(!isRegisteringHospital)}
            className="text-emerald-700 font-semibold hover:underline cursor-pointer flex items-center gap-1"
          >
            {isRegisteringHospital ? (
              <>
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Staff Login
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Register New Hospital
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}