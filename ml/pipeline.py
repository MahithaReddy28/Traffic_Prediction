import os
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error, r2_score

from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

RAW_DATA_PATH = os.path.join("data", "raw", "Metro_Interstate_Traffic_Volume.csv")
PROCESSED_DATA_PATH = os.path.join("data", "processed", "cleaned_traffic_data.csv")
STATS_PATH = os.path.join("data", "processed", "cleaning_stats.json")
MODELS_DIR = os.path.join("backend", "models")
BEST_MODEL_PATH = os.path.join(MODELS_DIR, "best_model.joblib")
MODEL_METRICS_PATH = os.path.join(MODELS_DIR, "models_metadata.json")

def run_data_cleaning():
    print("=== STEP 1: LOADING RAW DATASET ===")
    if not os.path.exists(RAW_DATA_PATH):
        raise FileNotFoundError(f"Raw data file not found at {RAW_DATA_PATH}")
        
    df_raw = pd.read_csv(RAW_DATA_PATH)
    rows_before = int(len(df_raw))
    cols_before = int(len(df_raw.columns))
    missing_before = df_raw.isnull().sum().to_dict()
    duplicates_count = int(df_raw.duplicated().sum())

    print(f"Raw Rows: {rows_before}, Raw Columns: {cols_before}")
    print(f"Duplicates Found: {duplicates_count}")
    print(f"Missing Values Before: {missing_before}")

    # Cleaning operations
    df_cleaned = df_raw.copy()
    
    # 1. Fill missing holiday values with 'No Holiday'
    df_cleaned['holiday'] = df_cleaned['holiday'].fillna('No Holiday')

    # 2. Drop duplicates
    df_cleaned = df_cleaned.drop_duplicates().reset_index(drop=True)
    
    rows_after = int(len(df_cleaned))
    cols_after = int(len(df_cleaned.columns))
    missing_after = df_cleaned.isnull().sum().to_dict()

    print(f"Rows After Cleaning: {rows_after} (Removed {rows_before - rows_after} duplicates)")

    # Save cleaned dataset
    os.makedirs(os.path.dirname(PROCESSED_DATA_PATH), exist_ok=True)
    df_cleaned.to_csv(PROCESSED_DATA_PATH, index=False)

    stats = {
        "dataset_name": "Metro Interstate Traffic Volume",
        "rows_before": rows_before,
        "cols_before": cols_before,
        "missing_before": missing_before,
        "duplicates_removed": duplicates_count,
        "rows_after": rows_after,
        "cols_after": cols_after,
        "missing_after": missing_after,
        "timestamp": datetime.now().isoformat()
    }

    with open(STATS_PATH, "w") as f:
        json.dump(stats, f, indent=2)

    return df_cleaned, stats

def perform_feature_engineering(df):
    print("=== STEP 2: DATE-TIME PARSING & FEATURE ENGINEERING ===")
    df = df.copy()

    # Parse date_time robustly
    df['date_time'] = pd.to_datetime(df['date_time'], format='mixed', errors='coerce')

    # Extract temporal features
    df['hour'] = df['date_time'].dt.hour
    df['day'] = df['date_time'].dt.day
    df['month'] = df['date_time'].dt.month
    df['weekday'] = df['date_time'].dt.weekday
    df['year'] = df['date_time'].dt.year
    df['day_of_year'] = df['date_time'].dt.dayofyear
    df['is_weekend'] = df['weekday'].apply(lambda x: 1 if x >= 5 else 0)

    # Configurable peak hour logic (Morning peak 7-9, Evening peak 16-18)
    df['is_peak_hour'] = df['hour'].apply(lambda h: 1 if (7 <= h <= 9 or 16 <= h <= 18) else 0)

    # Sort chronologically to avoid data leakage during split
    df = df.sort_values('date_time').reset_index(drop=True)

    return df

def train_and_evaluate_models(df):
    print("=== STEP 3: MODEL TRAINING & EVALUATION ===")
    
    categorical_features = ['holiday', 'weather_main']
    numeric_features = [
        'temp', 'rain_1h', 'snow_1h', 'clouds_all',
        'hour', 'day', 'month', 'weekday', 'year', 'day_of_year',
        'is_weekend', 'is_peak_hour'
    ]
    
    target = 'traffic_volume'
    
    feature_cols = categorical_features + numeric_features
    X = df[feature_cols]
    y = df[target]

    # Chronological Split (70% train, 15% val, 15% test)
    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    X_train, y_train = X.iloc[:train_end], y.iloc[:train_end]
    X_val, y_val = X.iloc[train_end:val_end], y.iloc[train_end:val_end]
    X_test, y_test = X.iloc[val_end:], y.iloc[val_end:]

    print(f"Train Set: {len(X_train)} | Val Set: {len(X_val)} | Test Set: {len(X_test)}")

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
            ('num', StandardScaler(), numeric_features)
        ]
    )

    models = {
        "Linear Regression": LinearRegression(),
        "Decision Tree": DecisionTreeRegressor(max_depth=12, random_state=42),
        "Random Forest": RandomForestRegressor(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1),
        "XGBoost": XGBRegressor(n_estimators=150, learning_rate=0.08, max_depth=7, random_state=42, n_jobs=-1)
    }

    results = {}
    fitted_pipelines = {}

    for name, model in models.items():
        print(f"Training model: {name}...")
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', model)
        ])

        start_time = datetime.now()
        pipeline.fit(X_train, y_train)
        training_time = (datetime.now() - start_time).total_seconds()

        # Predict on test set
        start_pred = datetime.now()
        y_pred = pipeline.predict(X_test)
        pred_latency_ms = ((datetime.now() - start_pred).total_seconds() / len(X_test)) * 1000

        # Calculate metrics
        mae = float(mean_absolute_error(y_test, y_pred))
        rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
        mape = float(mean_absolute_percentage_error(y_test, y_pred) * 100)
        r2 = float(r2_score(y_test, y_pred))

        results[name] = {
            "model_name": name,
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
            "r2": round(r2, 4),
            "training_time_sec": round(training_time, 2),
            "latency_ms": round(pred_latency_ms, 4),
            "parameters": str(model.get_params())
        }
        fitted_pipelines[name] = pipeline

        print(f" -> {name} | MAE: {mae:.2f} | RMSE: {rmse:.2f} | MAPE: {mape:.2f}% | R²: {r2:.4f}")

    # Select best model based on lowest MAE / highest R2
    best_model_name = max(results.keys(), key=lambda k: results[k]['r2'])
    print(f"\n★ BEST MODEL SELECTED: {best_model_name} (R² = {results[best_model_name]['r2']})")

    for k in results:
        results[k]["is_active"] = (k == best_model_name)

    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(fitted_pipelines[best_model_name], BEST_MODEL_PATH)
    print(f"Saved active model pipeline to {BEST_MODEL_PATH}")

    # Save metadata
    with open(MODEL_METRICS_PATH, "w") as f:
        json.dump({
            "best_model": best_model_name,
            "models": results,
            "categorical_features": categorical_features,
            "numeric_features": numeric_features,
            "trained_at": datetime.now().isoformat()
        }, f, indent=2)

    return results, fitted_pipelines[best_model_name]

def main():
    print("Starting ML Pipeline Execution...")
    df_cleaned, stats = run_data_cleaning()
    df_engineered = perform_feature_engineering(df_cleaned)
    results, best_pipeline = train_and_evaluate_models(df_engineered)
    print("ML Pipeline execution completed successfully!")

if __name__ == "__main__":
    main()
