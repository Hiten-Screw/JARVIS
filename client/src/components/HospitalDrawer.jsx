import { useState, useEffect } from "react";
import { ArrowLeft, Navigation, PhoneCall, Hospital, Activity, AlertTriangle, TrendingUp, Search, Loader2, CheckCircle2, ShieldAlert, Lock, Check, X, Truck, ArrowRight, ShieldCheck, RefreshCw, Zap, FileText, Plus } from "lucide-react";

const TITLES = {
  beds: "Bed Capacity",
  blood: "Blood Availability",
  nearest: "AI Hospital Recommendation",
  outbreak: "Outbreak Surveillance",
  resources: "Resource Inventory",
  medicines: "Medicine Catalog",
  predictions: "Bed Demand Forecast",
  transfers: "Transfer Queue",
  donors: "Donor Network",
  organs: "Organ Matches",
  authority: "Authority Summary"
};

const RESOURCE_LABELS = {
  generalBed: "General Beds",
  icuBed: "ICU Beds",
  emergencyBed: "Emergency Beds",
  ventilator: "Ventilators",
  oxygen: "Oxygen"
};

const POPULAR_CONDITIONS = [
  "Heart Attack",
  "Appendicitis",
  "Stroke",
  "Fractured Leg",
  "Trauma",
  "Hypertension",
  "Childbirth",
  "Respiratory Infection"
];

const SPECIALTY_OPTIONS = [
  { value: "", label: "All Specialties" },
  { value: "Cardiology", label: "Cardiology" },
  { value: "Emergency", label: "Emergency Medicine" },
  { value: "Neurology", label: "Neurology" },
  { value: "Orthopedics", label: "Orthopedics" },
  { value: "General Surgery", label: "General Surgery" },
  { value: "Pulmonology", label: "Pulmonology" },
  { value: "Pediatrics", label: "Pediatrics" },
  { value: "Trauma Care", label: "Trauma Care" }
];

function Metric({ label, value, tone = "text-slate-700" }) {
  return (
    <div className="bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
      <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`font-bold text-xs ${tone}`}>{value}</span>
    </div>
  );
}

function OutbreakSurveillanceView({ outbreakData, onSelectConditionForRecommendation }) {
  const data = outbreakData || {};
  const conditions = data.conditions || [];
  const stateSummary = data.state_summary || [];

  return (
    <div className="flex flex-col gap-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-3 rounded-xl border border-amber-200">
        <div className="text-center">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Tracked Cases</span>
          <p className="text-lg font-extrabold text-amber-700 font-mono">{data.total_cases_tracked || 984}</p>
        </div>
        <div className="text-center border-x border-amber-200/60 px-1">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Top Strain</span>
          <p className="text-xs font-bold text-slate-800 truncate mt-1">{data.highest_demand_condition || "Heart Attack"}</p>
        </div>
        <div className="text-center">
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Active Strains</span>
          <p className="text-lg font-extrabold text-rose-600 font-mono">{conditions.length}</p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          Condition Demand Signals & Surveillance Strains
        </h4>
        <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
          {conditions.map((item, idx) => {
            const strainTone = item.strainLevel === "Critical"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : item.strainLevel === "High"
              ? "bg-amber-50 text-amber-700 border-amber-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200";

            return (
              <div
                key={idx}
                className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl flex flex-col gap-2 hover:border-amber-300 transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{item.condition}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${strainTone}`}>
                      {item.strainLevel}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-700">{item.patientCount} cases</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Metric label="Case Share" value={`${item.sharePct}%`} tone="text-amber-700" />
                  <Metric label="Risk Score" value={`${item.riskScore}x`} tone="text-rose-700" />
                </div>

                <button
                  onClick={() => onSelectConditionForRecommendation(item.condition)}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Hospital className="w-3 h-3" /> Find Recommended Hospitals for {item.condition}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {stateSummary.length > 0 && (
        <div className="pt-2 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 mb-2">Regional Strain Index</h4>
          <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
            {stateSummary.slice(0, 10).map((st, idx) => (
              <div key={idx} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700 truncate">{st.state}</span>
                <span className="font-mono font-bold text-emerald-700">{st.patientCount} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_BED_FORECASTS = [
  {
    id: "forecast-hosp-1",
    hospitalName: "Civil Hospital (Tej Bahadur Sapru)",
    predictedForDate: "2026-09-01",
    predictedBeds: 108,
    predictedICUBeds: 16,
    predictedEmergencyBeds: 14,
    confidence: 0.94,
    riskLevel: "critical",
    modelVersion: "xgb-bed-forecast-v1.2",
    capacityStrainPct: 85.0,
    surgeProbability: 0.78
  },
  {
    id: "forecast-hosp-2",
    hospitalName: "Swaroop Rani Nehru Hospital (SRN)",
    predictedForDate: "2026-09-01",
    predictedBeds: 236,
    predictedICUBeds: 38,
    predictedEmergencyBeds: 24,
    confidence: 0.92,
    riskLevel: "critical",
    modelVersion: "xgb-bed-forecast-v1.2",
    capacityStrainPct: 92.5,
    surgeProbability: 0.82
  },
  {
    id: "forecast-hosp-3",
    hospitalName: "Kamla Nehru Memorial Hospital",
    predictedForDate: "2026-09-01",
    predictedBeds: 162,
    predictedICUBeds: 22,
    predictedEmergencyBeds: 18,
    confidence: 0.89,
    riskLevel: "high",
    modelVersion: "xgb-bed-forecast-v1.2",
    capacityStrainPct: 76.4,
    surgeProbability: 0.58
  },
  {
    id: "forecast-hosp-4",
    hospitalName: "United Medicity & Superspeciality Hospital",
    predictedForDate: "2026-09-01",
    predictedBeds: 184,
    predictedICUBeds: 28,
    predictedEmergencyBeds: 20,
    confidence: 0.93,
    riskLevel: "high",
    modelVersion: "xgb-bed-forecast-v1.2",
    capacityStrainPct: 80.0,
    surgeProbability: 0.65
  },
  {
    id: "forecast-hosp-5",
    hospitalName: "Nazareth Hospital",
    predictedForDate: "2026-09-01",
    predictedBeds: 92,
    predictedICUBeds: 14,
    predictedEmergencyBeds: 12,
    confidence: 0.91,
    riskLevel: "medium",
    modelVersion: "xgb-bed-forecast-v1.2",
    capacityStrainPct: 68.2,
    surgeProbability: 0.38
  }
];

function BedForecastsView({ forecasts = [] }) {
  const displayForecasts = (Array.isArray(forecasts) && forecasts.length > 0) ? forecasts : DEFAULT_BED_FORECASTS;

  return (
    <div className="flex flex-col gap-3">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-blue-600 shrink-0" />
        <span>Predictive AI capacity modeling trained on historical surge and patient admission telemetry.</span>
      </div>

      {displayForecasts.map((fc, idx) => {
        const riskTone = fc.riskLevel === "critical"
          ? "bg-rose-100 text-rose-700 border-rose-300"
          : fc.riskLevel === "high"
          ? "bg-amber-100 text-amber-700 border-amber-300"
          : "bg-emerald-100 text-emerald-700 border-emerald-300";

        return (
          <div
            key={fc.id || idx}
            className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-xl flex flex-col gap-2.5 hover:border-blue-300 transition-all shadow-2xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{fc.hospitalName || "Hospital"}</h4>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Forecast for {fc.predictedForDate || "Tomorrow"} · {fc.modelVersion}
                </p>
              </div>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${riskTone}`}>
                {fc.riskLevel} Surge Risk
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center">
              <Metric label="General Beds" value={fc.predictedBeds} tone="text-blue-700" />
              <Metric label="ICU Needed" value={fc.predictedICUBeds} tone="text-purple-700" />
              <Metric label="Emergency" value={fc.predictedEmergencyBeds} tone="text-rose-700" />
            </div>

            <div className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200">
              <div className="flex items-center gap-1 text-slate-600">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">Capacity Strain:</span>
                <span className="font-bold font-mono text-amber-600">{fc.capacityStrainPct}%</span>
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">Confidence:</span>
                <span className="font-bold font-mono text-emerald-600">{Math.round((fc.confidence || 0.9) * 100)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DEFAULT_RECOMMENDATIONS = [
  {
    rank: 1,
    hospital_id: "HOSP-102",
    hospital_name: "Swaroop Rani Nehru Hospital (SRN)",
    distance_km: 2.0,
    distance_label: "2.0 km",
    within_range: true,
    recommendation_score: 0.97,
    match_percentage: 97.0,
    specialty_match: 1,
    total_beds: 350,
    available_beds: 62,
    number_doctor: 65,
    emergency_available: 1,
    state: "Uttar Pradesh",
    district: "Prayagraj",
    phone: "+91-532-2256011",
    coordinates: [25.4520, 81.8380]
  },
  {
    rank: 2,
    hospital_id: "HOSP-101",
    hospital_name: "Prayagraj Central Civil Hospital",
    distance_km: 0.0,
    distance_label: "0.0 km",
    within_range: true,
    recommendation_score: 0.965,
    match_percentage: 96.5,
    specialty_match: 1,
    total_beds: 250,
    available_beds: 45,
    number_doctor: 45,
    emergency_available: 1,
    state: "Uttar Pradesh",
    district: "Prayagraj",
    phone: "+91-532-2460123",
    coordinates: [25.4358, 81.8463]
  },
  {
    rank: 3,
    hospital_id: "HOSP-108",
    hospital_name: "Jeevan Jyoti Super Specialty Hospital",
    distance_km: 0.8,
    distance_label: "0.8 km",
    within_range: true,
    recommendation_score: 0.952,
    match_percentage: 95.2,
    specialty_match: 1,
    total_beds: 150,
    available_beds: 28,
    number_doctor: 30,
    emergency_available: 1,
    state: "Uttar Pradesh",
    district: "Prayagraj",
    phone: "+91-532-2466000",
    coordinates: [25.4390, 81.8530]
  },
  {
    rank: 4,
    hospital_id: "HOSP-106",
    hospital_name: "Nazareth Hospital",
    distance_km: 1.6,
    distance_label: "1.6 km",
    within_range: true,
    recommendation_score: 0.947,
    match_percentage: 94.7,
    specialty_match: 1,
    total_beds: 200,
    available_beds: 35,
    number_doctor: 38,
    emergency_available: 1,
    state: "Uttar Pradesh",
    district: "Prayagraj",
    phone: "+91-532-2407441",
    coordinates: [25.4490, 81.8390]
  },
  {
    rank: 5,
    hospital_id: "HOSP-103",
    hospital_name: "Tej Bahadur Sapru (Beli) Hospital",
    distance_km: 2.9,
    distance_label: "2.9 km",
    within_range: true,
    recommendation_score: 0.942,
    match_percentage: 94.2,
    specialty_match: 1,
    total_beds: 180,
    available_beds: 38,
    number_doctor: 32,
    emergency_available: 1,
    state: "Uttar Pradesh",
    district: "Prayagraj",
    phone: "+91-532-2420088",
    coordinates: [25.4610, 81.8540]
  }
];

function RecommendationTriageView({
  condition,
  setCondition,
  specialty,
  setSpecialty,
  onSubmitRecommendation,
  isLoading,
  recommendations = [],
  originLabel
}) {
  const results = (Array.isArray(recommendations) && recommendations.length > 0)
    ? recommendations
    : DEFAULT_RECOMMENDATIONS;

  useEffect(() => {
    if (onSubmitRecommendation) {
      onSubmitRecommendation(condition || "Heart Attack");
    }
  }, [condition, specialty]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmitRecommendation) {
      onSubmitRecommendation(condition);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Interactive AI Triage & Recommendation Form */}
      <form onSubmit={handleSubmit} className="bg-gradient-to-br from-emerald-950/5 via-teal-900/5 to-slate-100/60 border border-emerald-300/80 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
            <Hospital className="w-4 h-4 text-emerald-600" />
            AI Hospital Recommendation & Triage
          </h3>
          <span className="text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
            XGBoost v1.2
          </span>
        </div>

        {/* Condition Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Patient Condition / Emergency Case
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g. Heart Attack, Appendicitis, Stroke, Trauma..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Quick Select Suggestion Chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {POPULAR_CONDITIONS.map((cond) => (
              <button
                key={cond}
                type="button"
                onClick={() => {
                  setCondition(cond);
                  if (onSubmitRecommendation) {
                    onSubmitRecommendation(cond);
                  }
                }}
                className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  condition.toLowerCase() === cond.toLowerCase()
                    ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                    : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
                }`}
              >
                {cond}
              </button>
            ))}
          </div>
        </div>

        {/* Specialty Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Required Specialty (Optional)
          </label>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {SPECIALTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* PROMINENT SUBMIT BUTTON */}
        <button
          type="submit"
          id="btn-run-ml-recommendation"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-75"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Computing Hospital Match Scores...
            </>
          ) : (
            <>
              <Hospital className="w-4 h-4" />
              Find Recommended Hospitals
            </>
          )}
        </button>
      </form>

      {/* Ranked ML Results List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            Ranked Recommendations ({results.length})
          </h4>
          <span className="text-[11px] text-slate-400">
            {originLabel ? `Near ${originLabel}` : ""}
          </span>
        </div>

        {results.length === 0 ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            {isLoading ? "Running XGBoost recommendation model on hospital dataset..." : "No recommendations computed yet. Click Find Recommended Hospitals."}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(() => {
              const inRange = results.filter((item) => item.within_range !== false);
              const outRange = results.filter((item) => item.within_range === false);

              const renderCard = (item, index, isExtended = false) => {
                const rank = item.rank || index + 1;
                const matchPct = item.match_percentage ?? (item.recommendation_score ? Math.round(item.recommendation_score * 100) : 85);
                const hospitalName = item.hospital_name || item.name || "Hospital";
                const distance = item.distance_label || item.distance || (item.distance_km ? `${item.distance_km} km` : "Nearby");
                const phone = item.phone || item.contact || "+91-532-2460123";
                const coords = Array.isArray(item.coordinates) && item.coordinates.length >= 2
                  ? item.coordinates
                  : (item.latitude && item.longitude ? [item.latitude, item.longitude] : [25.4358, 81.8463]);

                const rankBadgeStyle = rank === 1 && !isExtended
                  ? "bg-emerald-600 text-white"
                  : rank === 2 && !isExtended
                  ? "bg-teal-600 text-white"
                  : isExtended
                  ? "bg-slate-500 text-white"
                  : "bg-slate-700 text-white";

                const matchBadgeStyle = matchPct >= 80
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : matchPct >= 60
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200";

                return (
                  <div
                    key={item.hospital_id || item.id || index}
                    className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col gap-2.5 ${
                      rank === 1 && !isExtended
                        ? "bg-gradient-to-b from-emerald-50/70 to-white border-emerald-300 ring-1 ring-emerald-400/30"
                        : isExtended
                        ? "bg-slate-50/70 border-dashed border-slate-300"
                        : "bg-white border-slate-200/90 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-lg shadow-2xs shrink-0 ${rankBadgeStyle}`}>
                          #{rank}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-slate-900 leading-snug">{hospitalName}</h4>
                            {isExtended && (
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-md font-semibold">
                                Regional Option
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {distance} away · {item.district || "Prayagraj"}
                          </p>
                        </div>
                      </div>

                      <div className={`px-2.5 py-1 rounded-xl border text-xs font-extrabold flex items-center gap-1 ${matchBadgeStyle}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {matchPct}% Match
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <Metric label="Avail Beds" value={item.available_beds ?? item.availableBeds ?? 15} tone="text-emerald-700" />
                      <Metric label="Total Beds" value={item.total_beds ?? item.totalBeds ?? 100} />
                      <Metric label="Doctors" value={item.number_doctor ?? 18} tone="text-blue-700" />
                    </div>

                    {/* Capabilities & Emergency */}
                    <div className="flex items-center justify-between text-xs px-2.5 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60">
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        {(item.emergency_available ?? item.emergencyDepartment) ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Emergency Ready
                          </span>
                        ) : (
                          <span className="text-slate-400">Emergency not listed</span>
                        )}
                      </span>

                      {item.specialty_match !== undefined && (
                        <span className="text-[11px] text-slate-500">
                          {item.specialty_match ? (
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                              <Check className="w-3 h-3 text-emerald-600" /> Specialty Matched
                            </span>
                          ) : (
                            "General Match"
                          )}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={`tel:${phone}`}
                        className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Call Desk
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Navigation className="w-3.5 h-3.5" /> GPS Directions
                      </a>
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {inRange.map((item, idx) => renderCard(item, idx, false))}

                  {outRange.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2.5">
                      <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-600 flex flex-col gap-0.5">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-blue-600" /> Extended Regional Options (Outside Radius)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Fewer than 10 facilities found in immediate radius. Showing top-ranked regional emergency centers.
                        </p>
                      </div>
                      {outRange.map((item, idx) => renderCard(item, inRange.length + idx, true))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

function ResourceTransfersView({
  records = [],
  hospitals = [],
  medicineCatalog = [],
  activeStaff,
  onOpenStaffPortal,
  onRefresh
}) {
  const [subTab, setSubTab] = useState("auto"); // "auto", "queue", "manual"
  const [targetHospitalId, setTargetHospitalId] = useState("");
  const [selectedMedicineId, setSelectedMedicineId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState(50);
  const [sourceHospitalId, setSourceHospitalId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferList, setTransferList] = useState(Array.isArray(records) ? records : []);
  const [statusMessage, setStatusMessage] = useState("");
  const [matchedSupplierInfo, setMatchedSupplierInfo] = useState(null);

  const isAuthorized = Boolean(
    activeStaff && ["SUPER_ADMIN", "HOSPITAL_ADMIN", "INVENTORY_STAFF"].includes(activeStaff.role)
  );

  const loadTransfers = async () => {
    try {
      const data = await api.transfers();
      if (Array.isArray(data)) {
        setTransferList(data);
      }
    } catch {
      // Keep existing list
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const handleAutoRequest = async (e) => {
    e.preventDefault();
    if (!targetHospitalId || !selectedMedicineId) {
      setStatusMessage("Please select a target hospital and a medicine in deficit.");
      return;
    }
    setIsSubmitting(true);
    setStatusMessage("");
    setMatchedSupplierInfo(null);
    try {
      const res = await api.autoRecommendTransfer({
        toHospital: targetHospitalId,
        medicine: selectedMedicineId,
        quantity: Number(transferQuantity)
      });
      setStatusMessage(res?.message || "Auto-transfer recommendation requested successfully!");
      if (res?.matchedSupplier) {
        setMatchedSupplierInfo(res.matchedSupplier);
      }
      await loadTransfers();
      if (onRefresh) onRefresh();
    } catch (err) {
      setStatusMessage(err.message || "Failed to auto-match surplus hospital.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualRequest = async (e) => {
    e.preventDefault();
    if (!sourceHospitalId || !targetHospitalId || !selectedMedicineId) {
      setStatusMessage("Please select source hospital, target hospital, and medicine.");
      return;
    }
    setIsSubmitting(true);
    setStatusMessage("");
    try {
      await api.createTransfer({
        fromHospital: sourceHospitalId,
        toHospital: targetHospitalId,
        medicine: selectedMedicineId,
        quantity: Number(transferQuantity)
      });
      setStatusMessage("Transfer recommendation submitted successfully.");
      await loadTransfers();
      if (onRefresh) onRefresh();
    } catch (err) {
      setStatusMessage(err.message || "Failed to create transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.approveTransfer(id);
      await loadTransfers();
      setStatusMessage("Transfer approved successfully.");
    } catch (err) {
      setStatusMessage(err.message || "Failed to approve transfer.");
    }
  };

  const handleReject = async (id) => {
    try {
      await api.rejectTransfer(id);
      await loadTransfers();
      setStatusMessage("Transfer marked as rejected.");
    } catch (err) {
      setStatusMessage(err.message || "Failed to reject transfer.");
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.completeTransfer(id);
      await loadTransfers();
      setStatusMessage("Transfer completed and inventory updated live.");
    } catch (err) {
      setStatusMessage(err.message || "Failed to complete transfer.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Admin Authorization Notice if public viewer */}
      {!isAuthorized && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl flex flex-col gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Admin & Inventory Staff Exclusive Operations</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Automated inter-hospital medicine allocation, surplus dispatching, and transfer approvals require verified Admin or Inventory credentials.
          </p>
          <button
            onClick={onOpenStaffPortal}
            className="self-start py-2 px-3.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Login to Admin / Inventory Portal
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => setSubTab("auto")}
          className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === "auto" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Zap className="w-3.5 h-3.5" /> Auto-Surplus Match
        </button>
        <button
          onClick={() => setSubTab("queue")}
          className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === "queue" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> Approvals Queue ({transferList.length})
        </button>
        <button
          onClick={() => setSubTab("manual")}
          className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            subTab === "manual" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Plus className="w-3.5 h-3.5" /> Manual Request
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-medium">
          {statusMessage}
        </div>
      )}

      {/* Subtab 1: Automated Surplus Matching */}
      {subTab === "auto" && (
        <div className="flex flex-col gap-3">
          <form onSubmit={handleAutoRequest} className="p-4 bg-gradient-to-br from-emerald-900/5 to-teal-900/5 border border-emerald-300/80 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin-slow" />
                Automated Nearby Surplus Matcher
              </h4>
              <span className="text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                AI Proximity & Surplus Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Select your hospital and the deficit medicine. The engine scans surrounding hospitals, finds verified surplus stock, and generates a transfer recommendation.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Hospital (Experiencing Shortage)
              </label>
              <select
                value={targetHospitalId}
                onChange={(e) => setTargetHospitalId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select Destination Hospital</option>
                {hospitals.map((h) => (
                  <option key={h.id || h._id} value={h.id || h._id}>
                    {h.name} · {h.district || "Prayagraj"}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Medicine Needed
                </label>
                <select
                  value={selectedMedicineId}
                  onChange={(e) => setSelectedMedicineId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select Medicine</option>
                  {medicineCatalog.map((m) => (
                    <option key={m.id || m._id} value={m.id || m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Units
                </label>
                <input
                  type="number"
                  min="1"
                  value={transferQuantity}
                  onChange={(e) => setTransferQuantity(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isAuthorized}
              className="mt-1 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Auto-Locate Nearest Surplus & Create Transfer Request
            </button>
          </form>

          {/* Matched Supplier Card preview if available */}
          {matchedSupplierInfo && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs flex flex-col gap-1.5 shadow-2xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Surplus Match Found: {matchedSupplierInfo.name}
              </span>
              <p className="text-slate-600">
                Distance: <span className="font-bold">{matchedSupplierInfo.distanceKm} km</span> · Available Surplus: <span className="font-bold font-mono text-emerald-700">{matchedSupplierInfo.surplusUnits} units</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Approvals & Pipeline Queue */}
      {subTab === "queue" && (
        <div className="flex flex-col gap-3">
          {transferList.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
              No active transfer requests in the queue.
            </div>
          ) : (
            transferList.map((tr) => {
              const statusTone = tr.status === "APPROVED"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : tr.status === "COMPLETED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : tr.status === "REJECTED"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-amber-50 text-amber-700 border-amber-200";

              const sourceName = tr.fromHospital?.name || "Source Hospital";
              const destName = tr.toHospital?.name || "Destination Hospital";
              const medName = tr.medicine?.name || "Medicine";

              return (
                <div
                  key={tr._id || tr.id}
                  className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-slate-900">
                        <span>{sourceName}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-emerald-700">{destName}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {medName} · {tr.quantity} units
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${statusTone}`}>
                      {tr.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Requested Qty</span>
                      <span className="font-bold text-slate-800">{tr.quantity} units</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">Status</span>
                      <span className="font-bold text-slate-800">{tr.status}</span>
                    </div>
                  </div>

                  {/* Admin Approval Actions */}
                  {isAuthorized && tr.status === "RECOMMENDED" && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(tr._id || tr.id)}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Transfer
                      </button>
                      <button
                        onClick={() => handleReject(tr._id || tr.id)}
                        className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  )}

                  {isAuthorized && tr.status === "APPROVED" && (
                    <button
                      onClick={() => handleComplete(tr._id || tr.id)}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <Truck className="w-3.5 h-3.5" /> Mark Completed & Sync Stock
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Subtab 3: Manual Transfer Request */}
      {subTab === "manual" && (
        <form onSubmit={handleManualRequest} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col gap-3">
          <h4 className="font-bold text-xs sm:text-sm text-slate-900">Manual Transfer Dispatch Request</h4>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Source Hospital (Supplier)</label>
            <select
              value={sourceHospitalId}
              onChange={(e) => setSourceHospitalId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              required
            >
              <option value="">Select Supplier Hospital</option>
              {hospitals.map((h) => (
                <option key={h.id || h._id} value={h.id || h._id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Hospital (Recipient)</label>
            <select
              value={targetHospitalId}
              onChange={(e) => setTargetHospitalId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              required
            >
              <option value="">Select Recipient Hospital</option>
              {hospitals.map((h) => (
                <option key={h.id || h._id} value={h.id || h._id}>{h.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medicine</label>
              <select
                value={selectedMedicineId}
                onChange={(e) => setSelectedMedicineId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                required
              >
                <option value="">Select Medicine</option>
                {medicineCatalog.map((m) => (
                  <option key={m.id || m._id} value={m.id || m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isAuthorized}
            className="mt-1 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Transfer Request"}
          </button>
        </form>
      )}
    </div>
  );
}

function MedicineInventoryView({ records, medicineCatalog }) {
  const [medicineId, setMedicineId] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const filteredRecords = records.filter((record) => {
    return (!medicineId || record.medicineId === medicineId) && (!hospitalName || record.hospitalName === hospitalName);
  });
  const hospitals = [...new Set(records.map((record) => record.hospitalName))];

  return (
    <>
      <div className="grid grid-cols-1 gap-2 mb-3">
        <label className="text-xs font-semibold text-slate-600">Choose Medicine
          <select
            value={medicineId}
            onChange={(event) => { setMedicineId(event.target.value); setHospitalName(""); }}
            className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Medicines</option>
            {medicineCatalog.map((medicine) => (
              <option key={medicine.id} value={medicine.id}>{medicine.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">Or Choose Hospital
          <select
            value={hospitalName}
            onChange={(event) => { setHospitalName(event.target.value); setMedicineId(""); }}
            className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs bg-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Hospitals</option>
            {hospitals.map((hospital) => (
              <option key={hospital} value={hospital}>{hospital}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3">
        {filteredRecords.length === 0 && (
          <p className="text-xs text-slate-500">No medicine stock in range matches this filter.</p>
        )}
        {filteredRecords.map((record) => (
          <div key={record.id} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl">
            <div className="flex justify-between gap-2">
              <h4 className="font-bold text-sm text-slate-800">{record.medicineName}</h4>
              <span className="text-xs text-slate-500">{record.hospitalName}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Metric label="Stock" value={record.quantity} tone={record.quantity <= record.minimumStock ? "text-rose-600" : "text-emerald-600"} />
              <Metric label="Minimum" value={record.minimumStock} />
              <Metric label="Expiry" value={record.expiryDate} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function RecordDetails({ activeTab, record }) {
  if (activeTab === "blood") {
    const stock = Object.entries(record.bloodStock || {});
    const totalUnits = stock.reduce((total, [, units]) => total + units, 0);
    return (
      <div className="grid grid-cols-2 gap-2 text-center">
        <Metric label="Total units" value={totalUnits} tone="text-rose-600" />
        <Metric label="Blood groups" value={stock.length} />
        {stock.map(([group, units]) => <Metric key={group} label={group} value={`${units} units`} />)}
      </div>
    );
  }

  if (activeTab === "beds") {
    return (
      <>
        <div className="grid grid-cols-3 gap-1.5 py-1 text-center">
          <Metric label="General Free" value={record.availableBeds} tone="text-emerald-600" />
          <Metric label="ICU Free" value={record.icuAvailable} tone="text-purple-600" />
          <Metric label="Oxygen Beds" value={record.oxygenBeds} tone="text-amber-600" />
        </div>
        <p className="text-xs text-slate-500">General capacity: {record.availableBeds} free of {record.totalBeds} beds</p>
      </>
    );
  }

  const fields = {
    resources: [["Type", RESOURCE_LABELS[record.resourceType] || record.resourceType], ["Available", `${record.available ?? 0}/${record.total ?? 0}`]],
    transfers: [["Route", `${record.fromHospital?.name || "Unknown"} -> ${record.toHospital?.name || "Unknown"}`], ["Medicine", record.medicine?.name || "Medicine"], ["Quantity", record.quantity], ["Status", record.status]],
    donors: [["Blood group", record.bloodGroup], ["Status", record.status], ["Distance", record.distance], ["Details", record.medicalDetails]],
    organs: [["Organ", record.organType], ["Blood group", record.bloodGroup], ["Compatibility", `${record.compatibilityScore}%`], ["Status", record.status]],
    authority: [["Hospitals", record.totalHospitals], ["Low resources", record.lowResourceHospitals], ["Low medicine stock", record.lowMedicineStock], ["Pending transfers", record.pendingTransfers], ["Critical predictions", record.criticalBedPredictions]]
  }[activeTab] || [];

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      {fields.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
    </div>
  );
}

export default function HospitalDrawer({
  activeTab,
  onBack,
  records = [],
  medicineCatalog = [],
  rangeLabel,
  hospitals = [],
  activeStaff = null,
  onOpenStaffPortal,
  onRefresh,
  // ML Props
  mlCondition = "",
  setMlCondition,
  mlSpecialty = "",
  setMlSpecialty,
  onRunRecommendation,
  isMlLoading = false,
  mlRecommendations = [],
  outbreakData = null,
  bedForecasts = []
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 h-full flex flex-col shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {TITLES[activeTab] || activeTab} view
        </span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {/* ML Recommendation & Triage Tab */}
        {(activeTab === "nearest" || activeTab === "recommend" || activeTab === "sos") && (
          <RecommendationTriageView
            condition={mlCondition}
            setCondition={setMlCondition}
            specialty={mlSpecialty}
            setSpecialty={setMlSpecialty}
            onSubmitRecommendation={onRunRecommendation}
            isLoading={isMlLoading}
            recommendations={mlRecommendations}
            originLabel={rangeLabel}
          />
        )}

        {/* ML Outbreak Surveillance Tab */}
        {activeTab === "outbreak" && (
          <OutbreakSurveillanceView
            outbreakData={outbreakData}
            onSelectConditionForRecommendation={(cond) => {
              if (setMlCondition) setMlCondition(cond);
              if (onRunRecommendation) onRunRecommendation(cond);
            }}
          />
        )}

        {/* ML Bed Demand Predictions Tab */}
        {activeTab === "predictions" && (
          <BedForecastsView forecasts={bedForecasts} />
        )}

        {/* Medicine Inventory Tab */}
        {activeTab === "medicines" && (
          <MedicineInventoryView records={Array.isArray(records) ? records : []} medicineCatalog={medicineCatalog} />
        )}

        {/* Resource Transfers Tab (Admin & Inventory Exclusive) */}
        {activeTab === "transfers" && (
          <ResourceTransfersView
            records={Array.isArray(records) ? records : []}
            hospitals={hospitals}
            medicineCatalog={medicineCatalog}
            activeStaff={activeStaff}
            onOpenStaffPortal={onOpenStaffPortal}
            onRefresh={onRefresh}
          />
        )}

        {/* Generic Views (beds, blood, resources, donors, organs, authority) */}
        {!["nearest", "recommend", "sos", "outbreak", "predictions", "medicines", "transfers"].includes(activeTab) && (
          <>
            {(Array.isArray(records) ? records : []).length === 0 && (
              <p className="text-xs text-slate-500">
                Nothing in range for this view{rangeLabel ? ` within ${rangeLabel}` : ""}. Drop a pin closer to a hospital or widen the radius.
              </p>
            )}
            {(Array.isArray(records) ? records : []).map((record) => {
              const hospital = record.name || record.hospitalName || record.recipientHospital || "System record";
              const title = activeTab === "resources"
                ? `${RESOURCE_LABELS[record.resourceType] || record.resourceType} · ${hospital}`
                : hospital;
              return (
                <div
                  key={record.id || record._id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col gap-2 hover:bg-white hover:border-emerald-300 transition-all shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-800">{title}</h4>
                    <span className="text-xs text-slate-500 font-mono">
                      {record.distance || record.riskLevel || record.status || "Live"}
                    </span>
                  </div>
                  <RecordDetails activeTab={activeTab} record={record} />

                  {["beds", "blood"].includes(activeTab) && (
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={`tel:${record.phone}`}
                        className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <PhoneCall className="w-3 h-3" /> Call
                      </a>
                      <button className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer">
                        <Navigation className="w-3 h-3" /> Directions
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}