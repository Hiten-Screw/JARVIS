import { useState } from "react";
import { ArrowLeft, Navigation, PhoneCall } from "lucide-react";

const TITLES = {
  beds: "Bed capacity",
  blood: "Blood availability",
  nearest: "Nearby hospitals",
  outbreak: "Risk signals",
  resources: "Resource inventory",
  medicines: "Medicine catalog",
  predictions: "Bed demand forecast",
  transfers: "Transfer queue",
  donors: "Donor network",
  organs: "Organ matches",
  authority: "Authority summary"
};

function RecordDetails({ activeTab, record }) {
  if (activeTab === "blood") {
    const stock = Object.entries(record.bloodStock || {});
    const totalUnits = stock.reduce((total, [, units]) => total + units, 0);
    return <div className="grid grid-cols-2 gap-2 text-center">
      <Metric label="Total units" value={totalUnits} tone="text-rose-600" />
      <Metric label="Blood groups" value={stock.length} />
      {stock.map(([group, units]) => <Metric key={group} label={group} value={`${units} units`} />)}
    </div>;
  }

  if (activeTab === "beds") {
    return <>
      <div className="grid grid-cols-3 gap-1.5 py-1 text-center">
        <Metric label="General free" value={record.availableBeds} tone="text-emerald-600" />
        <Metric label="ICU free" value={record.icuAvailable} />
        <Metric label="Oxygen beds" value={record.oxygenBeds} tone="text-amber-600" />
      </div>
      <p className="text-xs text-slate-500">General capacity: {record.availableBeds} free of {record.totalBeds} beds</p>
    </>;
  }

  if (activeTab === "nearest") {
    return <div className="grid grid-cols-2 gap-2 text-xs"><Metric label="Distance" value={record.distance} /><Metric label="Emergency" value={record.emergencyDepartment ? "Available" : "Not listed"} /></div>;
  }

  const fields = {
    outbreak: [["Disease", "Not modeled in schema"], ["Date", record.predictedForDate], ["Bed demand", record.predictedBeds], ["Risk", record.riskLevel]],
    resources: [["Type", record.resourceType], ["Available", `${record.available}/${record.total}`]],
    predictions: [["General beds", record.predictedBeds], ["ICU beds", record.predictedICUBeds], ["Emergency beds", record.predictedEmergencyBeds], ["For date", record.predictedForDate], ["Confidence", `${Math.round(record.confidence * 100)}%`], ["Model", record.modelVersion]],
    transfers: [["Route", `${record.fromHospital?.name || "Unknown source"} -> ${record.toHospital?.name || "Unknown destination"}`], ["Medicine", record.medicine?.name || "Unknown medicine"], ["Quantity", record.quantity], ["Status", record.status]],
    donors: [["Blood group", record.bloodGroup], ["Status", record.status], ["Distance", record.distance], ["Details", record.medicalDetails]],
    organs: [["Organ", record.organType], ["Blood group", record.bloodGroup], ["Compatibility", `${record.compatibilityScore}%`], ["Status", record.status]],
    authority: [["Hospitals", record.totalHospitals], ["Low resources", record.lowResourceHospitals], ["Low medicine stock", record.lowMedicineStock], ["Pending transfers", record.pendingTransfers], ["Critical predictions", record.criticalBedPredictions]]
  }[activeTab] || [];

  return <div className="grid grid-cols-2 gap-2 text-xs">{fields.map(([label, value]) => <Metric key={label} label={label} value={value} />)}</div>;
}

function Metric({ label, value, tone = "text-slate-700" }) {
  return <div className="bg-white p-1.5 rounded-lg border border-slate-200/70"><span className="block text-[10px] text-slate-400 uppercase">{label}</span><span className={`font-bold text-xs ${tone}`}>{value}</span></div>;
}

function MedicineInventoryView({ records, medicineCatalog }) {
  const [medicineId, setMedicineId] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const filteredRecords = records.filter((record) => {
    return (!medicineId || record.medicineId === medicineId) && (!hospitalName || record.hospitalName === hospitalName);
  });
  const hospitals = [...new Set(records.map((record) => record.hospitalName))];

  return <>
    <div className="grid grid-cols-1 gap-2 mb-3">
      <label className="text-xs font-semibold text-slate-600">Choose medicine
        <select value={medicineId} onChange={(event) => { setMedicineId(event.target.value); setHospitalName(""); }} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs bg-white">
          <option value="">All medicines</option>
          {medicineCatalog.map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.name}</option>)}
        </select>
      </label>
      <label className="text-xs font-semibold text-slate-600">Or choose hospital
        <select value={hospitalName} onChange={(event) => { setHospitalName(event.target.value); setMedicineId(""); }} className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs bg-white">
          <option value="">All hospitals</option>
          {hospitals.map((hospital) => <option key={hospital} value={hospital}>{hospital}</option>)}
        </select>
      </label>
    </div>
    <div className="flex flex-col gap-3">{filteredRecords.map((record) => <div key={record.id} className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl"><div className="flex justify-between gap-2"><h4 className="font-bold text-sm text-slate-800">{record.medicineName}</h4><span className="text-xs text-slate-500">{record.hospitalName}</span></div><div className="grid grid-cols-3 gap-2 mt-2"><Metric label="Stock" value={record.quantity} tone={record.quantity <= record.minimumStock ? "text-rose-600" : "text-emerald-600"} /><Metric label="Minimum" value={record.minimumStock} /><Metric label="Expiry" value={record.expiryDate} /></div></div>)}</div>
  </>;
}

export default function HospitalDrawer({ activeTab, onBack, records = [], medicineCatalog = [] }) {
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
          {TITLES[activeTab] || activeTab} view
        </span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {activeTab === "medicines" && <MedicineInventoryView records={Array.isArray(records) ? records : []} medicineCatalog={medicineCatalog} />}
        {activeTab !== "medicines" && (Array.isArray(records) ? records : []).map((record) => {
          const hospital = record.name || record.hospitalName || record.recipientHospital || "System record";
          return (
          <div
            key={record.id || record._id}
            className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl flex flex-col gap-2 hover:bg-white hover:border-emerald-300 transition-all shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">{hospital}</h4>
              <span className="text-xs text-slate-500 font-mono">{record.distance || record.riskLevel || record.status || "Live"}</span>
            </div>
            <RecordDetails activeTab={activeTab} record={record} />

            {["beds", "blood", "nearest"].includes(activeTab) && <div className="flex items-center gap-2 mt-1">
              <a
                href={`tel:${record.phone}`}
                className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
              >
                <PhoneCall className="w-3 h-3" /> Call
              </a>
              <button className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer">
                <Navigation className="w-3 h-3" /> Directions
              </button>
            </div>}
          </div>
          );
        })}
      </div>
    </div>
  );
}