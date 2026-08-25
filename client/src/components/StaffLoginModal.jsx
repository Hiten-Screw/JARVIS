// client/src/components/StaffLoginModal.jsx
import React, { useState } from "react";
import { Lock, Hospital, UserCheck, ShieldCheck, ArrowRight, Building2, PlusCircle } from "lucide-react";

export default function StaffLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isRegisteringHospital, setIsRegisteringHospital] = useState(false);
  const [formData, setFormData] = useState({
    hospitalId: "",
    userId: "",
    password: "",
    hospitalName: "",
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isRegisteringHospital) {
      // Mock Registration -> Auto assigns Admin
      const generatedHospId = "HOSP-" + Math.floor(100 + Math.random() * 900);
      const newAdminSession = {
        hospitalId: generatedHospId,
        userId: "admin",
        role: "HOSPITAL_ADMIN",
        hospitalName: formData.hospitalName || "Registered Hospital",
        token: "demo-jwt-token-admin",
      };
      localStorage.setItem("staffSession", JSON.stringify(newAdminSession));
      onLoginSuccess(newAdminSession);
      onClose();
    } else {
      // Mock Login Resolution
      let role = "NURSE";
      if (formData.userId.toLowerCase().includes("admin")) role = "HOSPITAL_ADMIN";
      else if (formData.userId.toLowerCase().includes("pharm")) role = "PHARMACIST";
      else if (formData.userId.toLowerCase().includes("doc")) role = "DOCTOR";

      const session = {
        hospitalId: formData.hospitalId || "HOSP-101",
        userId: formData.userId,
        role: role,
        token: "demo-jwt-token-staff",
      };
      localStorage.setItem("staffSession", JSON.stringify(session));
      onLoginSuccess(session);
      onClose();
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
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-8 flex flex-col gap-5 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
        >
          ✕
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
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {isRegisteringHospital ? (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Hospital / Facility Name</label>
              <div className="relative flex items-center">
                <Building2 className="w-4 h-4 absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  name="hospitalName"
                  required
                  value={formData.hospitalName}
                  onChange={handleChange}
                  placeholder="e.g. Sadar District Hospital"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">Hospital Facility ID</label>
              <div className="relative flex items-center">
                <Hospital className="w-4 h-4 absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  name="hospitalId"
                  required
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
            {isRegisteringHospital ? "Create Facility & Access Admin" : "Access Staff Dashboard"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsRegisteringHospital(!isRegisteringHospital)}
            className="text-emerald-700 font-semibold hover:underline cursor-pointer"
          >
            {isRegisteringHospital ? "← Back to Staff Login" : "+ Register New Hospital"}
          </button>
        </div>

        {/* Quick Fill for Fast Demoing
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Demo Fast Fill
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleFastFill("ADMIN")}
              type="button"
              className="py-1 px-2 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer text-center"
            >
              Admin
            </button>
            <button
              onClick={() => handleFastFill("NURSE")}
              type="button"
              className="py-1 px-2 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer text-center"
            >
              Nurse
            </button>
            <button
              onClick={() => handleFastFill("PHARM")}
              type="button"
              className="py-1 px-2 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer text-center"
            >
              Pharmacy
            </button>
          </div>
        </div> */}
      </div>
    </div>
  );
}