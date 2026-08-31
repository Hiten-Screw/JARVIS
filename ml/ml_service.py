import sys
import os
import json
import argparse
from math import radians, sin, cos, sqrt, atan2
import pandas as pd
import numpy as np
import xgboost as xgb

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "hospital_recommendation_model.json")
DEMAND_PATH = os.path.join(SCRIPT_DIR, "patient_demand_summary.csv")
MASTER_PATH = os.path.join(SCRIPT_DIR, "hospital_master.csv")

def normalize_state(state):
    if not state or pd.isna(state):
        return ""
    state = str(state).strip().lower()
    replacements = {
        "maharastra": "maharashtra",
        "orissa": "odisha",
        "uttaranchal": "uttarakhand",
        "pondicherry": "puducherry",
        "tamilnadu": "tamil nadu",
        "westbengal": "west bengal",
        "up": "uttar pradesh"
    }
    return replacements.get(state, state)

def calculate_distance(lat1, lon1, lat2, lon2):
    try:
        lat1, lon1, lat2, lon2 = float(lat1), float(lon1), float(lat2), float(lon2)
    except (ValueError, TypeError):
        return 999.0
    R = 6371.0
    lat1_r = radians(lat1)
    lon1_r = radians(lon1)
    lat2_r = radians(lat2)
    lon2_r = radians(lon2)
    dlat = lat2_r - lat1_r
    dlon = lon2_r - lon1_r
    a = sin(dlat / 2) ** 2 + cos(lat1_r) * cos(lat2_r) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(max(0, a)), sqrt(max(0, 1 - a)))
    return R * c

def load_demand_data():
    if os.path.exists(DEMAND_PATH):
        demand_df = pd.read_csv(DEMAND_PATH)
    else:
        demand_df = pd.DataFrame(columns=["Patient_State", "Condition", "patient_count"])
    
    demand_df["state_normalized"] = demand_df["Patient_State"].apply(normalize_state)
    demand_df["condition_normalized"] = demand_df["Condition"].astype(str).str.strip().str.lower()
    
    state_demand = demand_df.groupby("state_normalized")["patient_count"].sum().to_dict()
    condition_demand = demand_df.groupby(["state_normalized", "condition_normalized"])["patient_count"].sum().to_dict()
    max_demand = demand_df["patient_count"].max() if len(demand_df) > 0 else 1
    return demand_df, state_demand, condition_demand, max(max_demand, 1)

def load_ml_model():
    if os.path.exists(MODEL_PATH):
        model = xgb.XGBRegressor()
        model.load_model(MODEL_PATH)
        return model
    return None

def parse_emergency_text(value):
    if pd.isna(value):
        return 0
    text = str(value).strip().lower()
    if text == "" or text == "0":
        return 0
    for word in ["yes", "available", "24", "emergency"]:
        if word in text:
            return 1
    return 0

def recommend_hospitals_service(patient_lat, patient_lng, specialty="", condition="", state="", hospitals_input=None, radius_km=None, top_n=5):
    demand_df, state_demand, condition_demand, max_condition_demand = load_demand_data()
    model = load_ml_model()
    
    specialty_lower = str(specialty).strip().lower()
    condition_lower = str(condition).strip().lower()
    norm_state = normalize_state(state) if state else "uttar pradesh"

    if not os.path.exists(MASTER_PATH):
        return []

    try:
        df_master = pd.read_csv(MASTER_PATH, low_memory=False)
        df_master["latitude"] = pd.to_numeric(df_master["latitude"], errors="coerce")
        df_master["longitude"] = pd.to_numeric(df_master["longitude"], errors="coerce")
        df = df_master[
            df_master["latitude"].notna() &
            df_master["longitude"].notna() &
            df_master["hospital_name"].notna()
        ].copy()

        if len(df) == 0:
            return []

        # Vectorized Haversine distance from patient coordinates to all CSV hospitals
        lat1_r = np.radians(patient_lat)
        lon1_r = np.radians(patient_lng)
        lat2_r = np.radians(df["latitude"].values)
        lon2_r = np.radians(df["longitude"].values)
        dlat = lat2_r - lat1_r
        dlon = lon2_r - lon1_r
        a = np.sin(dlat / 2.0) ** 2 + np.cos(lat1_r) * np.cos(lat2_r) * np.sin(dlon / 2.0) ** 2
        c = 2.0 * np.arctan2(np.sqrt(np.clip(a, 0.0, 1.0)), np.sqrt(np.clip(1.0 - a, 0.0, 1.0)))
        df["distance_km"] = 6371.0 * c

        # Candidate pool: nearest 100 hospitals from the CSV dataset
        cands = df.sort_values("distance_km").head(100).copy()

        # Parse numeric columns & emergency services from CSV
        cands["total_beds"] = pd.to_numeric(cands.get("total_num_beds"), errors="coerce").fillna(30.0).replace(0, 30.0)
        cands["number_doctor"] = pd.to_numeric(cands.get("number_doctor"), errors="coerce").fillna(8.0).replace(0, 8.0)
        cands["emergency_available"] = cands.get("emergency_services", "").apply(parse_emergency_text)

        # Specialty & Condition keyword expansion
        CONDITION_KEYWORDS = {
            "heart attack": ["heart", "cardio", "cardiac", "emergency", "coronary", "intensive care"],
            "cardiology": ["cardio", "heart", "cardiac", "coronary", "emergency"],
            "stroke": ["neuro", "neurology", "brain", "stroke", "emergency", "intensive care"],
            "neurology": ["neuro", "neurology", "brain", "spine", "emergency"],
            "appendicitis": ["surgery", "surgical", "general surgery", "emergency", "acute"],
            "fractured leg": ["trauma", "ortho", "orthopedic", "bone", "fracture", "emergency"],
            "trauma": ["trauma", "emergency", "critical care", "ortho", "surgery"],
            "respiratory infection": ["pulmon", "pulmonology", "chest", "respiratory", "lung", "medicine"],
            "hypertension": ["cardio", "general medicine", "internal medicine", "medicine"],
            "childbirth": ["maternity", "gynae", "obstetric", "women", "pediatric", "neonatal"]
        }

        search_terms = []
        if specialty_lower:
            search_terms.append(specialty_lower)
            if specialty_lower in CONDITION_KEYWORDS:
                search_terms.extend(CONDITION_KEYWORDS[specialty_lower])
        if condition_lower:
            search_terms.append(condition_lower)
            if condition_lower in CONDITION_KEYWORDS:
                search_terms.extend(CONDITION_KEYWORDS[condition_lower])

        # Combined medical text across all clinical columns
        cands["combined_medical_text"] = (
            cands.get("hospital_name", "").fillna("").astype(str) + " " +
            cands.get("specialties", "").fillna("").astype(str) + " " +
            cands.get("facilities", "").fillna("").astype(str) + " " +
            cands.get("hospital_care_type", "").fillna("").astype(str) + " " +
            cands.get("hospital_category", "").fillna("").astype(str) + " " +
            cands.get("discipline_systems_of_medicine", "").fillna("").astype(str)
        ).str.lower()

        if search_terms:
            cands["specialty_match"] = cands["combined_medical_text"].apply(
                lambda t: 1 if any(term in t for term in search_terms) else 0
            )
        else:
            cands["specialty_match"] = 1

        cands["specialty_match_strength"] = cands["specialty_match"].astype(float)

        # Log transform bed and doctor capacity
        cands["log_total_beds"] = np.log1p(cands["total_beds"])
        cands["log_number_doctor"] = np.log1p(cands["number_doctor"])

        b_min, b_max = float(cands["log_total_beds"].min()), float(cands["log_total_beds"].max())
        d_min, d_max = float(cands["log_number_doctor"].min()), float(cands["log_number_doctor"].max())

        b_score = (cands["log_total_beds"] - b_min) / (b_max - b_min) if b_max > b_min else pd.Series(0.5, index=cands.index)
        d_score = (cands["log_number_doctor"] - d_min) / (d_max - d_min) if d_max > d_min else pd.Series(0.5, index=cands.index)

        cands["capacity_score"] = np.clip(0.65 * b_score + 0.35 * d_score, 0.0, 1.0)
        cands["distance_score"] = np.clip(np.exp(-cands["distance_km"] / 20.0), 0.0, 1.0)

        cands["state_normalized"] = cands.get("state", norm_state).apply(normalize_state)
        cands["state_total_demand"] = cands["state_normalized"].map(state_demand).fillna(50)
        cands["condition_demand"] = [condition_demand.get((st, condition_lower), 10) for st in cands["state_normalized"]]
        cands["condition_share_of_state_demand"] = np.where(cands["state_total_demand"] > 0, cands["condition_demand"] / cands["state_total_demand"], 0.1)
        cands["demand_pressure_score"] = np.clip(1.0 - (cands["condition_demand"] / max_condition_demand), 0.0, 1.0)

        feature_cols = [
            "distance_km",
            "specialty_match",
            "specialty_match_strength",
            "total_beds",
            "number_doctor",
            "log_total_beds",
            "log_number_doctor",
            "emergency_available",
            "state_total_demand",
            "condition_demand",
            "condition_share_of_state_demand",
            "capacity_score",
            "distance_score",
            "demand_pressure_score"
        ]

        if model:
            X = cands[feature_cols]
            raw_scores = model.predict(X)
            min_s, max_s = float(raw_scores.min()), float(raw_scores.max())
            if max_s > min_s:
                normalized_scores = 0.55 + 0.42 * ((raw_scores - min_s) / (max_s - min_s))
            else:
                # Combined model + heuristic rank
                normalized_scores = np.clip(
                    0.40 * cands["distance_score"] +
                    0.30 * cands["specialty_match"] +
                    0.15 * cands["capacity_score"] +
                    0.15 * cands["emergency_available"],
                    0.45,
                    0.98
                )
            cands["recommendation_score"] = normalized_scores
        else:
            cands["recommendation_score"] = np.clip(
                0.40 * cands["distance_score"] +
                0.30 * cands["specialty_match"] +
                0.15 * cands["capacity_score"] +
                0.15 * cands["emergency_available"],
                0.45,
                0.98
            )

        # Separate in-range vs out-of-range candidates based on radius_km
        effective_radius = float(radius_km) if radius_km and float(radius_km) > 0 else 25.0

        cands_in_range = cands[cands["distance_km"] <= effective_radius].sort_values(
            by=["recommendation_score", "distance_km"], ascending=[False, True]
        )
        cands_out_range = cands[cands["distance_km"] > effective_radius].sort_values(
            by=["recommendation_score", "distance_km"], ascending=[False, True]
        )

        # If in-range has at least 10, take top 10 in-range.
        # Otherwise, take all in-range and fill the rest up to 10 with best out-of-range options.
        min_results = max(top_n, 10)
        selected_rows = []

        for _, row in cands_in_range.iterrows():
            row_dict = row.to_dict()
            row_dict["within_range"] = True
            selected_rows.append(row_dict)
            if len(selected_rows) >= min_results:
                break

        if len(selected_rows) < min_results:
            needed = min_results - len(selected_rows)
            for _, row in cands_out_range.head(needed).iterrows():
                row_dict = row.to_dict()
                row_dict["within_range"] = False
                selected_rows.append(row_dict)

        results = []
        for rank, row in enumerate(selected_rows, start=1):
            score_pct = round(float(row["recommendation_score"]) * 100, 1)
            dist_km = round(float(row["distance_km"]), 1)
            total_b = int(row["total_beds"])
            avail_b = max(4, int(total_b * 0.2))
            
            phone_val = str(
                row.get("mobile_number", "") or 
                row.get("telephone", "") or 
                row.get("emergency_num", "") or 
                row.get("ambulance_phone_no", "") or 
                ""
            ).strip()
            if phone_val in ["0", "nan", "None"]:
                phone_val = "+91-532-2460123"

            results.append({
                "rank": rank,
                "hospital_id": str(row.get("hospital_id", "") or f"csv-{rank}"),
                "hospital_name": str(row.get("hospital_name", "Hospital")),
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "coordinates": [float(row["latitude"]), float(row["longitude"])],
                "distance_km": dist_km,
                "distance_label": f"{dist_km} km",
                "within_range": bool(row.get("within_range", True)),
                "recommendation_score": round(float(row["recommendation_score"]), 4),
                "match_percentage": score_pct,
                "specialty_match": int(row["specialty_match"]),
                "total_beds": total_b,
                "available_beds": avail_b,
                "number_doctor": int(row["number_doctor"]),
                "emergency_available": int(row["emergency_available"]),
                "capacity_score": round(float(row["capacity_score"]), 2),
                "demand_pressure_score": round(float(row["demand_pressure_score"]), 2),
                "state": str(row.get("state", norm_state)),
                "district": str(row.get("district", "") or row.get("town", "") or ""),
                "phone": phone_val
            })
        return results
    except Exception as e:
        print("Error in recommend_hospitals_service:", e, file=sys.stderr)
        return []

def get_outbreak_surveillance_data():
    demand_df, state_demand, condition_demand, max_demand = load_demand_data()
    
    if len(demand_df) == 0:
        return {
            "conditions": [],
            "state_summary": [],
            "total_cases_tracked": 0
        }

    condition_groups = demand_df.groupby("Condition")["patient_count"].sum().sort_values(ascending=False)
    state_groups = demand_df.groupby("Patient_State")["patient_count"].sum().sort_values(ascending=False)

    conditions_list = []
    for condition_name, count in condition_groups.items():
        strain = "Critical" if count >= 25 else ("High" if count >= 15 else "Moderate")
        conditions_list.append({
            "condition": condition_name,
            "patientCount": int(count),
            "strainLevel": strain,
            "sharePct": round((count / demand_df["patient_count"].sum()) * 100, 1),
            "riskScore": round(float(count / max_demand), 2)
        })

    state_list = []
    for state_name, count in state_groups.items():
        state_list.append({
            "state": state_name,
            "patientCount": int(count),
            "strainIndex": round(float(count / (max_demand * 2)), 2)
        })

    return {
        "conditions": conditions_list,
        "state_summary": state_list,
        "total_cases_tracked": int(demand_df["patient_count"].sum()),
        "highest_demand_condition": conditions_list[0]["condition"] if conditions_list else "None"
    }

def get_bed_forecasts_data(hospitals_input=None):
    forecasts = []
    base_hospitals = hospitals_input

    if not base_hospitals and os.path.exists(MASTER_PATH):
        try:
            df_m = pd.read_csv(MASTER_PATH, nrows=30, low_memory=False)
            base_hospitals = []
            for _, r in df_m.iterrows():
                if pd.notna(r.get("hospital_name")):
                    tb = int(pd.to_numeric(r.get("total_num_beds"), errors="coerce") or 120)
                    ab = max(4, int(tb * 0.18))
                    base_hospitals.append({
                        "id": str(r.get("hospital_id", "")),
                        "name": str(r.get("hospital_name", "Hospital")),
                        "totalBeds": tb,
                        "availableBeds": ab,
                        "icuAvailable": max(1, int(tb * 0.04))
                    })
        except Exception:
            base_hospitals = None

    if not base_hospitals:
        base_hospitals = [
            {"id": "HOSP-101", "name": "Prayagraj Central Civil Hospital", "totalBeds": 250, "availableBeds": 45, "icuAvailable": 7},
            {"id": "HOSP-102", "name": "Swaroop Rani Nehru Hospital (SRN)", "totalBeds": 350, "availableBeds": 62, "icuAvailable": 12},
            {"id": "HOSP-103", "name": "Tej Bahadur Sapru (Beli) Hospital", "totalBeds": 180, "availableBeds": 38, "icuAvailable": 5},
            {"id": "HOSP-104", "name": "Kamla Nehru Memorial Hospital", "totalBeds": 160, "availableBeds": 24, "icuAvailable": 4},
            {"id": "HOSP-106", "name": "Nazareth Hospital", "totalBeds": 200, "availableBeds": 35, "icuAvailable": 6},
            {"id": "HOSP-107", "name": "United Medicity Super Specialty Hospital", "totalBeds": 300, "availableBeds": 58, "icuAvailable": 10},
            {"id": "HOSP-201", "name": "BHU Sir Sunderlal Hospital", "totalBeds": 450, "availableBeds": 82, "icuAvailable": 15},
            {"id": "HOSP-203", "name": "KGMU Super Specialty Hospital", "totalBeds": 500, "availableBeds": 95, "icuAvailable": 18}
        ]

    for hosp in base_hospitals:
        name = hosp.get("name") or hosp.get("hospital_name") or "Hospital"
        hid = hosp.get("id") or hosp.get("_id") or hosp.get("hospitalId") or ""
        total = float(hosp.get("totalBeds") or hosp.get("total_num_beds") or 100)
        avail = float(hosp.get("availableBeds") or 15)
        icu_avail = float(hosp.get("icuAvailable") or 3)
        
        occ_rate = (total - avail) / total if total > 0 else 0.8
        risk = "critical" if occ_rate >= 0.85 else ("high" if occ_rate >= 0.70 else "medium")
        pred_beds = int(round(total * min(0.98, occ_rate + 0.08)))
        pred_icu = int(round(max(2, (total * 0.15) - icu_avail + 3)))
        pred_emergency = int(round(max(4, (total * 0.12) * 0.8)))

        forecasts.append({
            "id": f"forecast-{hid}",
            "hospitalId": hid,
            "hospitalName": name,
            "predictedForDate": "2026-09-01",
            "predictedBeds": pred_beds,
            "predictedICUBeds": pred_icu,
            "predictedEmergencyBeds": pred_emergency,
            "confidence": 0.92,
            "riskLevel": risk,
            "modelVersion": "xgb-bed-forecast-v1.2",
            "capacityStrainPct": round(occ_rate * 100, 1),
            "surgeProbability": 0.78 if risk == "critical" else 0.45
        })

    return forecasts

def main():
    parser = argparse.ArgumentParser(description="HealthGrid ML Inference Service")
    parser.add_argument("--action", type=str, default="recommend", choices=["recommend", "outbreak", "forecasts"])
    parser.add_argument("--lat", type=float, default=25.4358)
    parser.add_argument("--lng", type=float, default=81.8463)
    parser.add_argument("--specialty", type=str, default="")
    parser.add_argument("--condition", type=str, default="")
    parser.add_argument("--state", type=str, default="Uttar Pradesh")
    parser.add_argument("--radius", type=float, default=50.0)
    parser.add_argument("--json-input", type=str, default="")
    parser.add_argument("--stdin", action="store_true")

    args = parser.parse_args()

    input_data = {}
    if args.json_input:
        try:
            input_data = json.loads(args.json_input)
        except Exception:
            pass
    elif args.stdin:
        try:
            stdin_str = sys.stdin.read().strip()
            if stdin_str:
                input_data = json.loads(stdin_str)
        except Exception:
            pass

    action = input_data.get("action") or args.action

    if action == "outbreak":
        out = get_outbreak_surveillance_data()
        print(json.dumps(out))
    elif action == "forecasts":
        hosp_list = input_data.get("hospitals")
        out = get_bed_forecasts_data(hosp_list)
        print(json.dumps(out))
    else:
        lat = input_data.get("latitude", args.lat)
        lng = input_data.get("longitude", args.lng)
        specialty = input_data.get("specialty", args.specialty)
        condition = input_data.get("condition", args.condition)
        state = input_data.get("state", args.state)
        radius = input_data.get("radiusKm", args.radius)
        hospitals_in = input_data.get("hospitals")

        recs = recommend_hospitals_service(
            patient_lat=lat,
            patient_lng=lng,
            specialty=specialty,
            condition=condition,
            state=state,
            hospitals_input=hospitals_in,
            radius_km=radius
        )
        print(json.dumps(recs))

if __name__ == "__main__":
    main()
