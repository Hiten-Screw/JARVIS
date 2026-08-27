import { AlertTriangle, Bed, Brain, Droplet, FlaskConical, HeartPulse, MapPin, Pill, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";

const FEATURES = [
  ["beds", "Live Bed & ICU Capacity", "Track general, ICU, emergency, ventilator, and oxygen availability.", Bed, "Live Status", "emerald"],
  ["blood", "Emergency Blood Bank", "Locate verified donors and blood units sorted by nearest storage.", Droplet, "Units Stocked", "rose"],
  ["nearest", "Nearest & Best Rated", "Rank hospitals by travel time, emergency equipment, and specialties.", MapPin, "Fastest ETA", "emerald"],
  ["outbreak", "Outbreak Surveillance", "Monitor demand signals and high-risk bed prediction alerts.", AlertTriangle, "Surveillance", "amber"],
  ["resources", "Hospital Resources", "Review every tracked resource and its current availability.", ShieldCheck, "Live Inventory", "cyan"],
  ["medicines", "Medicine Inventory", "Check stock, minimum levels, expiry dates, and medicine categories.", Pill, "Stock Watch", "violet"],
  ["predictions", "Bed Demand Forecast", "Predict future general, ICU, and emergency bed demand.", TrendingUp, "ML Forecast", "blue"],
  ["transfers", "Resource Transfers", "Track recommended, approved, rejected, and completed medicine transfers.", RefreshCw, "Coordination", "orange"],
  ["donors", "Blood Donor Network", "Browse donor eligibility, blood groups, status, and proximity.", HeartPulse, "Verified Network", "rose"],
  ["organs", "Organ Match Registry", "Review organ availability, compatibility scores, and match status.", FlaskConical, "Match Review", "teal"],
  ["authority", "Authority Dashboard", "See system-wide hospital, stock, transfer, and critical-risk totals.", Brain, "Command View", "slate"]
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full content-start">
      {FEATURES.map(([id, title, description, Icon, badge, color]) => (
        <button key={id} onClick={() => onSelectCategory(id)} className="healthgrid-card cursor-pointer text-left flex flex-col justify-between gap-4 group">
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-xl group-hover:text-white transition-colors ${COLOR_CLASSES[color]}`}><Icon className="w-5 h-5" /></div>
            <span className="badge-mint">{badge}</span>
          </div>
          <div><h3 className="font-bold text-sm text-slate-800 mb-1">{title}</h3><p className="text-xs text-slate-500 leading-relaxed">{description}</p></div>
        </button>
      ))}
    </div>
  );
}