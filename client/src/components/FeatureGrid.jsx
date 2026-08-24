import React from "react";
import { Bed, Droplet, MapPin, AlertTriangle } from "lucide-react";

export default function FeatureGrid({ onSelectCategory }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full content-start">
      <div
        onClick={() => onSelectCategory("beds")}
        className="healthgrid-card cursor-pointer flex flex-col justify-between gap-4 group"
      >
        <div className="flex items-center justify-between">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Bed className="w-5 h-5" />
          </div>
          <span className="badge-mint">Live Status</span>
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-800 mb-1">Live Bed & ICU Capacity</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Track general, ICU ventilators, and oxygen unit availability across centers.
          </p>
        </div>
      </div>

      <div
        onClick={() => onSelectCategory("blood")}
        className="healthgrid-card cursor-pointer flex flex-col justify-between gap-4 group"
      >
        <div className="flex items-center justify-between">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <Droplet className="w-5 h-5" />
          </div>
          <span className="bg-rose-50 text-rose-700 border border-rose-200/70 text-xs font-semibold px-2.5 py-1 rounded-md">
            Units Stocked
          </span>
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-800 mb-1">Emergency Blood Bank</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Locate verified donors and units (A+, B+, O-, etc.) sorted by nearest storage.
          </p>
        </div>
      </div>

      <div
        onClick={() => onSelectCategory("nearest")}
        className="healthgrid-card cursor-pointer flex flex-col justify-between gap-4 group"
      >
        <div className="flex items-center justify-between">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="badge-mint">Fastest ETA</span>
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-800 mb-1">Nearest & Best Rated</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ranks hospitals by real travel time, emergency equipment, and doctors on shift.
          </p>
        </div>
      </div>

      <div
        onClick={() => onSelectCategory("outbreak")}
        className="healthgrid-card cursor-pointer flex flex-col justify-between gap-4 group"
      >
        <div className="flex items-center justify-between">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <span className="bg-amber-50 text-amber-700 border border-amber-200/70 text-xs font-semibold px-2.5 py-1 rounded-md">
            Surveillance
          </span>
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-800 mb-1">Outbreak Surveillance</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Gaussian anomaly surge detection for Dengue, viral fevers, and bed demand[cite: 4].
          </p>
        </div>
      </div>
    </div>
  );
}