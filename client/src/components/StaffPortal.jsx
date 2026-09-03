import { useEffect, useState } from "react";
import { ClipboardList, Hospital, Package, Plus, ShieldCheck, Trash2, Users, Check, X, ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "../services/api";

const ROLE_LABELS = {
  SUPER_ADMIN: "Super admin",
  HOSPITAL_ADMIN: "Hospital admin",
  INVENTORY_STAFF: "Inventory staff",
  NURSE: "Nurse",
  DOCTOR: "Doctor"
};

function Status({ children, tone = "emerald" }) {
  const tones = { emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700" };
  return <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${tones[tone] || tones.emerald}`}>{children}</span>;
}

function PortalHeader({ title, description, icon: Icon }) {
  return <div className="flex items-start gap-3 border-b border-slate-200 pb-5 mb-5"><div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><Icon className="w-5 h-5" /></div><div><h1 className="text-xl font-bold text-slate-900">{title}</h1><p className="text-xs text-slate-500 mt-1">{description}</p></div></div>;
}

function SuperAdminPortal() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState("");
  const load = async () => { try { setRequests(await api.registrationRequests()); } catch (error) { setMessage(error.message); } };
  useEffect(() => { load(); }, []);
  const review = async (id, approved) => { try { if (approved) await api.approveRegistration(id); else await api.rejectRegistration(id); await load(); } catch (error) { setMessage(error.message); } };
  return <><PortalHeader icon={ShieldCheck} title="Super admin control" description="Review hospital registration requests before creating the hospital and its first admin account." />{message && <p className="mb-3 text-xs text-rose-700">{message}</p>}{requests.length === 0 ? <div className="border border-slate-200 rounded-xl bg-white p-5 text-sm text-slate-500">No hospital registration requests.</div> : <div className="flex flex-col gap-3">{requests.map((request) => <div key={request._id} className="border border-slate-200 rounded-xl p-4 bg-white"><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-sm text-slate-800">{request.name}</h2><p className="text-xs text-slate-500 mt-1">{request.hospitalId} · {request.address} · {request.contact}</p></div><Status tone={request.status === "PENDING" ? "amber" : request.status === "REJECTED" ? "rose" : "emerald"}>{request.status}</Status></div><div className="mt-3 text-xs text-slate-600">Initial admin: <span className="font-mono font-semibold">{request.adminUserId}</span></div>{request.status === "PENDING" && <div className="flex gap-2 mt-3"><button onClick={() => review(request._id, true)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Approve</button><button onClick={() => review(request._id, false)} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1"><X className="w-3.5 h-3.5" /> Reject</button></div>}</div>)}</div>}</>;
}

function HospitalAdminPortal({ session }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ userId: "", password: "", role: "NURSE" });
  const [message, setMessage] = useState("");
  const loadStaff = async () => { try { setStaff(await api.staff()); } catch (error) { setMessage(error.message); } };

  useEffect(() => { loadStaff(); }, []);
  const addStaff = async (event) => { event.preventDefault(); try { await api.createStaff(form); setForm({ userId: "", password: "", role: "NURSE" }); await loadStaff(); } catch (error) { setMessage(error.message); } };
  const removeStaff = async (id) => { try { await api.removeStaff(id); await loadStaff(); } catch (error) { setMessage(error.message); } };
  return <><PortalHeader icon={Users} title="Hospital administration" description={`Manage staff accounts assigned to ${session.hospitalId}.`} />{message && <p className="mb-3 text-xs text-rose-700">{message}</p>}<div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-5"><form onSubmit={addStaff} className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-3"><h2 className="font-bold text-sm text-slate-800">Add staff account</h2><input value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} placeholder="Staff user ID" className="border border-slate-200 rounded-lg p-2.5 text-xs" required /><input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Temporary password" type="password" className="border border-slate-200 rounded-lg p-2.5 text-xs" required /><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="border border-slate-200 rounded-lg p-2.5 text-xs"><option>NURSE</option><option>DOCTOR</option><option>INVENTORY_STAFF</option></select><button className="bg-slate-900 text-white rounded-lg p-2.5 text-xs font-semibold flex justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Create staff</button></form><div className="flex flex-col gap-2">{staff.map((member) => <div key={member._id} className="border border-slate-200 rounded-xl p-3 bg-white flex items-center justify-between"><div><p className="font-mono font-semibold text-xs text-slate-800">{member.userId}</p><p className="text-[11px] text-slate-500 mt-1">{ROLE_LABELS[member.role]} · {session.hospitalId}</p></div><button onClick={() => removeStaff(member._id)} title="Remove staff" className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button></div>)}</div></div></>;
}

function InventoryPortalCards({ session }) {
  const [view, setView] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [resources, setResources] = useState([]);
  const [blood, setBlood] = useState({ stock: [], total: 0, available: 0 });
  const [transfers, setTransfers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [medicine, setMedicine] = useState({ name: "", genericName: "", category: "", manufacturer: "", unit: "tablet" });
  const [stock, setStock] = useState({ medicineId: "", quantity: 0, minimumStock: 0, expiryDate: "", unitPrice: 0 });
  const [resource, setResource] = useState({ resourceType: "generalBed", total: 0, available: 0 });
  const [bloodForm, setBloodForm] = useState({ bloodGroup: "A+", currentStock: 0 });
  const [transferMedicineId, setTransferMedicineId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState(50);
  const [message, setMessage] = useState("");

  const loadMedicine = async () => { try { const [catalog, current] = await Promise.all([api.medicines(), api.inventory()]); setMedicines(catalog); setInventory(current); } catch (error) { setMessage(error.message); } };
  const loadResources = async () => { try { const [currentResources, currentBlood] = await Promise.all([api.resources(session.hospitalId), api.bloodStock(session.hospitalId)]); setResources(currentResources); setBlood(currentBlood); const current = currentResources.find((item) => item.resourceType === resource.resourceType); if (current) setResource({ resourceType: current.resourceType, total: current.total, available: current.available }); } catch (error) { setMessage(error.message); } };
  const loadTransfers = async () => { try { const [tList, hList, mCatalog] = await Promise.all([api.transfers(), api.hospitals(), api.medicines()]); setTransfers(Array.isArray(tList) ? tList : []); setHospitals(Array.isArray(hList) ? hList : []); setMedicines(Array.isArray(mCatalog) ? mCatalog : []); } catch (error) { setMessage(error.message); } };

  const openView = async (nextView) => {
    setView(nextView);
    if (nextView === "medicine") await loadMedicine();
    if (nextView === "resources") await loadResources();
    if (nextView === "transfers") await loadTransfers();
  };

  const addMedicine = async (event) => { event.preventDefault(); try { await api.createMedicine(medicine); setMedicine({ name: "", genericName: "", category: "", manufacturer: "", unit: "tablet" }); await loadMedicine(); } catch (error) { setMessage(error.message); } };
  const updateStock = async (event) => { event.preventDefault(); try { await api.updateInventory({ ...stock, hospitalId: session.hospitalId }); await loadMedicine(); setMessage("Medicine inventory updated."); } catch (error) { setMessage(error.message); } };
  const updateResource = async (event) => { event.preventDefault(); try { const saved = await api.updateResource(session.hospitalId, resource.resourceType, resource); setResources((current) => [...current.filter((item) => item.resourceType !== saved.resourceType), saved]); setResource({ resourceType: saved.resourceType, total: saved.total, available: saved.available }); setMessage("Resource totals updated."); } catch (error) { setMessage(error.message); } };
  const updateBlood = async (event) => { event.preventDefault(); try { await api.updateBloodStock(session.hospitalId, bloodForm); await loadResources(); setMessage("Blood group stock updated."); } catch (error) { setMessage(error.message); } };

  const handleAutoSurplusTransfer = async (e) => {
    e.preventDefault();
    if (!transferMedicineId) { setMessage("Please choose a medicine with deficit."); return; }
    try {
      const targetHospital = hospitals.find((h) => h.hospitalId === session.hospitalId || h._id === session.hospitalId) || hospitals[0];
      if (!targetHospital) throw new Error("Hospital record not found");
      const res = await api.autoRecommendTransfer({
        toHospital: targetHospital._id || targetHospital.id,
        medicine: transferMedicineId,
        quantity: Number(transferQuantity)
      });
      setMessage(res?.message || "Auto-transfer recommendation requested successfully.");
      await loadTransfers();
    } catch (error) { setMessage(error.message); }
  };

  const handleApprove = async (id) => { try { await api.approveTransfer(id); await loadTransfers(); setMessage("Transfer approved."); } catch (err) { setMessage(err.message); } };
  const handleReject = async (id) => { try { await api.rejectTransfer(id); await loadTransfers(); setMessage("Transfer rejected."); } catch (err) { setMessage(err.message); } };
  const handleComplete = async (id) => { try { await api.completeTransfer(id); await loadTransfers(); setMessage("Transfer completed & stock synced."); } catch (err) { setMessage(err.message); } };

  const selectedResource = resources.find((item) => item.resourceType === resource.resourceType);

  if (!view) return (
    <>
      <PortalHeader icon={Package} title="Inventory operations" description={`Choose an inventory area for ${session.hospitalId}.`} />
      {message && <p className="mb-3 text-xs text-rose-700">{message}</p>}
      <div className="grid sm:grid-cols-3 gap-4">
        <button onClick={() => openView("medicine")} className="text-left border border-slate-200 rounded-xl bg-white p-4 hover:border-emerald-400">
          <ClipboardList className="w-6 h-6 text-emerald-600 mb-3" />
          <h2 className="font-bold text-sm">Medicine inventory</h2>
          <p className="text-xs text-slate-500 mt-1">Register medicines, update quantities & alert levels.</p>
        </button>
        <button onClick={() => openView("resources")} className="text-left border border-slate-200 rounded-xl bg-white p-4 hover:border-emerald-400">
          <Hospital className="w-6 h-6 text-emerald-600 mb-3" />
          <h2 className="font-bold text-sm">Hospital resources</h2>
          <p className="text-xs text-slate-500 mt-1">Manage beds, oxygen, ventilators, and blood stock.</p>
        </button>
        <button onClick={() => openView("transfers")} className="text-left border border-slate-200 rounded-xl bg-white p-4 hover:border-emerald-400">
          <Package className="w-6 h-6 text-orange-600 mb-3" />
          <h2 className="font-bold text-sm">Resource transfers</h2>
          <p className="text-xs text-slate-500 mt-1">Auto-match surplus from nearby hospitals & approve transfers.</p>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button onClick={() => setView(null)} className="text-xs font-semibold text-emerald-700 mb-4 flex items-center gap-1 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to inventory areas
      </button>
      {view === "medicine" && (
        <>
          <PortalHeader icon={ClipboardList} title="Medicine inventory" description="Register a medicine or update an existing hospital stock record." />
          <div className="grid lg:grid-cols-2 gap-5">
            <form onSubmit={addMedicine} className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-3">
              <h2 className="font-bold text-sm">Register new medicine</h2>
              {[["name", "Medicine name"], ["genericName", "Generic name"], ["category", "Category"], ["manufacturer", "Manufacturer"]].map(([key, label]) => (
                <label key={key} className="text-xs font-semibold">{label}<input value={medicine[key]} onChange={(event) => setMedicine({ ...medicine, [key]: event.target.value })} className="mt-1 border border-slate-200 rounded-lg p-2.5 w-full text-xs" required /></label>
              ))}
              <select value={medicine.unit} onChange={(event) => setMedicine({ ...medicine, unit: event.target.value })} className="border border-slate-200 rounded-lg p-2.5 text-xs"><option>tablet</option><option>capsule</option><option>bottle</option><option>vial</option><option>injection</option><option>strip</option></select>
              <button className="bg-slate-900 text-white rounded-lg p-2.5 text-xs font-semibold">Add medicine</button>
            </form>
            <form onSubmit={updateStock} className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-3">
              <h2 className="font-bold text-sm">Update existing medicine</h2>
              <select value={stock.medicineId} onChange={(event) => setStock({ ...stock, medicineId: event.target.value })} className="border border-slate-200 rounded-lg p-2.5 text-xs" required><option value="">Select medicine</option>{medicines.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select>
              <label className="text-xs font-semibold">Current quantity<input type="number" min="0" value={stock.quantity} onChange={(event) => setStock({ ...stock, quantity: Number(event.target.value) })} className="mt-1 border border-slate-200 rounded-lg p-2.5 w-full text-xs" required /></label>
              <label className="text-xs font-semibold">Minimum stock alert level<input type="number" min="0" value={stock.minimumStock} onChange={(event) => setStock({ ...stock, minimumStock: Number(event.target.value) })} className="mt-1 border border-slate-200 rounded-lg p-2.5 w-full text-xs" required /></label>
              <label className="text-xs font-semibold">Unit price<input type="number" min="0" step="0.01" value={stock.unitPrice} onChange={(event) => setStock({ ...stock, unitPrice: Number(event.target.value) })} className="mt-1 border border-slate-200 rounded-lg p-2.5 w-full text-xs" /></label>
              <label className="text-xs font-semibold">Expiry date<input type="date" value={stock.expiryDate} onChange={(event) => setStock({ ...stock, expiryDate: event.target.value })} className="mt-1 border border-slate-200 rounded-lg p-2.5 w-full text-xs" required /></label>
              <button className="bg-emerald-600 text-white rounded-lg p-2.5 text-xs font-semibold">Save inventory update</button>
            </form>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {inventory.map((item) => (
              <div key={item._id} className="border border-slate-200 rounded-xl bg-white p-3 flex justify-between text-xs">
                <span className="font-semibold">{item.medicineId?.name}</span>
                <span>{item.quantity} units · price {item.unitPrice ?? "not set"} · min {item.minimumStock}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {view === "resources" && (
        <>
          <PortalHeader icon={Hospital} title="Hospital resources" description="Select a resource to see its current total and available count." />
          {message && <p className="mb-3 text-xs text-emerald-700">{message}</p>}
          <form onSubmit={updateResource} className="border border-slate-200 rounded-xl bg-white p-4 flex flex-col gap-3">
            <label className="text-xs font-semibold">Resource type
              <select value={resource.resourceType} onChange={(event) => { const next = resources.find((item) => item.resourceType === event.target.value); setResource({ resourceType: event.target.value, total: next?.total || 0, available: next?.available || 0 }); }} className="mt-1 border border-slate-200 rounded-lg p-2.5 w-full text-xs">
                <option>generalBed</option><option>icuBed</option><option>emergencyBed</option><option>ventilator</option><option>oxygen</option>
              </select>
            </label>
            <p className="text-xs text-slate-500">Current: {selectedResource ? `${selectedResource.available} available of ${selectedResource.total} total` : "No record yet (0 total, 0 available)"}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-xs font-semibold">Total<input type="number" min="0" value={resource.total} onChange={(event) => setResource({ ...resource, total: Number(event.target.value) })} className="mt-1 border border-slate-200 rounded-lg p-2.5 w-full text-xs" /></label>
              <label className="text-xs font-semibold">Available<input type="number" min="0" value={resource.available} onChange={(event) => setResource({ ...resource, available: Number(event.target.value) })} className="mt-1 border border-slate-200 rounded-lg p-2.5 w-full text-xs" /></label>
            </div>
            <button className="bg-emerald-600 text-white rounded-lg p-2.5 text-xs font-semibold">Save resource totals</button>
          </form>
          <form onSubmit={updateBlood} className="border border-slate-200 rounded-xl bg-white p-4 mt-4 flex flex-col gap-3">
            <h2 className="font-bold text-sm">Blood group stock</h2>
            <select value={bloodForm.bloodGroup} onChange={(event) => { const current = blood.stock.find((item) => item.bloodGroup === event.target.value); setBloodForm({ bloodGroup: event.target.value, currentStock: current?.currentStock || 0 }); }} className="border border-slate-200 rounded-lg p-2.5 text-xs">{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => <option key={group}>{group}</option>)}</select>
            <p className="text-xs text-slate-500">Current total and available blood units: {blood.total}</p>
            <label className="text-xs font-semibold">Current stock<input type="number" min="0" value={bloodForm.currentStock} onChange={(event) => setBloodForm({ ...bloodForm, currentStock: Number(event.target.value) })} className="mt-1 border border-slate-200 rounded-lg p-2.5 w-full text-xs" /></label>
            <button className="bg-rose-600 text-white rounded-lg p-2.5 text-xs font-semibold">Save blood stock</button>
          </form>
        </>
      )}

      {view === "transfers" && (
        <>
          <PortalHeader icon={Package} title="Resource transfers & automated surplus dispatch" description="Auto-detect surplus medicine stock from surrounding hospitals and approve inter-hospital transfers." />
          {message && <p className="mb-3 text-xs text-emerald-700">{message}</p>}
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
            <form onSubmit={handleAutoSurplusTransfer} className="border border-emerald-300 rounded-xl p-4 bg-emerald-50/40 flex flex-col gap-3">
              <h2 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" /> Auto-Request from Nearest Surplus Hospital
              </h2>
              <p className="text-xs text-slate-600">
                Auto-scans regional hospitals for verified surplus above minimum reserve levels.
              </p>
              <label className="text-xs font-semibold">Medicine in Shortage
                <select value={transferMedicineId} onChange={(e) => setTransferMedicineId(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-lg p-2 text-xs bg-white" required>
                  <option value="">Select Deficit Medicine</option>
                  {medicines.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">Requested Units
                <input type="number" min="1" value={transferQuantity} onChange={(e) => setTransferQuantity(Number(e.target.value))} className="mt-1 w-full border border-slate-200 rounded-lg p-2 text-xs bg-white" required />
              </label>
              <button className="bg-emerald-600 text-white rounded-lg p-2.5 text-xs font-semibold flex items-center justify-center gap-1">
                Auto-Match Surplus & Request Transfer
              </button>
            </form>

            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Transfer Approvals & Pipeline ({transfers.length})</h3>
              {transfers.length === 0 ? (
                <div className="border border-slate-200 rounded-xl p-4 bg-white text-xs text-slate-500">No transfer records found.</div>
              ) : (
                transfers.map((tr) => (
                  <div key={tr._id} className="border border-slate-200 rounded-xl p-3.5 bg-white flex flex-col gap-2 shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                          <span>{tr.fromHospital?.name || "Source"}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-emerald-700">{tr.toHospital?.name || "Destination"}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">{tr.medicine?.name} · {tr.quantity} units</p>
                      </div>
                      <Status tone={tr.status === "APPROVED" ? "amber" : tr.status === "COMPLETED" ? "emerald" : tr.status === "REJECTED" ? "rose" : "amber"}>{tr.status}</Status>
                    </div>
                    {tr.status === "RECOMMENDED" && (
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => handleApprove(tr._id)} className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-md">Approve</button>
                        <button onClick={() => handleReject(tr._id)} className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-md">Reject</button>
                      </div>
                    )}
                    {tr.status === "APPROVED" && (
                      <button onClick={() => handleComplete(tr._id)} className="py-1 px-3 bg-blue-600 text-white text-xs font-semibold rounded-md">Mark Completed & Sync Stock</button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
      {message && <p className="mt-3 text-xs text-emerald-700">{message}</p>}
    </>
  );
}

/* function InventoryPortalLegacy({ session }) {
  return <InventoryPortalCards session={session} />;
  const [medicines, setMedicines] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [message, setMessage] = useState("");
  const [medicine, setMedicine] = useState({ name: "", genericName: "", category: "", manufacturer: "", unit: "tablet" });
  const [stock, setStock] = useState({ medicineId: "", quantity: 0, minimumStock: 0, expiryDate: "", unitPrice: 0 });
  const [resource, setResource] = useState({ resourceType: "generalBed", total: 0, available: 0 });
  const load = async () => { try { const [catalog, current] = await Promise.all([api.medicines(), api.inventory()]); setMedicines(catalog); setInventory(current); } catch (error) { setMessage(error.message); } };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/set-state-in-effect
  const addMedicine = async (event) => { event.preventDefault(); try { const created = await api.createMedicine(medicine); setMedicines((current) => [...current, created]); setMedicine({ name: "", genericName: "", category: "", manufacturer: "", unit: "tablet" }); } catch (error) { setMessage(error.message); } };
  const updateStock = async (event) => { event.preventDefault(); try { await api.updateInventory({ ...stock, hospitalId: session.hospitalId }); await load(); } catch (error) { setMessage(error.message); } };
  const updateResource = async (event) => { event.preventDefault(); try { await api.updateResource(session.hospitalId, resource.resourceType, { total: resource.total, available: resource.available }); setMessage("Hospital resource saved to the database."); } catch (error) { setMessage(error.message); } };
  return <><PortalHeader icon={Package} title="Inventory operations" description={`Update medicine and hospital resource stock for ${session.hospitalId}.`} />{message && <p className="mb-3 text-xs text-rose-700">{message}</p>}<div className="grid lg:grid-cols-2 gap-5"><form onSubmit={addMedicine} className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-3"><h2 className="font-bold text-sm">Add medicine</h2>{[["name", "Medicine name"], ["genericName", "Generic name"], ["category", "Category"], ["manufacturer", "Manufacturer"]].map(([key, label]) => <input key={key} value={medicine[key]} onChange={(event) => setMedicine({ ...medicine, [key]: event.target.value })} placeholder={label} className="border border-slate-200 rounded-lg p-2.5 text-xs" required />)}<select value={medicine.unit} onChange={(event) => setMedicine({ ...medicine, unit: event.target.value })} className="border border-slate-200 rounded-lg p-2.5 text-xs"><option>tablet</option><option>capsule</option><option>bottle</option><option>vial</option><option>injection</option><option>strip</option></select><button className="bg-slate-900 text-white rounded-lg p-2.5 text-xs font-semibold flex justify-center gap-1"><Plus className="w-3.5 h-3.5" /> Add to catalog</button></form><form onSubmit={updateStock} className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-3"><h2 className="font-bold text-sm">Update hospital stock</h2><select value={stock.medicineId} onChange={(event) => setStock({ ...stock, medicineId: event.target.value })} className="border border-slate-200 rounded-lg p-2.5 text-xs" required><option value="">Choose medicine</option>{medicines.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select><input type="number" min="0" value={stock.quantity} onChange={(event) => setStock({ ...stock, quantity: Number(event.target.value) })} placeholder="Current quantity" className="border border-slate-200 rounded-lg p-2.5 text-xs" required /><input type="number" min="0" value={stock.minimumStock} onChange={(event) => setStock({ ...stock, minimumStock: Number(event.target.value) })} placeholder="Minimum stock" className="border border-slate-200 rounded-lg p-2.5 text-xs" required /><input type="date" value={stock.expiryDate} onChange={(event) => setStock({ ...stock, expiryDate: event.target.value })} className="border border-slate-200 rounded-lg p-2.5 text-xs" required /><button className="bg-emerald-600 text-white rounded-lg p-2.5 text-xs font-semibold flex justify-center gap-1"><ClipboardList className="w-3.5 h-3.5" /> Save stock</button></form><form onSubmit={updateResource} className="border border-slate-200 rounded-xl p-4 bg-white flex flex-col gap-3 lg:col-span-2"><h2 className="font-bold text-sm">Update hospital resource</h2><select value={resource.resourceType} onChange={(event) => setResource({ ...resource, resourceType: event.target.value })} className="border border-slate-200 rounded-lg p-2.5 text-xs"><option>generalBed</option><option>icuBed</option><option>emergencyBed</option><option>ventilator</option><option>oxygen</option><option>blood</option></select><div className="grid sm:grid-cols-2 gap-3"><input type="number" min="0" value={resource.total} onChange={(event) => setResource({ ...resource, total: Number(event.target.value) })} placeholder="Total" className="border border-slate-200 rounded-lg p-2.5 text-xs" required /><input type="number" min="0" value={resource.available} onChange={(event) => setResource({ ...resource, available: Number(event.target.value) })} placeholder="Available" className="border border-slate-200 rounded-lg p-2.5 text-xs" required /></div><button className="bg-emerald-600 text-white rounded-lg p-2.5 text-xs font-semibold">Save resource totals</button></form></div><div className="mt-5 flex flex-col gap-2">{inventory.map((item) => <div key={item._id} className="border border-slate-200 rounded-xl p-3 bg-white flex justify-between text-xs"><span className="font-semibold">{item.medicineId?.name || "Medicine"}</span><span>{item.quantity} units · min {item.minimumStock} · expires {new Date(item.expiryDate).toLocaleDateString()}</span></div>)}</div></>;
}

void InventoryPortalLegacy; */

function ClinicalPortal({ session }) {
  const [message, setMessage] = useState("");
  const [resources, setResources] = useState([]);
  const [blood, setBlood] = useState({ stock: [], total: 0, available: 0 });
  const [selectedType, setSelectedType] = useState("generalBed");
  const [available, setAvailable] = useState(0);
  const [bloodForm, setBloodForm] = useState({ bloodGroup: "A+", unitsUsed: 0 });
  const load = async () => { try { const [currentResources, currentBlood] = await Promise.all([api.resources(session.hospitalId), api.bloodStock(session.hospitalId)]); setResources(currentResources); setBlood(currentBlood); const selected = currentResources.find((item) => item.resourceType === selectedType); setAvailable(selected?.available || 0); } catch (error) { setMessage(error.message); } };
  useEffect(() => { load(); }, []);
  const selected = resources.find((item) => item.resourceType === selectedType);
  const saveOccupancy = async (event) => { event.preventDefault(); try { await api.clinicalResourceOccupancy(session.hospitalId, selectedType, available); await load(); setMessage("Occupancy saved to the database."); } catch (error) { setMessage(error.message); } };
  const useBlood = async (event) => { event.preventDefault(); try { await api.useBloodStock(session.hospitalId, bloodForm); await load(); setBloodForm({ ...bloodForm, unitsUsed: 0 }); setMessage("Blood usage saved and stock deducted."); } catch (error) { setMessage(error.message); } };
  return <><PortalHeader icon={Hospital} title="Clinical occupancy" description={`Update occupancy only for ${session.hospitalId}; totals are controlled by inventory staff.`} />{message && <p className="mb-3 text-xs text-emerald-700">{message}</p>}<div className="grid lg:grid-cols-2 gap-5"><form onSubmit={saveOccupancy} className="border border-slate-200 rounded-xl bg-white p-4 flex flex-col gap-3"><h2 className="font-bold text-sm">Hospital resource occupancy</h2><select value={selectedType} onChange={(event) => { const type = event.target.value; const item = resources.find((resource) => resource.resourceType === type); setSelectedType(type); setAvailable(item?.available || 0); }} className="border border-slate-200 rounded-lg p-2.5 text-xs"><option>generalBed</option><option>icuBed</option><option>emergencyBed</option><option>ventilator</option><option>oxygen</option></select><p className="text-xs text-slate-500">Total capacity: {selected?.total ?? 0} · Current available: {selected?.available ?? 0}</p><label className="text-xs font-semibold">New available count<input type="number" min="0" max={selected?.total ?? undefined} value={available} onChange={(event) => setAvailable(Number(event.target.value))} className="mt-1 w-full border border-slate-200 rounded-lg p-2.5 text-xs" /></label><button className="bg-emerald-600 text-white rounded-lg p-2.5 text-xs font-semibold">Save occupancy</button></form><form onSubmit={useBlood} className="border border-slate-200 rounded-xl bg-white p-4 flex flex-col gap-3"><h2 className="font-bold text-sm">Record blood units used</h2><p className="text-xs text-slate-500">Total and available blood stock: {blood.total} units</p><select value={bloodForm.bloodGroup} onChange={(event) => setBloodForm({ ...bloodForm, bloodGroup: event.target.value })} className="border border-slate-200 rounded-lg p-2.5 text-xs">{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((group) => <option key={group}>{group}</option>)}</select><p className="text-xs text-slate-500">Current {bloodForm.bloodGroup}: {blood.stock.find((item) => item.bloodGroup === bloodForm.bloodGroup)?.currentStock || 0} units</p><label className="text-xs font-semibold">Units used<input type="number" min="1" value={bloodForm.unitsUsed} onChange={(event) => setBloodForm({ ...bloodForm, unitsUsed: Number(event.target.value) })} className="mt-1 w-full border border-slate-200 rounded-lg p-2.5 text-xs" /></label><button className="bg-rose-600 text-white rounded-lg p-2.5 text-xs font-semibold">Deduct used units</button></form></div></>;
}

export default function StaffPortal({ session, onExit }) {
  return <div className="min-h-screen bg-slate-50 text-slate-900"><header className="bg-white border-b border-slate-200"><div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between"><div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-600" /><span className="font-bold">HealthGrid staff portal</span></div><button onClick={onExit} className="text-xs font-semibold text-slate-500 hover:text-rose-600">Logout</button></div></header><main className="max-w-6xl mx-auto p-4 sm:p-8"><div className="mb-6 flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Signed in as</p><p className="font-mono font-bold text-sm mt-1">{session.userId} · {ROLE_LABELS[session.role] || session.role}</p></div><Status>{session.hospitalId || "System"}</Status></div>{session.role === "SUPER_ADMIN" ? <SuperAdminPortal /> : session.role === "HOSPITAL_ADMIN" ? <HospitalAdminPortal session={session} /> : session.role === "INVENTORY_STAFF" ? <InventoryPortalCards session={session} /> : <ClinicalPortal session={session} />}</main></div>;
}
