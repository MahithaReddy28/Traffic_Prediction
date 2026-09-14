import os
import json
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

PROCESSED_DATA_PATH = os.path.join("data", "processed", "cleaned_traffic_data.csv")
MODEL_METRICS_PATH = os.path.join("backend", "models", "models_metadata.json")

def load_data():
    if not os.path.exists(PROCESSED_DATA_PATH):
        raise HTTPException(status_code=404, detail="Cleaned dataset not found")
    df = pd.read_csv(PROCESSED_DATA_PATH)
    df['date_time'] = pd.to_datetime(df['date_time'], format='mixed', errors='coerce')
    df['hour'] = df['date_time'].dt.hour
    df['weekday'] = df['date_time'].dt.weekday
    df['month'] = df['date_time'].dt.month
    df['year'] = df['date_time'].dt.year
    return df

@router.get("/traffic-overview")
def get_traffic_overview():
    df = load_data()
    return {
        "success": True,
        "total_records": len(df),
        "avg_volume": round(float(df['traffic_volume'].mean()), 2),
        "min_volume": int(df['traffic_volume'].min()),
        "max_volume": int(df['traffic_volume'].max()),
        "peak_hour": int(df.groupby('hour')['traffic_volume'].mean().idxmax()),
        "peak_weekday": int(df.groupby('weekday')['traffic_volume'].mean().idxmax()),
        "latest_record": {
            "date_time": str(df['date_time'].iloc[-1]),
            "traffic_volume": int(df['traffic_volume'].iloc[-1]),
            "temp": round(float(df['temp'].iloc[-1]) - 273.15, 1), # convert K to C
            "weather_main": str(df['weather_main'].iloc[-1])
        }
    }

@router.get("/hourly")
def get_hourly_analytics():
    df = load_data()
    grouped = df.groupby('hour')['traffic_volume'].agg(['mean', 'min', 'max']).reset_index()
    data = [
        {
            "hour": int(row['hour']),
            "label": f"{int(row['hour']):02d}:00",
            "avg_volume": round(float(row['mean']), 2),
            "min_volume": int(row['min']),
            "max_volume": int(row['max'])
        }
        for _, row in grouped.iterrows()
    ]
    return {"success": True, "data": data}

@router.get("/weekday")
def get_weekday_analytics():
    df = load_data()
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    grouped = df.groupby('weekday')['traffic_volume'].mean().reset_index()
    data = [
        {
            "weekday": int(row['weekday']),
            "day_name": days[int(row['weekday'])],
            "avg_volume": round(float(row['traffic_volume']), 2)
        }
        for _, row in grouped.iterrows()
    ]
    return {"success": True, "data": data}

@router.get("/monthly")
def get_monthly_analytics():
    df = load_data()
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    grouped = df.groupby('month')['traffic_volume'].mean().reset_index()
    data = [
        {
            "month": int(row['month']),
            "month_name": months[int(row['month']) - 1],
            "avg_volume": round(float(row['traffic_volume']), 2)
        }
        for _, row in grouped.iterrows()
    ]
    return {"success": True, "data": data}

@router.get("/weather")
def get_weather_analytics():
    df = load_data()
    grouped = df.groupby('weather_main')['traffic_volume'].agg(['mean', 'count']).reset_index()
    data = [
        {
            "weather_main": str(row['weather_main']),
            "avg_volume": round(float(row['mean']), 2),
            "record_count": int(row['count'])
        }
        for _, row in grouped.iterrows()
    ]
    return {"success": True, "data": data}

@router.get("/correlation")
def get_correlation_matrix():
    df = load_data()
    numeric_cols = ['temp', 'rain_1h', 'snow_1h', 'clouds_all', 'hour', 'weekday', 'month', 'traffic_volume']
    corr = df[numeric_cols].corr().round(3)
    
    matrix = []
    cols = corr.columns.tolist()
    for col1 in cols:
        row_vals = {}
        for col2 in cols:
            row_vals[col2] = float(corr.loc[col1, col2])
        matrix.append({"feature": col1, "correlations": row_vals})

    return {"success": True, "features": cols, "matrix": matrix}

@router.get("/actual-vs-predicted")
def get_actual_vs_predicted():
    # Sample last 100 rows from test set for chart representation
    df = load_data()
    sample_df = df.tail(100).copy()
    
    import joblib
    model_path = os.path.join("backend", "models", "best_model.joblib")
    if not os.path.exists(model_path):
        raise HTTPException(status_code=404, detail="Model pipeline not trained yet")
    
    pipeline = joblib.load(model_path)
    
    # Feature engineering for evaluation test sample
    sample_df['day'] = sample_df['date_time'].dt.day
    sample_df['month'] = sample_df['date_time'].dt.month
    sample_df['weekday'] = sample_df['date_time'].dt.weekday
    sample_df['year'] = sample_df['date_time'].dt.year
    sample_df['day_of_year'] = sample_df['date_time'].dt.dayofyear
    sample_df['is_weekend'] = sample_df['weekday'].apply(lambda x: 1 if x >= 5 else 0)
    sample_df['is_peak_hour'] = sample_df['hour'].apply(lambda h: 1 if (7 <= h <= 9 or 16 <= h <= 18) else 0)

    feature_cols = [
        'holiday', 'weather_main', 'temp', 'rain_1h', 'snow_1h', 'clouds_all',
        'hour', 'day', 'month', 'weekday', 'year', 'day_of_year',
        'is_weekend', 'is_peak_hour'
    ]
    
    preds = pipeline.predict(sample_df[feature_cols])

    comparison = []
    for idx, (_, row) in enumerate(sample_df.iterrows()):
        act = float(row['traffic_volume'])
        pred = round(float(preds[idx]), 2)
        residual = round(act - pred, 2)
        comparison.append({
            "index": idx + 1,
            "date_time": str(row['date_time']),
            "actual": act,
            "predicted": max(0.0, pred),
            "residual": residual
        })

    return {"success": True, "comparison": comparison}
