export const DEFAULT_MAP_CENTER = [25.4358, 81.8463];
export const RADIUS_OPTIONS_KM = [5, 10, 25, 50];

export function distanceKm(from, to) {
  if (!from || !to || from.length < 2 || to.length < 2) return Number.POSITIVE_INFINITY;
  const [lat1, lon1] = from;
  const [lat2, lon2] = to;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km) {
  if (!Number.isFinite(km)) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function withDistance(records, origin) {
  return records.map((record) => {
    const km = distanceKm(origin, record.coordinates);
    return { ...record, distanceKm: km, distance: formatDistance(km) };
  });
}

export function withinRadius(records, origin, radiusKm) {
  return withDistance(records, origin)
    .filter((record) => record.distanceKm <= radiusKm)
    .sort((left, right) => left.distanceKm - right.distanceKm);
}
