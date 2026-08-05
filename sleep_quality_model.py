"""
Sleep Environment Monitor - Machine Learning Model
----------------------------------------------------
Predicts whether a user slept well (yes/no) based on overnight
environmental sensor averages: temperature, humidity, CO2, light, and noise.

Uses a Random Forest Classifier, and reports which sensor factors
most strongly influence sleep quality (feature importance).

Expected input CSV format (one row per night):
    date,temperature,humidity,co2,light,noise,slept_well
    2026-07-25,21.3,45,850,2,340,yes
    2026-07-26,23.8,52,1400,15,410,no
    ...

- temperature: average overnight temp (C)
- humidity: average overnight relative humidity (%)
- co2: average overnight CO2 (ppm)
- light: average overnight light level (lux)
- noise: average overnight sound level (raw ADC or dB, whatever your sensor reports)
- slept_well: user's answer to "Did you sleep well?" -> "yes" or "no"
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import joblib

# ----------------------------------------------------------------------
# CONFIG - update this path to point at your aggregated nightly CSV
# ----------------------------------------------------------------------
DATA_PATH = "nightly_summary.csv"
MODEL_OUTPUT_PATH = "sleep_quality_rf_model.joblib"

FEATURE_COLUMNS = ["temperature", "humidity", "co2", "light", "noise"]
TARGET_COLUMN = "slept_well"


def load_data(path: str) -> pd.DataFrame:
    """Load and lightly validate the nightly summary dataset."""
    df = pd.read_csv(path)

    missing_cols = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing expected columns in CSV: {missing_cols}")

    # Drop any nights with missing sensor readings or missing survey response
    before = len(df)
    df = df.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN])
    after = len(df)
    if before != after:
        print(f"Dropped {before - after} incomplete night(s) with missing data.")

    return df


def train_model(df: pd.DataFrame):
    """Train a Random Forest classifier and return the fitted model + encoder."""
    X = df[FEATURE_COLUMNS]

    # Encode "yes"/"no" as 1/0 for the model
    encoder = LabelEncoder()
    y = encoder.fit_transform(df[TARGET_COLUMN])

    if len(df) < 15:
        print(
            f"\nWarning: only {len(df)} nights of data available. "
            "Random Forest results (especially feature importance) will be unstable "
            "until more nights are collected. Treat results as preliminary.\n"
        )

    # Hold out 20% of nights to test how well the model generalizes
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if len(set(y)) > 1 else None
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=5,          # keeps trees shallow to reduce overfitting on small data
        min_samples_leaf=2,
        random_state=42,
        class_weight="balanced",  # helps if "yes"/"no" nights are unevenly split
    )
    model.fit(X_train, y_train)

    # Evaluate on held-out nights
    y_pred = model.predict(X_test)
    print("=== Test Set Performance ===")
    print(f"Accuracy: {accuracy_score(y_test, y_pred):.2f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=encoder.classes_))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Cross-validation gives a more reliable accuracy estimate on small datasets
    # than a single train/test split
    if len(df) >= 10:
        cv_folds = min(5, len(df) // 3)
        if cv_folds >= 2:
            cv_scores = cross_val_score(model, X, y, cv=cv_folds)
            print(f"\n{cv_folds}-Fold Cross-Validation Accuracy: "
                  f"{cv_scores.mean():.2f} (+/- {cv_scores.std():.2f})")

    return model, encoder


def report_feature_importance(model, feature_names):
    """Print and return which sensor factors most influenced predictions."""
    importances = pd.Series(model.feature_importances_, index=feature_names)
    importances = importances.sort_values(ascending=False)

    print("\n=== Feature Importance (which factors matter most) ===")
    for feature, score in importances.items():
        bar = "#" * int(score * 50)
        print(f"{feature:12s} {score:.3f}  {bar}")

    return importances


def predict_new_night(model, encoder, temperature, humidity, co2, light, noise):
    """Predict sleep quality for a single new night's readings."""
    new_data = pd.DataFrame([{
        "temperature": temperature,
        "humidity": humidity,
        "co2": co2,
        "light": light,
        "noise": noise,
    }])
    prediction = model.predict(new_data)
    probability = model.predict_proba(new_data)

    predicted_label = encoder.inverse_transform(prediction)[0]
    confidence = probability.max()

    print(f"\nPredicted sleep quality: '{predicted_label}' "
          f"(confidence: {confidence:.0%})")
    return predicted_label, confidence


def main():
    print(f"Loading data from {DATA_PATH}...")
    df = load_data(DATA_PATH)
    print(f"Loaded {len(df)} nights of data.\n")

    model, encoder = train_model(df)
    report_feature_importance(model, FEATURE_COLUMNS)

    # Save the trained model so it can be reused without retraining every time
    joblib.dump({"model": model, "encoder": encoder}, MODEL_OUTPUT_PATH)
    print(f"\nModel saved to {MODEL_OUTPUT_PATH}")

    # Example: predict on a hypothetical new night's average readings
    # Replace these values with real data from your latest night's log
    predict_new_night(
        model, encoder,
        temperature=24.5, humidity=40, co2=1600, light=8, noise=380
    )


if __name__ == "__main__":
    main()
