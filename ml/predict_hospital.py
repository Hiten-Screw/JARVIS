import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from math import radians, sin, cos, sqrt, atan2


# ============================================================
# LOAD DATA
# ============================================================

print("Loading hospital data...")

hospitals = pd.read_csv(
    "hospital_master.csv",
    low_memory=False
)

print("Loading patient demand data...")

demand = pd.read_csv(
    "patient_demand_summary.csv"
)

print("Loading trained XGBoost model...")

model = XGBRegressor()
model.load_model("hospital_recommendation_model.json")

print("All files loaded successfully.")


# ============================================================
# NORMALIZE STATE
# ============================================================

def normalize_state(state):

    if pd.isna(state):
        return ""

    state = str(state).strip().lower()

    replacements = {
        "maharastra": "maharashtra",
        "orissa": "odisha",
        "uttaranchal": "uttarakhand",
        "pondicherry": "puducherry",
        "tamilnadu": "tamil nadu",
        "westbengal": "west bengal"
    }

    return replacements.get(state, state)


# ============================================================
# DEMAND DATA
# ============================================================

demand["state_normalized"] = (
    demand["Patient_State"]
    .apply(normalize_state)
)

demand["condition_normalized"] = (
    demand["Condition"]
    .astype(str)
    .str.strip()
    .str.lower()
)

state_demand = (
    demand
    .groupby("state_normalized")["patient_count"]
    .sum()
    .to_dict()
)

condition_demand = (
    demand
    .groupby(
        [
            "state_normalized",
            "condition_normalized"
        ]
    )["patient_count"]
    .sum()
    .to_dict()
)

max_condition_demand = max(
    demand["patient_count"].max(),
    1
)


# ============================================================
# HAVERSINE
# ============================================================

def calculate_distance(
    lat1,
    lon1,
    lat2,
    lon2
):

    R = 6371.0

    lat1 = radians(lat1)
    lon1 = radians(lon1)

    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        sin(dlat / 2) ** 2
        +
        cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a)
    )

    return R * c


# ============================================================
# EMERGENCY
# ============================================================

def parse_emergency(value):

    if pd.isna(value):
        return 0

    text = str(value).strip().lower()

    if text == "":
        return 0

    for word in [
        "yes",
        "available",
        "24",
        "emergency"
    ]:

        if word in text:
            return 1

    return 0


# ============================================================
# RECOMMEND HOSPITALS
# ============================================================

def recommend_hospitals(
    patient_latitude,
    patient_longitude,
    requested_specialty,
    requested_condition
):

    df = hospitals.copy()

    # --------------------------------------------------------
    # CLEAN
    # --------------------------------------------------------

    df["latitude"] = pd.to_numeric(
        df["latitude"],
        errors="coerce"
    )

    df["longitude"] = pd.to_numeric(
        df["longitude"],
        errors="coerce"
    )

    df["total_num_beds"] = pd.to_numeric(
        df["total_num_beds"],
        errors="coerce"
    )

    df["number_doctor"] = pd.to_numeric(
        df["number_doctor"],
        errors="coerce"
    ).fillna(0)

    # --------------------------------------------------------
    # VALID HOSPITALS
    # --------------------------------------------------------

    df = df[
        df["latitude"].notna()
        &
        df["longitude"].notna()
        &
        df["total_num_beds"].notna()
        &
        (df["total_num_beds"] > 0)
        &
        df["hospital_name"].notna()
    ].copy()

    # --------------------------------------------------------
    # DISTANCE
    # --------------------------------------------------------

    df["distance_km"] = df.apply(
        lambda row: calculate_distance(
            patient_latitude,
            patient_longitude,
            row["latitude"],
            row["longitude"]
        ),
        axis=1
    )

    # --------------------------------------------------------
    # 100 KM RADIUS
    # --------------------------------------------------------

    df = df[
        df["distance_km"] <= 100
    ].copy()

    df = (
        df
        .sort_values("distance_km")
        .head(20)
        .copy()
    )

    if len(df) == 0:
        return pd.DataFrame()

    # --------------------------------------------------------
    # SPECIALTY
    # --------------------------------------------------------

    requested_specialty = (
        str(requested_specialty)
        .strip()
        .lower()
    )

    df["specialty_text"] = (
        df["specialties"]
        .fillna("")
        .astype(str)
        .str.lower()
    )

    df["specialty_match"] = (
        df["specialty_text"]
        .apply(
            lambda text:
            1 if requested_specialty in text else 0
        )
    )

    df["specialty_match_strength"] = (
        df["specialty_match"]
    )

    # If specialty matches exist, use them
    matched = df[
        df["specialty_match"] == 1
    ].copy()

    if len(matched) > 0:
        df = matched.copy()

    # --------------------------------------------------------
    # CAPACITY
    # --------------------------------------------------------

    df["total_beds"] = df["total_num_beds"]

    df["log_total_beds"] = np.log1p(
        df["total_beds"]
    )

    df["log_number_doctor"] = np.log1p(
        df["number_doctor"]
    )

    bed_min = df["log_total_beds"].min()
    bed_max = df["log_total_beds"].max()

    doctor_min = df["log_number_doctor"].min()
    doctor_max = df["log_number_doctor"].max()

    if bed_max > bed_min:
        bed_score = (
            df["log_total_beds"] - bed_min
        ) / (
            bed_max - bed_min
        )
    else:
        bed_score = 0.5

    if doctor_max > doctor_min:
        doctor_score = (
            df["log_number_doctor"] - doctor_min
        ) / (
            doctor_max - doctor_min
        )
    else:
        doctor_score = 0.5

    df["capacity_score"] = (
        0.65 * bed_score
        +
        0.35 * doctor_score
    )

    # --------------------------------------------------------
    # DISTANCE SCORE
    # --------------------------------------------------------

    df["distance_score"] = np.exp(
        -df["distance_km"] / 20
    )

    # --------------------------------------------------------
    # EMERGENCY
    # --------------------------------------------------------

    df["emergency_available"] = (
        df["emergency_services"]
        .apply(parse_emergency)
    )

    # --------------------------------------------------------
    # DEMAND
    # --------------------------------------------------------

    df["state_normalized"] = (
        df["state"]
        .apply(normalize_state)
    )

    requested_condition = (
        str(requested_condition)
        .strip()
        .lower()
    )

    df["state_total_demand"] = (
        df["state_normalized"]
        .map(state_demand)
        .fillna(0)
    )

    df["condition_demand"] = [
        condition_demand.get(
            (
                state,
                requested_condition
            ),
            0
        )
        for state in df["state_normalized"]
    ]

    df["condition_share_of_state_demand"] = np.where(
        df["state_total_demand"] > 0,
        df["condition_demand"]
        /
        df["state_total_demand"],
        0
    )

    df["demand_pressure_score"] = np.clip(
        1
        -
        (
            df["condition_demand"]
            /
            max_condition_demand
        ),
        0,
        1
    )

    # --------------------------------------------------------
    # MODEL FEATURES
    # --------------------------------------------------------

    features = [
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

    X = df[features]

    # --------------------------------------------------------
    # PREDICT
    # --------------------------------------------------------

    df["recommendation_score"] = (
        model.predict(X)
    )

    # --------------------------------------------------------
    # SORT
    # --------------------------------------------------------

    df = (
        df
        .sort_values(
            "recommendation_score",
            ascending=False
        )
    )

    # --------------------------------------------------------
    # TOP 3
    # --------------------------------------------------------

    result = df.head(3)[
        [
            "hospital_id",
            "hospital_name",
            "state",
            "district",
            "distance_km",
            "specialties",
            "specialty_match",
            "total_beds",
            "number_doctor",
            "state_total_demand",
            "condition_demand",
            "recommendation_score"
        ]
    ].copy()

    return result


# ============================================================
# INTERACTIVE PROGRAM
# ============================================================

if __name__ == "__main__":

    print()
    print("==================================================")
    print("          AI HOSPITAL RECOMMENDATION")
    print("==================================================")
    print()

    try:

        latitude = float(
            input("Enter patient latitude: ")
        )

        longitude = float(
            input("Enter patient longitude: ")
        )

        specialty = input(
            "Enter required specialty: "
        )

        condition = input(
            "Enter patient condition: "
        )

        print()
        print("Finding the best hospitals...")
        print()

        results = recommend_hospitals(
            patient_latitude=latitude,
            patient_longitude=longitude,
            requested_specialty=specialty,
            requested_condition=condition
        )

        if len(results) == 0:

            print(
                "No hospitals were found within 100 km."
            )

        else:

            # ------------------------------------------------
            # SAVE RESULTS
            # ------------------------------------------------

            results.to_csv(
                "recommendation_results.csv",
                index=False
            )

            print()
            print("==================================================")
            print("              TOP 3 HOSPITALS")
            print("==================================================")
            print()

            for rank, (_, row) in enumerate(
                results.iterrows(),
                start=1
            ):

                print(
                    f"RANK {rank}"
                )

                print(
                    f"Hospital: {row['hospital_name']}"
                )

                print(
                    f"Location: "
                    f"{row['district']}, "
                    f"{row['state']}"
                )

                print(
                    f"Distance: "
                    f"{row['distance_km']:.2f} km"
                )

                print(
                    f"Specialties: "
                    f"{row['specialties']}"
                )

                print(
                    f"Specialty Match: "
                    f"{'YES' if row['specialty_match'] == 1 else 'NO'}"
                )

                print(
                    f"Beds: "
                    f"{int(row['total_beds'])}"
                )

                print(
                    f"Doctors: "
                    f"{int(row['number_doctor'])}"
                )

                print(
                    f"State Demand: "
                    f"{int(row['state_total_demand'])}"
                )

                print(
                    f"Condition Demand: "
                    f"{int(row['condition_demand'])}"
                )

                print(
                    f"Recommendation Score: "
                    f"{row['recommendation_score']:.4f}"
                )

                print(
                    "--------------------------------------------------"
                )

            print()
            print(
                "Results saved to:"
            )

            print(
                "recommendation_results.csv"
            )

    except ValueError:

        print()
        print(
            "ERROR: "
            "Latitude and longitude must be numbers."
        )

    except Exception as e:

        print()
        print("ERROR:")
        print(e)