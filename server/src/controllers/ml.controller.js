import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ML_SERVICE_SCRIPT = path.resolve(__dirname, "../../../ml/ml_service.py");

/**
 * Local Python Subprocess Fallback Execution
 */
function runPythonML(payload, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    const pythonCmd = process.env.PYTHON_BIN || "python";
    const pyProcess = spawn(pythonCmd, [ML_SERVICE_SCRIPT, "--stdin"], {
      cwd: path.resolve(__dirname, "../../../ml"),
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, PYTHONIOENCODING: "utf-8" }
    });

    let stdoutData = "";
    let stderrData = "";
    let isSettled = false;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        pyProcess.kill();
        reject(new Error(`Local Python ML service timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    pyProcess.stdout.on("data", (data) => {
      stdoutData += data.toString("utf-8");
    });
    pyProcess.stderr.on("data", (data) => {
      stderrData += data.toString("utf-8");
    });
    pyProcess.on("error", (err) => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        reject(err);
      }
    });
    pyProcess.on("close", (code) => {
      if (isSettled) return;
      isSettled = true;
      clearTimeout(timer);

      try {
        const trimmed = stdoutData.trim();
        const jsonMatch = trimmed.match(/(\[.*\]|\{.*\})/s);
        if (jsonMatch) {
          resolve(JSON.parse(jsonMatch[0]));
        } else {
          resolve(JSON.parse(trimmed));
        }
      } catch (err) {
        resolve([]);
      }
    });

    try {
      pyProcess.stdin.write(JSON.stringify(payload));
      pyProcess.stdin.end();
    } catch (writeErr) {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        reject(writeErr);
      }
    }
  });
}

/**
 * Helper function to call deployed ML FastAPI service
 */
export async function callMLService(endpoint, method = "GET", payload = null) {
  const rawUrl = process.env.ML_SERVICE_URL || "https://jarvis-ml-service.onrender.com";
  const ML_SERVICE_URL = rawUrl.trim().replace(/\/+$/, "");

  if (!ML_SERVICE_URL) {
    throw new Error("ML_SERVICE_URL is not configured");
  }
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
    action: "recommend",
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
      50
    )
  };

  try {
    const mlResponse = await callMLService(
      "/recommend",
      "POST",
      payload
    );

    const recommendations = mlResponse.recommendations || [];

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
  } catch (remoteError) {
    console.warn("Remote ML service unavailable, falling back to local Python engine:", remoteError.message);

    try {
      const localRecommendations = await runPythonML(payload);
      const recs = Array.isArray(localRecommendations) ? localRecommendations : [];

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            query: payload,
            count: recs.length,
            recommendations: recs
          },
          "ML hospital recommendations computed via local Python engine"
        )
      );
    } catch (localErr) {
      console.error("Local ML recommendation error:", localErr.message);
      return res.status(500).json(
        new ApiResponse(500, null, "Unable to compute ML hospital recommendations")
      );
    }
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
  } catch (remoteError) {
    console.warn("Remote ML outbreak service unavailable, running local Python engine:", remoteError.message);

    try {
      const localOutbreak = await runPythonML({ action: "outbreak" });
      return res.status(200).json(
        new ApiResponse(200, localOutbreak || {}, "Outbreak surveillance data retrieved via local Python engine")
      );
    } catch (localErr) {
      console.error("Local ML outbreak service error:", localErr.message);
      return res.status(500).json(
        new ApiResponse(500, null, "Unable to retrieve outbreak surveillance data")
      );
    }
  }
});

/**
 * GET or POST /api/v1/ml/forecasts
 */
export const getBedDemandForecasts = asyncHandler(async (req, res) => {
  const payload = req.method === "POST" ? req.body : {};

  try {
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
  } catch (remoteError) {
    console.warn("Remote ML forecast service unavailable, running local Python engine:", remoteError.message);

    try {
      const localForecasts = await runPythonML({ action: "forecasts", hospitals: payload.hospitals || null });
      return res.status(200).json(
        new ApiResponse(200, localForecasts || [], "Bed demand forecasts computed via local Python engine")
      );
    } catch (localErr) {
      console.error("Local ML forecast service error:", localErr.message);
      return res.status(500).json(
        new ApiResponse(500, null, "Unable to compute bed demand forecasts")
      );
    }
  }
});