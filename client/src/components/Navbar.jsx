// client/src/components/Navbar.jsx
import React from "react";
import { Activity, Search, ShieldCheck, LogOut } from "lucide-react";

export default function Navbar({ searchQuery, setSearchQuery, onOpenStaffPortal, activeStaff, onLogout }) {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm shadow-emerald-950/10">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-1.5">
              HealthGrid
            </span>
            <p className="text-[10px] text-slate-400 font-medium">Emergency Coordination Network</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden sm:flex items-center relative">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search hospitals, blood groups (O-), bed types..."
            className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Staff Portal / Auth Controls */}
        <div className="flex items-center gap-2">
          {activeStaff ? (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <span className="font-bold text-slate-700 uppercase font-mono">{activeStaff.userId}</span>
              <span className="text-[10px] bg-emerald-600 text-white font-semibold px-1.5 py-0.5 rounded">
                {activeStaff.role}
              </span>
              <button
                onClick={onLogout}
                title="Logout"
                className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenStaffPortal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Staff Portal
            </button>
          )}
        </div>
      </div>
    </header>
  );
}