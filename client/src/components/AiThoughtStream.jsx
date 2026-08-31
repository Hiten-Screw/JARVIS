import React, { useState, useEffect } from "react";
import { Bot, Cpu, Sparkles, Activity, ShieldAlert, X } from "lucide-react";

export default function AiThoughtStream() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, text: "[XGBoost Engine] Model weights loaded from hospital_recommendation_model.json", time: "Just now", type: "system" },
    { id: 2, text: "[Surveillance] Tracking 984 outbreak admissions across 30 regional centers", time: "1m ago", type: "surveillance" },
    { id: 3, text: "[Triage] Capacity scoring active for General Beds (65%) & Doctors (35%)", time: "2m ago", type: "ml" },
    { id: 4, text: "[Bed Forecaster] 24h surge risk prediction model synchronized (confidence: 92%)", time: "3m ago", type: "forecast" }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const messages = [
        { text: "[XGBoost] Re-evaluating distance weights & capacity strain for nearby emergency wards", type: "ml" },
        { text: "[Surveillance] Heart Attack demand index flagged at 2.23x base strain", type: "surveillance" },
        { text: "[Dispatch] AI recommendation ranking optimized for fastest emergency ETA", type: "dispatch" },
        { text: "[Telemetry] Bed occupancy history vector ingested into forecasting pipeline", type: "forecast" }
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setLogs((prev) => [
        { id: Date.now(), text: randomMsg.text, time: "Just now", type: randomMsg.type },
        ...prev.slice(0, 10)
      ]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-full shadow-lg shadow-emerald-950/20 font-semibold text-xs tracking-wide transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
          AI Dispatch & ML Telemetry
        </button>
      ) : (
        <div className="w-80 sm:w-96 bg-white border border-emerald-300 rounded-2xl p-4 shadow-2xl text-xs flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-600" /> AI Thought Stream & ML Feed
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-slate-900 rounded-xl p-3 font-mono text-[11px] text-slate-200 flex flex-col gap-2 max-h-56 overflow-y-auto border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> XGBoost ML Core</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live
              </span>
            </div>
            {logs.map((log) => (
              <div key={log.id} className="flex flex-col gap-0.5">
                <p className={`${
                  log.type === "ml"
                    ? "text-emerald-300"
                    : log.type === "surveillance"
                    ? "text-amber-300"
                    : log.type === "forecast"
                    ? "text-blue-300"
                    : "text-slate-300"
                }`}>
                  {log.text}
                </p>
                <span className="text-[9px] text-slate-500">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}