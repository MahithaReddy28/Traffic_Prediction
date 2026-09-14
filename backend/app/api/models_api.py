import os
import json
from fastapi import APIRouter, HTTPException, BackgroundTasks
from backend.app.database.connection import get_db

router = APIRouter(prefix="/api/models", tags=["models"])

METADATA_PATH = os.path.join("backend", "models", "models_metadata.json")

@router.get("")
def list_models():
    if not os.path.exists(METADATA_PATH):
        raise HTTPException(status_code=404, detail="Model metadata not found. Please train models first.")
    with open(METADATA_PATH, "r") as f:
        meta = json.load(f)
    return {
        "success": True,
        "best_model": meta.get("best_model"),
        "trained_at": meta.get("trained_at"),
        "models": list(meta.get("models", {}).values())
    }

@router.get("/active")
def get_active_model():
    if not os.path.exists(METADATA_PATH):
        raise HTTPException(status_code=404, detail="Model metadata not found")
    with open(METADATA_PATH, "r") as f:
        meta = json.load(f)
    best = meta.get("best_model")
    models = meta.get("models", {})
    active_data = models.get(best, {})
    return {
        "success": True,
        "active_model": active_data
    }

@router.post("/train")
def trigger_retraining(background_tasks: BackgroundTasks):
    from ml.pipeline import main as run_pipeline
    background_tasks.add_task(run_pipeline)
    return {
        "success": True,
        "message": "Model retraining pipeline triggered asynchronously. Results will update in registry once complete."
    }
