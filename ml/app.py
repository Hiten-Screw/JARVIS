import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from ml_service import (
    recommend_hospitals_service,
    get_outbreak_surveillance_data,
    get_bed_forecasts_data
)

app = FastAPI(
    title="JARVIS ML Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecommendationRequest(BaseModel):
    latitude: float
    longitude: float
    specialty: Optional[str] = ""
    condition: Optional[str] = ""
    state: Optional[str] = "Uttar Pradesh"
    radiusKm: Optional[float] = 50.0
    hospitals: Optional[List[Dict[str, Any]]] = None


@app.get("/")
def home():
    return {
        "message": "JARVIS ML Service is running"
    }


@app.post("/recommend")
def recommend(data: RecommendationRequest):
    results = recommend_hospitals_service(
        patient_lat=data.latitude,
        patient_lng=data.longitude,
        specialty=data.specialty,
        condition=data.condition,
        state=data.state,
        hospitals_input=data.hospitals,
        radius_km=data.radiusKm
    )

    return {
        "success": True,
        "recommendations": results
    }


@app.get("/outbreak")
def outbreak():
    return get_outbreak_surveillance_data()


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/forecasts")
def forecasts(hospitals: Optional[List[Dict[str, Any]]] = None):
    return get_bed_forecasts_data(hospitals)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)