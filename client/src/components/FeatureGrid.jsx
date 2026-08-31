import { AlertTriangle, Bed, Brain, Droplet, FlaskConical, HeartPulse, MapPin, Pill, RefreshCw, ShieldCheck, TrendingUp, Hospital } from "lucide-react";

const FEATURES = [
  ["nearest", "AI Hospital Recommendation", "XGBoost recommendation engine ranking nearest emergency hospitals by condition and specialty.", Hospital, "ML Engine", "emerald"],
  ["outbreak", "Outbreak Surveillance", "Real-time epidemic strain monitoring and disease case concentration alerts.", AlertTriangle, "Surveillance AI", "amber"],
  ["predictions", "Bed Demand Forecast", "Predict future general, ICU, and emergency bed surge risk with confidence scores.", TrendingUp, "XGBoost Forecast", "blue"],
  ["beds", "Live Bed & ICU Capacity", "Track general, ICU, emergency, ventilator, and oxygen availability in real-time.", Bed, "Live Status", "emerald"],
  ["blood", "Emergency Blood Bank", "Locate verified donors and blood units sorted by nearest storage.", Droplet, "Units Stocked", "rose"],
  ["resources", "Hospital Resources", "Review every tracked resource and its current clinical availability.", ShieldCheck, "Live Inventory", "cyan"],
  ["medicines", "Medicine Inventory", "Check stock, minimum levels, expiry dates, and medicine categories.", Pill, "Stock Watch", "violet"],
  ["transfers", "Resource Transfers", "Automated nearby surplus discovery & inter-hospital medicine allocation queue.", RefreshCw, "Admin & Inventory", "orange"],
  /*
  ["donors", "Blood Donor Network", "Browse donor eligibility, blood groups, status, and proximity.", HeartPulse, "Verified Network", "rose"],
  ["organs", "Organ Match Registry", "Review organ availability, compatibility scores, and match status.", FlaskConical, "Match Review", "teal"],
  ["authority", "Authority Dashboard", "System-wide hospital, stock, transfer, and critical-risk analytics.", Brain, "Command View", "slate"]
  */
];

const COLOR_CLASSES = {
  emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600",
  rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-600",
  amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-600",
  cyan: "bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600",
  violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-600",
  blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600",
  orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-600",
  teal: "bg-teal-50 text-teal-600 group-hover:bg-teal-600",
  slate: "bg-slate-100 text-slate-600 group-hover:bg-slate-600"
};

export default function FeatureGrid({ onSelectCategory }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 h-full content-start">
      {FEATURES.map(([id, title, description, Icon, badge, color]) => (
        <button
          key={id}
          onClick={() => onSelectCategory(id)}
          className="bg-white border border-slate-200/90 hover:border-emerald-400 p-4 rounded-2xl cursor-pointer text-left flex flex-col justify-between gap-3 group transition-all duration-200 hover:shadow-md active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-xl group-hover:text-white transition-colors ${COLOR_CLASSES[color]}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
              {badge}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">
              {title}
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {description}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}