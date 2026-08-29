import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

# Load data
df = pd.read_csv("training_data.csv")

# Features
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

target = "synthetic_heuristic_target"

# Split by request_id
request_ids = df["request_id"].unique()

train_requests, test_requests = train_test_split(
    request_ids,
    test_size=0.20,
    random_state=42
)

train_df = df[df["request_id"].isin(train_requests)]
test_df = df[df["request_id"].isin(test_requests)]

X_train = train_df[features]
y_train = train_df[target]

X_test = test_df[features]
y_test = test_df[target]

# Create XGBoost model
model = XGBRegressor(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    random_state=42
)

# Train
model.fit(X_train, y_train)
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

# Make predictions
predictions = model.predict(X_test)

# Calculate metrics
mae = mean_absolute_error(y_test, predictions)
rmse = np.sqrt(mean_squared_error(y_test, predictions))
r2 = r2_score(y_test, predictions)

print("\n===== MODEL EVALUATION =====")
print("MAE :", round(mae, 4))
print("RMSE:", round(rmse, 4))
print("R2  :", round(r2, 4))

print("Model training completed!")
print("Training rows:", len(X_train))
print("Testing rows:", len(X_test))
# ==========================================
# RANKING EVALUATION
# ==========================================

test_results = test_df.copy()

# Add model predictions
test_results["predicted_score"] = predictions

# Calculate ranking performance
top1_correct = 0
top3_correct = 0
total_requests = 0

for request_id, group in test_results.groupby("request_id"):

    # Hospital with highest actual heuristic score
    actual_best = group.loc[
        group["synthetic_heuristic_target"].idxmax(),
        "hospital_id"
    ]

    # Hospitals ranked by model prediction
    ranked = group.sort_values(
        "predicted_score",
        ascending=False
    )

    predicted_top1 = ranked.iloc[0]["hospital_id"]
    predicted_top3 = ranked.head(3)["hospital_id"].values

    if predicted_top1 == actual_best:
        top1_correct += 1

    if actual_best in predicted_top3:
        top3_correct += 1

    total_requests += 1


top1_accuracy = top1_correct / total_requests
top3_accuracy = top3_correct / total_requests

print("\n===== RANKING EVALUATION =====")
print("Total test requests:", total_requests)
print("Top-1 Accuracy:", round(top1_accuracy, 4))
print("Top-3 Accuracy:", round(top3_accuracy, 4))
# ==========================================
# SAVE MODEL
# ==========================================

model.save_model("hospital_recommendation_model.json")

print("\nModel saved successfully!")
print("File: hospital_recommendation_model.json")