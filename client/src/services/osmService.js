// client/src/services/osmService.js
import axios from "axios";

// 1. Nominatim Geocoding API: Search area or landmark name to get coordinates
export const geocodeLocation = async (queryText) => {
  if (!queryText || queryText.trim().length < 3) return null;
  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: queryText,
        format: "json",
        limit: 1,
      },
    });
    if (response.data && response.data.length > 0) {
      const { lat, lon, display_name } = response.data[0];
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        displayName: display_name,
      };
    }
    return null;
  } catch (error) {
    console.error("OSM Nominatim Geocoding Error:", error);
    return null;
  }
};

// 2. OSRM Driving Engine: Calculate actual road distance (km) and driving ETA (minutes)
export const getDrivingRoute = async (userCoords, targetCoords) => {
  try {
    // Note: OSRM expects coordinates in [longitude, latitude] order
    const url = `https://router.project-osrm.org/route/v1/driving/${userCoords[1]},${userCoords[0]};${targetCoords[1]},${targetCoords[0]}?overview=full&geometries=geojson`;
    const response = await axios.get(url);

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distanceKm: (route.distance / 1000).toFixed(1), // Convert meters to km
        durationMins: Math.round(route.duration / 60),  // Convert seconds to minutes
        geometry: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), // Leaflet requires [lat, lng]
      };
    }
    return null;
  } catch (error) {
    console.error("OSRM Route Computation Error:", error);
    return null;
  }
};