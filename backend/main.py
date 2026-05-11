from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

import pandas as pd
import joblib

# -----------------------------
# LOAD MODEL
# -----------------------------

model = joblib.load("fraud_model.pkl")

MODEL_FEATURES = [
    "amount",
    "hour",
    "sender_tx_count",
    "receiver_tx_count",
    "large_transaction",
    "zero_amount",
    "night_transaction",
    "high_sender_activity",
    "repeated_target",
]

# -----------------------------
# FASTAPI APP
# -----------------------------

app = FastAPI()

# -----------------------------
# INPUT SCHEMA
# -----------------------------

class WalletFeatures(BaseModel):

    in_degree: int
    out_degree: int

    total_sent: float
    total_received: float

    avg_sent: float
    avg_received: float

    max_sent: float
    max_received: float

    tx_count: int

    unique_neighbors: int


def build_model_features(payload: dict[str, Any]) -> dict[str, float]:
    if all(feature_name in payload for feature_name in MODEL_FEATURES):
        return {
            feature_name: float(payload[feature_name])
            for feature_name in MODEL_FEATURES
        }

    try:
        legacy_features = WalletFeatures.model_validate(payload)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    total_volume = legacy_features.total_sent + legacy_features.total_received
    dominant_transaction = max(
        legacy_features.max_sent,
        legacy_features.max_received,
        legacy_features.avg_sent,
        legacy_features.avg_received,
    )

    return {
        "amount": float(total_volume),
        "hour": 0.0,
        "sender_tx_count": float(legacy_features.out_degree),
        "receiver_tx_count": float(legacy_features.in_degree),
        "large_transaction": float(
            dominant_transaction > 0
            and dominant_transaction >= max(1.0, legacy_features.avg_sent, legacy_features.avg_received)
        ),
        "zero_amount": float(total_volume == 0),
        "night_transaction": 0.0,
        "high_sender_activity": float(
            legacy_features.out_degree >= 10 or legacy_features.tx_count >= 10
        ),
        "repeated_target": float(
            legacy_features.unique_neighbors < legacy_features.tx_count
        ),
    }

# -----------------------------
# PREDICTION ENDPOINT
# -----------------------------

@app.post("/predict")
def predict(features: dict[str, Any]):
    model_features = build_model_features(features)

    input_df = pd.DataFrame([model_features], columns=MODEL_FEATURES)

    # Get probability first (it's more granular)
    # [0][1] gives the probability of the "Positive" class (Fraud)
    probability = float(model.predict_proba(input_df)[0][1])

    # Derive prediction from probability (usually > 0.5 is 1)
    prediction = 1 if probability >= 0.5 else 0

    # Risk logic
    if probability > 0.7:
        risk = "HIGH"
    elif probability > 0.3:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "prediction": prediction,
        "fraud_probability": round(probability, 4),
        "risk_level": risk
    }