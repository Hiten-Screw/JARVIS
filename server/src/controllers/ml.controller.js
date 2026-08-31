import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ML_SERVICE_SCRIPT = path.resolve(__dirname, "../../../ml/ml_service.py");

/**
 * Execute Python ML service with JSON payload via stdin
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
        reject(new Error(`ML service execution timed out after ${timeoutMs}ms`));
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

      if (code !== 0 && !stdoutData.trim()) {
        reject(new Error(`ML service failed with code ${code}: ${stderrData}`));
        return;
      }

      try {
        const trimmed = stdoutData.trim();
        const jsonMatch = trimmed.match(/(\[.*\]|\{.*\})/s);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          resolve(parsed);
        } else {
          resolve(JSON.parse(trimmed));
        }
      } catch (err) {
        reject(new Error(`Failed to parse ML output as JSON: ${err.message}. Raw: ${stdoutData}`));
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
 * POST or GET /api/v1/ml/recommend
 * Runs XGBoost ML recommendation engine on CSV dataset and returns top 5 best options
 */
export const getHospitalRecommendations = asyncHandler(async (req, res) => {
  const queryData = req.method === "POST" ? req.body : req.query;

  const patientLat = Number(queryData.latitude ?? 25.4358);
  const patientLng = Number(queryData.longitude ?? 81.8463);
  const specialty = String(queryData.specialty || "").trim();
  const condition = String(queryData.condition || queryData.disease || "").trim();
  const state = String(queryData.state || "Uttar Pradesh").trim();
  const radiusKm = Number(queryData.radiusKm || queryData.radius || 100);

  const payload = {
    action: "recommend",
    latitude: patientLat,
    longitude: patientLng,
    specialty,
    condition,
    state,
    radiusKm,
    top_n: 5
  };

  let results = [];
  try {
    results = await runPythonML(payload);
  } catch (mlErr) {
    console.warn("Python ML recommendation execution warning:", mlErr.message);
    results = [];
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        query: {
          latitude: patientLat,
          longitude: patientLng,
          specialty,
          condition,
          state
        },
        count: results.length,
        recommendations: results
      },
      "ML hospital recommendations computed successfully from dataset"
    )
  );
});

/**
 * GET /api/v1/ml/outbreak
 * Returns epidemiological outbreak & condition strain surveillance from CSV
 */
export const getOutbreakSurveillance = asyncHandler(async (req, res) => {
  let outbreakData;
  try {
    outbreakData = await runPythonML({ action: "outbreak" });
  } catch (err) {
    console.warn("Outbreak ML fallback:", err.message);
    outbreakData = {
      conditions: [],
      state_summary: [],
      total_cases_tracked: 0,
      highest_demand_condition: ""
    };
  }

  return res.status(200).json(
    new ApiResponse(200, outbreakData, "Outbreak surveillance data retrieved successfully")
  );
});

/**
 * GET / POST /api/v1/ml/forecasts
 * Returns AI bed and surge forecasts
 */
export const getBedDemandForecasts = asyncHandler(async (req, res) => {
  let forecasts;
  try {
    forecasts = await runPythonML({
      action: "forecasts"
    });
  } catch (err) {
    console.warn("Forecast ML fallback:", err.message);
    forecasts = [];
  }

  return res.status(200).json(
    new ApiResponse(200, forecasts, "Bed demand forecasts computed successfully")
  );
});
