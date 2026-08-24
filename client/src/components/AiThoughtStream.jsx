import React, { useState } from "react";
import { Bot } from "lucide-react";

export default function AiThoughtStream() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-950/20 font-semibold text-xs tracking-wide transition-all hover:scale-105 cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          AI Dispatch Feed
        </button>
      ) : (
        <div className="w-80 sm:w-96 bg-white border border-emerald-300 rounded-2xl p-4 shadow-xl text-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-600" /> AI Thought Stream
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5 font-mono text-[11px] text-slate-700 flex flex-col gap-1.5 max-h-48 overflow-y-auto border border-slate-200/60">
            <p className="text-emerald-700 font-semibold">[Autonomous Rebalance Engine]</p>
            <p className="text-slate-500">⚡ TEMP: Monitoring burn rates at Civil Hospital...</p>
            <p className="text-emerald-600">✓ TEMP: Found 50 excess Amoxicillin vials (Exp: 24d)[cite: 4].</p>
            <p className="text-amber-600">→ TEMP: Drafted dispatch permit to Rural PHC (ETA: 18m)[cite: 4].</p>
          </div>
        </div>
      )}
    </div>
  );
}