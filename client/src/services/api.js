const rawApiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const API_BASE = rawApiBase.trim().replace(/\/+$/, "");

export async function apiRequest(path, options = {}) {
  let response;
  const savedSession = localStorage.getItem("staffSession");
  let token = null;
  if (savedSession) {
    try {
      token = JSON.parse(savedSession).token || null;
    } catch {
      localStorage.removeItem("staffSession");
    }
  }
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      ...options
    });
  } catch {
    throw new Error(`Cannot connect to the server at ${API_BASE}`);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Request failed");
  return payload.data;
}

export const api = {
  login: (body) => apiRequest("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  hospitals: (params = {}) => {
    const query = new URLSearchParams();
    if (params.lat !== undefined && params.lat !== null) query.set("lat", params.lat);
    if (params.lng !== undefined && params.lng !== null) query.set("lng", params.lng);
    if (params.radiusKm !== undefined && params.radiusKm !== null) query.set("radiusKm", params.radiusKm);
    const qs = query.toString();
    return apiRequest(qs ? `/hospitals?${qs}` : "/hospitals");
  },
  submitHospitalRegistration: (body) => apiRequest("/hospital-registration", { method: "POST", body: JSON.stringify(body) }),
  registrationRequests: () => apiRequest("/hospital-registration"),
  approveRegistration: (id) => apiRequest(`/hospital-registration/${id}/approve`, { method: "PATCH" }),
  rejectRegistration: (id, reason) => apiRequest(`/hospital-registration/${id}/reject`, { method: "PATCH", body: JSON.stringify({ reason }) }),
  createMedicine: (body) => apiRequest("/medicines", { method: "POST", body: JSON.stringify(body) }),
  medicines: () => apiRequest("/medicines"),
  inventory: () => apiRequest("/medicines/inventory"),
  hospitalInventory: (hospitalId) => apiRequest(`/medicines/inventory/${hospitalId}`),
  updateInventory: (body) => apiRequest("/medicines/inventory", { method: "POST", body: JSON.stringify(body) }),
  resources: (hospitalId) => apiRequest(`/resources/${hospitalId}`),
  updateResource: (hospitalId, resourceType, body) => apiRequest(`/resources/${hospitalId}/${resourceType}`, { method: "PATCH", body: JSON.stringify(body) }),
  bloodStock: (hospitalId) => apiRequest(`/blood/${hospitalId}`),
  updateBloodStock: (hospitalId, body) => apiRequest(`/blood/${hospitalId}`, { method: "PATCH", body: JSON.stringify(body) }),
  useBloodStock: (hospitalId, body) => apiRequest(`/blood/${hospitalId}/use`, { method: "POST", body: JSON.stringify(body) }),
  occupancy: (hospitalId) => apiRequest(`/beds/occupancy-history/${hospitalId}`),
  clinicalResourceOccupancy: (hospitalId, resourceType, available) => apiRequest(`/resources/${hospitalId}/${resourceType}/occupancy`, { method: "PATCH", body: JSON.stringify({ available }) }),
  updateOccupancy: (body) => apiRequest("/beds/occupancy", { method: "POST", body: JSON.stringify(body) }),
  staff: () => apiRequest("/auth/staff"),
  createStaff: (body) => apiRequest("/auth/staff", { method: "POST", body: JSON.stringify(body) }),
  removeStaff: (id) => apiRequest(`/auth/staff/${id}`, { method: "DELETE" }),
  recommendHospitals: (body) => apiRequest("/ml/recommend", { method: "POST", body: JSON.stringify(body) }),
  outbreakSurveillance: () => apiRequest("/ml/outbreak"),
  bedForecasts: (body = {}) => apiRequest("/ml/forecasts", { method: "POST", body: JSON.stringify(body) }),
  transfers: () => apiRequest("/transfers"),
  createTransfer: (body) => apiRequest("/transfers", { method: "POST", body: JSON.stringify(body) }),
  autoRecommendTransfer: (body) => apiRequest("/transfers/auto-recommend", { method: "POST", body: JSON.stringify(body) }),
  approveTransfer: (id) => apiRequest(`/transfers/${id}/approve`, { method: "PATCH" }),
  rejectTransfer: (id) => apiRequest(`/transfers/${id}/reject`, { method: "PATCH" }),
  completeTransfer: (id) => apiRequest(`/transfers/${id}/complete`, { method: "PATCH" }),
  queryAgent: (body) => apiRequest("/agent/query", { method: "POST", body: JSON.stringify(body) })
};
