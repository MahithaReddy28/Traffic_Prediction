import os
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database.connection import engine, Base, SessionLocal
from backend.app.database.models import PreprocessingRun, ModelVersion

from backend.app.api.auth import router as auth_router
from backend.app.api.dataset import router as dataset_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.predict import router as predict_router
from backend.app.api.models_api import router as models_router
from backend.app.api.reports import router as reports_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Data-Driven Traffic Volume Prediction API",
    description="Smart City Traffic Analytics & ML Prediction Engine for I-94 Metro Interstate Corridor",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dataset_router)
app.include_router(analytics_router)
app.include_router(predict_router)
app.include_router(models_router)
app.include_router(reports_router)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Seed preprocessing runs DB table if empty
        stats_path = os.path.join("data", "processed", "cleaning_stats.json")
        if os.path.exists(stats_path) and db.query(PreprocessingRun).count() == 0:
            with open(stats_path, "r") as f:
                stats = json.load(f)
            run = PreprocessingRun(
                dataset_name=stats.get("dataset_name", "Metro Interstate Traffic Volume"),
                records_before=stats.get("rows_before", 48204),
                missing_values_before=json.dumps(stats.get("missing_before", {})),
                duplicates_removed=stats.get("duplicates_removed", 17),
                records_after=stats.get("rows_after", 48187)
            )
            db.add(run)

        # Seed model versions DB table if empty
        meta_path = os.path.join("backend", "models", "models_metadata.json")
        if os.path.exists(meta_path) and db.query(ModelVersion).count() == 0:
            with open(meta_path, "r") as f:
                meta = json.load(f)
            models_dict = meta.get("models", {})
            for name, m in models_dict.items():
                mv = ModelVersion(
                    model_name=name,
                    version="v1.0",
                    mae=m.get("mae", 0.0),
                    rmse=m.get("rmse", 0.0),
                    mape=m.get("mape", 0.0),
                    r2=m.get("r2", 0.0),
                    parameters=m.get("parameters", ""),
                    is_active=m.get("is_active", False)
                )
                db.add(mv)
        db.commit()
    except Exception as e:
        print("Startup database sync error:", e)
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Traffic Analytics & Prediction Engine",
        "dataset_connected": os.path.exists(os.path.join("data", "processed", "cleaned_traffic_data.csv")),
        "model_loaded": os.path.exists(os.path.join("backend", "models", "best_model.joblib"))
    }
