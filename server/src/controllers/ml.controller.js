import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

/**
 * Helper function to call deployed ML FastAPI service
 */
export async function callMLService(endpoint, method = "GET", payload = null) {
  const rawUrl = process.env.ML_SERVICE_URL || "https://jarvis-ml-service.onrender.com";
  const ML_SERVICE_URL = rawUrl.trim().replace(/\/+$/, "");

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (payload && method !== "GET") {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(
    `${ML_SERVICE_URL}${cleanEndpoint}`,
    options
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ML service error (${response.status}): ${errorText}`
    );
  }

  return await response.json();
}


/**
 * GET or POST /api/v1/ml/recommend
 */
export const getHospitalRecommendations = asyncHandler(async (req, res) => {

  const queryData =
    req.method === "POST"
      ? req.body
      : req.query;

  const payload = {
    latitude: Number(queryData.latitude ?? 25.4358),
    longitude: Number(queryData.longitude ?? 81.8463),
    specialty: String(queryData.specialty || "").trim(),
    condition: String(
      queryData.condition ||
      queryData.disease ||
      ""
    ).trim(),
    state: String(
      queryData.state ||
      "Uttar Pradesh"
    ).trim(),
    radiusKm: Number(
      queryData.radiusKm ||
      queryData.radius ||
      100
    )
  };

  try {
    const mlResponse = await callMLService(
      "/recommend",
      "POST",
      payload
    );

    const recommendations =
      mlResponse.recommendations || [];

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          query: payload,
          count: recommendations.length,
          recommendations
        },
        "ML hospital recommendations computed successfully"
      )
    );

  } catch (error) {

    console.error(
      "ML recommendation service error:",
      error.message
    );

    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        "Unable to connect to ML recommendation service"
      )
    );
  }
});


/**
 * GET /api/v1/ml/outbreak
 */
export const getOutbreakSurveillance = asyncHandler(async (req, res) => {

  try {

    const outbreakData = await callMLService(
      "/outbreak",
      "GET"
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        outbreakData,
        "Outbreak surveillance data retrieved successfully"
      )
    );

  } catch (error) {

    console.error(
      "ML outbreak service error:",
      error.message
    );

    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        "Unable to connect to ML outbreak service"
      )
    );
  }
});


/**
 * GET or POST /api/v1/ml/forecasts
 */
export const getBedDemandForecasts = asyncHandler(async (req, res) => {

  try {

    const payload =
      req.method === "POST"
        ? req.body
        : {};

    const forecasts = await callMLService(
      "/forecasts",
      "POST",
      payload.hospitals || null
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        forecasts,
        "Bed demand forecasts computed successfully"
      )
    );

  } catch (error) {

    console.error(
      "ML forecast service error:",
      error.message
    );

    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        "Unable to connect to ML forecast service"
      )
    );
  }
});