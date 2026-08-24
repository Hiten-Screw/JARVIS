import React from "react";
import { Activity, Search } from "lucide-react";

export default function Navbar({ searchQuery, setSearchQuery }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between gap-4 sticky top-0 z-50 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-600 p-2 rounded-lg text-white font-black flex items-center justify-center shadow-sm shadow-emerald-600/30">
          <Activity className="w-5 h-5" />
        </div>
        <span className="font-bold text-lg md:text-xl tracking-tight text-slate-900">
          Health<span className="text-emerald-600">Grid</span>
        </span>
      </div>

      <div className="flex-1 max-w-md relative hidden sm:block">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search hospitals, blood groups (O-), bed types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-100/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
        />
      </div>

      <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 transition-colors">
        Staff Portal
      </button>
    </header>
  );
}