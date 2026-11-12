from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class ModelMetadataOut(BaseModel):
    id: int
    model_name: str
    version: str
    algorithm: str
    training_date: datetime
    dataset: str
    features: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    metrics_json: Optional[str] = None

    class Config:
        from_attributes = True

class TrainRequest(BaseModel):
    sample_size: Optional[int] = 10000
    random_state: Optional[int] = 42

class TrainResponse(BaseModel):
    message: str
    anomaly_model: Dict[str, Any]
    classifier_model: Dict[str, Any]

class PredictRequest(BaseModel):
    features: Dict[str, Any]

class PredictResponse(BaseModel):
    anomaly_score: float
    is_anomaly: bool
    predicted_attack: str
    confidence: float
