import os
import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter(prefix="/api/dataset", tags=["dataset"])

PROCESSED_DATA_PATH = os.path.join("data", "processed", "cleaned_traffic_data.csv")
STATS_PATH = os.path.join("data", "processed", "cleaning_stats.json")

@router.get("/summary")
def get_dataset_summary():
    if not os.path.exists(STATS_PATH):
        raise HTTPException(status_code=404, detail="Dataset statistics not found. Please run preprocessing.")
    with open(STATS_PATH, "r") as f:
        stats = json.load(f)
    return {
        "success": True,
        "dataset_name": stats.get("dataset_name"),
        "total_records": stats.get("rows_after"),
        "total_features": stats.get("cols_after"),
        "target_variable": "traffic_volume",
        "primary_location": "I-94 Westbound, Minneapolis-St Paul, MN",
        "cleaning_summary": stats
    }

@router.get("/cleaning-summary")
def get_cleaning_summary():
    if not os.path.exists(STATS_PATH):
        raise HTTPException(status_code=404, detail="Data cleaning stats not found")
    with open(STATS_PATH, "r") as f:
        stats = json.load(f)

    return {
        "success": True,
        "before_cleaning": {
            "rows": stats.get("rows_before"),
            "columns": stats.get("cols_before"),
            "missing_values": stats.get("missing_before"),
            "duplicates": stats.get("duplicates_removed")
        },
        "after_cleaning": {
            "rows": stats.get("rows_after"),
            "columns": stats.get("cols_after"),
            "missing_values": stats.get("missing_after"),
            "duplicates": 0
        },
        "actions_taken": [
            f"Filled missing 'holiday' values (48,143 records) with 'No Holiday'",
            f"Identified and removed {stats.get('duplicates_removed')} exact duplicate rows",
            "Parsed date_time with robust format handling into temporal features",
            "Excluded redundant 'weather_description' column from model feature set"
        ]
    }

@router.get("/download-cleaned")
def download_cleaned_dataset():
    if not os.path.exists(PROCESSED_DATA_PATH):
        raise HTTPException(status_code=404, detail="Cleaned dataset file not available")
    return FileResponse(
        PROCESSED_DATA_PATH,
        media_type="text/csv",
        filename="Metro_Interstate_Traffic_Volume_Cleaned.csv"
    )
