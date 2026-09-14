import os
import json
import joblib
import pandas as pd
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.database.models import Prediction, User
from backend.app.api.auth import get_current_user

router = APIRouter(prefix="/api/predict", tags=["prediction"])

MODEL_PATH = os.path.join("backend", "models", "best_model.joblib")
METADATA_PATH = os.path.join("backend", "models", "models_metadata.json")

class PredictionInput(BaseModel):
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    temperature: float # Kelvin or Celsius (if < 100 assumed Celsius and converted to K)
    rain_1h: float = 0.0
    snow_1h: float = 0.0
    clouds_all: float = 0.0
    weather_main: str = "Clouds"
    holiday: str = "No Holiday"

def derive_traffic_level(volume: float) -> str:
    if volume < 1500:
        return "Low"
    elif volume < 3500:
        return "Moderate"
    elif volume < 5500:
        return "High"
    else:
        return "Severe"

def get_recommendation(level: str, holiday: str = "No Holiday") -> str:
    indian_holidays_map = {
        "Saturday (Weekend)": "Saturday Weekend Traffic. Reduced corporate office commuting, but heavy evening leisure traffic around commercial retail zones, shopping malls, multiplexes, and dining hubs.",
        "Sunday (Weekend)": "Sunday Weekend Traffic. Overall lowest corporate commuting flow of the week. Heavy evening return commute along inter-city highway toll plazas and transit hubs.",
        "Weekend / Long Weekend": "Long Weekend Traffic Event. Significant surge in inter-city highway volume with high outbound traffic on Friday evening / Saturday morning, and heavy city entry congestion on Sunday evening.",
        "Republic Day (Jan 26)": "Republic Day national holiday. Ceremonial parades in major city centers; expect road closures near government zones and reduced corporate commuter traffic.",
        "Independence Day (Aug 15)": "Independence Day national holiday. Increased security checkpoints and ceremonial road diversions; lighter routine office commuter flow.",
        "Gandhi Jayanti (Oct 2)": "Gandhi Jayanti national holiday. Standard commercial closures with steady inter-city highway travel.",
        "Diwali / Deepavali": "Diwali Festival peak congestion! Extremely heavy traffic near commercial markets, shopping hubs, and transit terminals. Allow 30-45 mins extra travel time.",
        "Holi": "Holi Festival of Colors. High daytime road activity and erratic traffic patterns near residential and market zones. Caution advised.",
        "Ganesh Chaturthi": "Ganesh Chaturthi festival. Street processions and road blockages near major pandals and water bodies. Avoid city center arterial roads.",
        "Durga Puja / Dussehra": "Durga Puja & Vijayadashami celebrations. Very high festive evening traffic around puja pandals, street food hubs, and commercial districts.",
        "Eid ul-Fitr / Eid al-Adha": "Eid celebrations. Heavy morning and evening traffic near major prayer grounds, mosques, and commercial markets.",
        "Makar Sankranti / Pongal": "Makar Sankranti / Pongal harvest festival. Heavy inter-city highway travel as commuters travel to home towns.",
        "Raksha Bandhan": "Raksha Bandhan festival. High intra-city road congestion, especially around sweet shops, gift markets, and residential corridors.",
        "Janmashtami": "Janmashtami festivities. Night-time temple traffic and dahi-handi event diversions across major urban centers.",
        "Ram Navami": "Ram Navami processions. Intermittent road blockages along major temple routes.",
        "Mahashivratri": "Mahashivratri festival. High temple-bound traffic during early morning and late night hours.",
        "Chhath Puja": "Chhath Puja celebrations. Heavy congestion along riverbanks, lakes, and water bodies during sunrise and sunset hours.",
        "Guru Nanak Jayanti": "Guru Nanak Jayanti. Processions near Gurudwaras; moderate city center traffic.",
        "Mahavir Jayanti": "Mahavir Jayanti. Lighter corporate traffic with localized gathering spots.",
        "Good Friday": "Good Friday public holiday. Lighter commuter rush; steady weekend getaway highway traffic.",
        "Christmas Day": "Christmas Day holiday. Lighter corporate traffic; high evening leisure traffic near malls and illuminated avenues.",
        "New Year's Day": "New Year's Day. High late-night traffic density and police checkpoint slowdowns near nightlife corridors.",
        "Onam": "Onam harvest festival. High festive movement and cultural procession diversions.",
        "Ugadi / Gudi Padwa": "Ugadi / Gudi Padwa New Year. Moderate morning festive traffic near markets and residential centers.",
        "Baisakhi / Vishu": "Baisakhi / Vishu harvest New Year. High agricultural and festival market activity."
    }

    if holiday in indian_holidays_map:
        return indian_holidays_map[holiday]

    recommendations = {
        "Low": "Traffic conditions are expected to be light. Standard travel speeds anticipated.",
        "Moderate": "Moderate traffic is expected. Allow additional 10-15 minutes of travel time.",
        "High": "High traffic density expected. Consider traveling outside peak periods or utilizing highway express lanes.",
        "Severe": "Severe congestion expected. Consider delaying travel, taking alternative arterial routes, or using public transit."
    }
    return recommendations.get(level, "Drive safely and monitor local road updates.")

@router.post("")
def predict_traffic(input_data: PredictionInput, user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(status_code=500, detail="ML model file not found. Please train the model first.")

    # Convert temperature if in Celsius
    temp_k = input_data.temperature
    if temp_k < 150.0: # Celsius provided
        temp_k = temp_k + 273.15

    # Parse date and time
    dt_str = f"{input_data.date} {input_data.time}"
    try:
        dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M")
    except ValueError:
        try:
            dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date or time format. Expected YYYY-MM-DD and HH:MM.")

    hour = dt.hour
    day = dt.day
    month = dt.month
    weekday = dt.weekday()
    year = dt.year
    day_of_year = dt.timetuple().tm_yday
    is_weekend = 1 if weekday >= 5 else 0
    is_peak_hour = 1 if (7 <= hour <= 9 or 16 <= hour <= 18) else 0

    df_input = pd.DataFrame([{
        'holiday': input_data.holiday,
        'weather_main': input_data.weather_main,
        'temp': temp_k,
        'rain_1h': input_data.rain_1h,
        'snow_1h': input_data.snow_1h,
        'clouds_all': input_data.clouds_all,
        'hour': hour,
        'day': day,
        'month': month,
        'weekday': weekday,
        'year': year,
        'day_of_year': day_of_year,
        'is_weekend': is_weekend,
        'is_peak_hour': is_peak_hour
    }])

    # Load model and run inference
    pipeline = joblib.load(MODEL_PATH)
    raw_pred = pipeline.predict(df_input)[0]
    predicted_volume = max(0.0, round(float(raw_pred), 1))
    traffic_level = derive_traffic_level(predicted_volume)
    rec = get_recommendation(traffic_level, input_data.holiday)

    # Get model metadata
    model_name = "XGBoost"
    model_version = "v1.0"
    if os.path.exists(METADATA_PATH):
        with open(METADATA_PATH, "r") as f:
            meta = json.load(f)
            model_name = meta.get("best_model", "XGBoost")

    # Save prediction to DB
    db_prediction = Prediction(
        user_id=user.id if user else None,
        model_version=f"{model_name} {model_version}",
        input_features=json.dumps(input_data.dict()),
        predicted_volume=predicted_volume,
        traffic_level=traffic_level,
        recommendation=rec
    )
    db.add(db_prediction)
    db.commit()

    return {
        "success": True,
        "predicted_volume": predicted_volume,
        "traffic_level": traffic_level,
        "recommendation": rec,
        "model_used": model_name,
        "model_version": model_version,
        "derived_features": {
            "hour": hour,
            "day": day,
            "month": month,
            "weekday": weekday,
            "year": year,
            "is_weekend": bool(is_weekend),
            "is_peak_hour": bool(is_peak_hour)
        }
    }

@router.get("/history")
def get_prediction_history(user: Optional[User] = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Prediction)
    if user:
        query = query.filter(Prediction.user_id == user.id)
    history = query.order_by(Prediction.created_at.desc()).limit(20).all()
    
    return {
        "success": True,
        "history": [
            {
                "id": item.id,
                "model_version": item.model_version,
                "input_features": json.loads(item.input_features),
                "predicted_volume": item.predicted_volume,
                "traffic_level": item.traffic_level,
                "created_at": item.created_at.isoformat()
            }
            for item in history
        ]
    }
