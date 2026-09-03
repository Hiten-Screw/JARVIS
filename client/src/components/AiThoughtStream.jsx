import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  Sparkles,
  X,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Activity,
  PhoneCall,
  Navigation,
  ShieldAlert,
  Hospital,
  ArrowRight
} from "lucide-react";
import { api } from "../services/api";

const QUICK_PROMPTS = [
  { label: "Emergency Cardiac Triage", query: "Patient with acute chest pain and cardiac distress, recommend the best emergency facility." },
  { label: "Check ICU Beds in Prayagraj", query: "Find hospitals with available ICU and ventilator beds in Prayagraj." },
  { label: "Outbreak Strain Summary", query: "What are the highest demand epidemic conditions right now in Uttar Pradesh?" },
  { label: "Varanasi Trauma Hospital", query: "Severe trauma injury near Varanasi, find nearest emergency hospital." }
];

export default function AiThoughtStream({ onSelectAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedTraceId, setExpandedTraceId] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: "intro",
      role: "assistant",
      text: "Hello! I am your **JARVIS Clinical AI Copilot**. Ask me any medical triage query, bed availability check, or emergency dispatch instruction.",
      thoughts: [
        "Connected to live hospital database telemetry.",
        "XGBoost triage models & bed surge forecasters synchronized."
      ],
      time: "Just now"
    }
  ]);

  const streamEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && streamEndRef.current) {
      streamEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  const handleRunQuery = async (queryText) => {
    const q = (queryText || inputQuery).trim();
    if (!q) return;

    setInputQuery("");
    setIsLoading(true);

    const userMsgId = Date.now();
    const assistantMsgId = userMsgId + 1;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        text: q,
        time: "Just now"
      }
    ]);

    try {
      let response;
      try {
        response = await api.queryAgent({ query: q });
      } catch (networkErr) {
        console.warn("Backend agent query error:", networkErr);
        /*
        // Hardcoded simulation responses commented out to prevent displaying fake hospital telemetry
        const isVaranasi = q.toLowerCase().includes("varanasi") || q.toLowerCase().includes("varansi");
        const isCardiac = q.toLowerCase().includes("chest") || q.toLowerCase().includes("heart") || q.toLowerCase().includes("crushing");

        if (isVaranasi) {
          response = {
            conclusion: "For emergency chest trauma in **Varanasi**, **BHU Sir Sunderlal Hospital (HOSP-201)** is the highest-ranked tertiary care center with 82 available beds, active trauma resuscitation, and 24/7 cardiac ICU. Contact: +91-542-2307500.",
            summary: {
              assumedProblem: "Severe Chest Trauma / Emergency",
              hospitalName: "BHU Sir Sunderlal Hospital",
              hospitalPhone: "+91-542-2307500",
              distance: "Apex Institute · Varanasi",
              triageLevel: "Level 1 Critical Emergency"
            },
            thoughtStream: [
              { text: "Identified location: Varanasi, Uttar Pradesh." },
              { text: "Executed triage match for emergency thoracic trauma." },
              { text: "Top matched facility: BHU Sir Sunderlal Hospital (Apex Institute, 82 free beds)." }
            ],
            confidenceScore: 0.96
          };
        } else if (isCardiac) {
          response = {
            conclusion: "For acute cardiac distress, **Swaroop Rani Nehru Hospital (SRN - HOSP-102)** and **Prayagraj Central Civil Hospital (HOSP-101)** are the top recommendations (97% match). SRN has 62 available beds, active cath lab, and immediate emergency trauma intake. Contact: +91-532-2256011.",
            summary: {
              assumedProblem: "Acute Coronary Syndrome (Heart Attack)",
              hospitalName: "Swaroop Rani Nehru Hospital (SRN)",
              hospitalPhone: "+91-532-2256011",
              distance: "2.0 km · Chatham Lines",
              triageLevel: "Level 1 Critical Emergency"
            },
            thoughtStream: [
              { text: "Evaluated symptoms against cardiovascular emergency profile." },
              { text: "Queried live hospital bed telemetry in Prayagraj." },
              { text: "Selected Swaroop Rani Nehru Hospital (97.0% XGBoost match, 2.0 km)." }
            ],
            confidenceScore: 0.97
          };
        } else {
          response = {
            conclusion: "Evaluated clinical query across regional hospital network. All emergency nodes in Prayagraj are active with verified bed buffers and live telemetry connected.",
            summary: {
              assumedProblem: "Clinical Network Inquiry",
              hospitalName: "Prayagraj Central Civil Hospital",
              hospitalPhone: "+91-532-2460123",
              distance: "Civil Lines, Prayagraj",
              triageLevel: "Active Telemetry"
            },
            thoughtStream: [
              { text: "Analyzed clinical query and parsed symptom indicators." },
              { text: "Audited live database records and bed capacities." }
            ],
            confidenceScore: 0.94
          };
        }
        */
        response = {
          conclusion: "Unable to reach the clinical AI assistant service. Please ensure the backend server is running.",
          summary: null,
          thoughtStream: [
            { text: "Attempted query to AI agent API endpoint." },
            { text: "Connection unavailable or service offline." }
          ],
          confidenceScore: null
        };
      }

      const thoughts = (response?.thoughtStream || []).map((t) => t.text || t);
      const summary = response?.summary || null;

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          text: response?.conclusion || "Clinical recommendation not available.",
          summary,
          thoughts: thoughts.length > 0 ? thoughts : ["Telemetry evaluation completed."],
          confidence: response?.confidenceScore ? Math.round(response.confidenceScore * 100) : null,
          time: "Just now"
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: "assistant",
          text: "An error occurred while processing your request. Data is currently not available.",
          thoughts: ["Request failed."],
          time: "Just now"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-full shadow-lg shadow-emerald-950/15 font-semibold text-xs tracking-wide transition-all cursor-pointer border border-emerald-500/50"
        >
          <Sparkles className="w-4 h-4 text-emerald-100 animate-pulse" />
          <span>AI Clinical Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
        </button>
      ) : (
        <div className="w-[92vw] sm:w-[450px] max-w-[470px] bg-white border border-slate-200/90 rounded-3xl shadow-2xl flex flex-col h-[540px] animate-in fade-in slide-in-from-bottom-4 duration-200 overflow-hidden">

          <div className="px-4 py-3 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 leading-snug">
                  JARVIS Clinical Gemini
                  <span className="text-[9px] font-mono font-bold bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                    Gemini 3.6
                  </span>
                </h3>
                <p className="text-[10px] text-emerald-100/90 font-medium">
                  Live Emergency Triage & Hospital Intelligence
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto flex flex-col gap-3.5 bg-slate-50/60">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const isTraceOpen = expandedTraceId === msg.id;
              const summary = msg.summary;
              const isCritical = summary?.triageLevel?.includes("Critical") || summary?.triageLevel?.includes("Emergency");
              const isUrgent = summary?.triageLevel?.includes("Urgent");

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`p-3.5 text-xs leading-relaxed max-w-[94%] shadow-2xs ${
                      isUser
                        ? "bg-emerald-600 text-white rounded-2xl rounded-tr-xs font-medium"
                        : "bg-white text-slate-800 border border-slate-200/90 rounded-2xl rounded-tl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    
                    {!isUser && summary && (
                      <div className={`mt-3 p-3 rounded-2xl flex flex-col gap-2.5 shadow-2xs border ${
                        isCritical
                          ? "bg-gradient-to-br from-rose-50/70 via-emerald-50/30 to-white border-rose-300"
                          : isUrgent
                          ? "bg-gradient-to-br from-amber-50/70 via-emerald-50/30 to-white border-amber-300"
                          : "bg-gradient-to-br from-emerald-50/80 to-white border-emerald-300"
                      }`}>
                        <div className="flex items-center justify-between border-b border-slate-200/70 pb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            {isCritical ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <Hospital className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            {isCritical ? "Dispatch Triage Summary" : "Recommendation Summary"}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            isCritical
                              ? "bg-rose-100 text-rose-700 border-rose-200"
                              : isUrgent
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : "bg-emerald-100 text-emerald-800 border-emerald-200"
                          }`}>
                            {summary.triageLevel || "Specialty Care"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-1 text-[11px]">
                          <div className="text-slate-700">
                            <span className="font-bold text-slate-900">Clinical Focus:</span>{" "}
                            <span className={`font-semibold ${isCritical ? "text-rose-700" : "text-emerald-800"}`}>
                              {summary.assumedProblem}
                            </span>
                          </div>
                          <div className="text-slate-700">
                            <span className="font-bold text-slate-900">Top Hospital:</span>{" "}
                            <span className="font-semibold text-emerald-800">{summary.hospitalName}</span>{" "}
                            {summary.distance && (
                              <span className="text-[10px] text-slate-500 font-mono">({summary.distance})</span>
                            )}
                          </div>
                        </div>

                        {summary.hospitalPhone && (
                          <div className="flex items-center gap-2 pt-1">
                            <a
                              href={`tel:${summary.hospitalPhone.replace(/[^0-9+]/g, "")}`}
                              className={`flex-1 py-2 px-3 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                                isCritical
                                  ? "bg-gradient-to-r from-rose-600 to-emerald-600 hover:from-rose-500 hover:to-emerald-500"
                                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                              }`}
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-white animate-pulse" />
                              <span>Call Desk: {summary.hospitalPhone}</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectAction) onSelectAction("triage");
                              }}
                              title="View Hospital on Map & Drawer"
                              className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer shadow-xs"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {!isUser && msg.thoughts && msg.thoughts.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => setExpandedTraceId(isTraceOpen ? null : msg.id)}
                          className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer transition-colors"
                        >
                          <Activity className="w-3 h-3 text-emerald-600" />
                          <span>
                            {isTraceOpen ? "Hide Reasoning Steps" : `View Thought Stream (${msg.thoughts.length} steps)`}
                          </span>
                          {isTraceOpen ? (
                            <ChevronUp className="w-3 h-3 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-slate-400" />
                          )}
                        </button>

                        {isTraceOpen && (
                          <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200/70 rounded-xl text-[10px] font-mono text-slate-600 space-y-1 animate-in fade-in duration-150">
                            {msg.thoughts.map((step, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">•</span>
                                <span>{step}</span>
                              </div>
                            ))}
                            {msg.confidence && (
                              <div className="pt-1 text-[9px] text-emerald-700 font-bold">
                                XGBoost Confidence Rating: {msg.confidence}%
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 px-1">{msg.time || "Just now"}</span>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-emerald-200 text-emerald-800 rounded-2xl rounded-tl-xs text-xs shadow-2xs animate-pulse max-w-[85%]">
                <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span className="font-medium text-[11px]">Evaluating live telemetry & hospital capacity...</span>
              </div>
            )}
            <div ref={streamEndRef} />
          </div>

          <div className="px-3 pt-2 pb-1 bg-white border-t border-slate-100">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRunQuery(qp.query)}
                  disabled={isLoading}
                  className="shrink-0 px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 border border-slate-200/80 hover:border-emerald-300 text-slate-600 rounded-lg text-[10px] font-medium transition-all cursor-pointer disabled:opacity-50"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunQuery();
            }}
            className="p-3 bg-white flex items-center gap-2 border-t border-slate-100"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything (e.g. Triage chest injury in Varanasi)..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200/90 focus:border-emerald-500 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold transition-all cursor-pointer shadow-xs"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}