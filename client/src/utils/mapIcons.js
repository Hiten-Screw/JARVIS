import L from "leaflet";

export const getHospitalMarkerIcon = (availableBeds, totalBeds) => {
  const percentage = totalBeds > 0 ? (availableBeds / totalBeds) * 100 : 0;

  let bgClass = "bg-rose-500 border-rose-200 text-white"; // Red: Full / Diverted
  let pulseClass = "bg-rose-400";

  if (percentage > 20) {
    bgClass = "bg-emerald-500 border-emerald-200 text-white"; // Green: Available
    pulseClass = "bg-emerald-400";
  } else if (percentage > 0) {
    bgClass = "bg-amber-500 border-amber-200 text-white"; // Yellow: Low Stock
    pulseClass = "bg-amber-400";
  }

  const htmlMarkup = `
    <div class="relative flex items-center justify-center">
      <span class="absolute -top-1 -right-1 flex h-3 w-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${pulseClass} opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 ${pulseClass}"></span>
      </span>
      <div class="w-8 h-8 rounded-full border-2 shadow-md flex items-center justify-center font-bold text-xs ${bgClass}">
        ${availableBeds}
      </div>
    </div>
  `;

  return L.divIcon({
    html: htmlMarkup,
    className: "custom-leaflet-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};