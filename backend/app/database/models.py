from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    language = Column(String(10), default="en")
    theme = Column(String(10), default="dark")
    location_permission = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    predictions = relationship("Prediction", back_populates="user")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    model_version = Column(String(50), nullable=False)
    input_features = Column(Text, nullable=False)
    predicted_volume = Column(Float, nullable=False)
    traffic_level = Column(String(20), nullable=False)
    recommendation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    version = Column(String(50), nullable=False)
    dataset_version = Column(String(50), default="v1.0")
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    mape = Column(Float, nullable=False)
    r2 = Column(Float, nullable=False)
    parameters = Column(Text, nullable=True)
    is_active = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class PreprocessingRun(Base):
    __tablename__ = "preprocessing_runs"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(100), nullable=False)
    records_before = Column(Integer, nullable=False)
    missing_values_before = Column(Text, nullable=False)
    duplicates_removed = Column(Integer, nullable=False)
    records_after = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
