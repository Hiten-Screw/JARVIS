import React from "react";
import { ArrowLeft, PhoneCall, Navigation } from "lucide-react";

export default function HospitalDrawer({ activeTab, onBack, hospitals }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 h-full flex flex-col shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {activeTab} view
        </span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {hospitals.map((hosp) => (
          <div
            key={hosp.id}
            className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col gap-2 hover:bg-white hover:border-emerald-300 transition-all shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">{hosp.name}</h4>
              <span className="text-xs text-slate-500 font-mono">{hosp.distance}</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 py-1 text-center">
              <div className="bg-white p-1.5 rounded-lg border border-slate-200/70">
                <span className="block text-[10px] text-slate-400 uppercase">Available</span>
                <span className="font-bold text-xs text-emerald-600">
                  {hosp.availableBeds}/{hosp.totalBeds}
                </span>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-slate-200/70">
                <span className="block text-[10px] text-slate-400 uppercase">ICU Beds</span>
                <span className="font-bold text-xs text-slate-700">{hosp.icuAvailable}</span>
              </div>
              <div className="bg-white p-1.5 rounded-lg border border-slate-200/70">
                <span className="block text-[10px] text-slate-400 uppercase">Oxygen</span>
                <span className="font-bold text-xs text-amber-600">{hosp.oxygenBeds}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <a
                href={`tel:${hosp.phone}`}
                className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <PhoneCall className="w-3 h-3" /> Call
              </a>
              <button className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer">
                <Navigation className="w-3 h-3" /> Directions
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}