from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.models.ml_metadata import ModelMetadata
from backend.app.schemas.ml import ModelMetadataOut, TrainRequest, TrainResponse, PredictRequest, PredictResponse
from backend.app.api.deps import require_admin, require_viewer
from backend.app.models.user import User
from ml.predict import ml_predictor
from ml.training.train import train_models
from ml.evaluation.evaluate import evaluate_models

router = APIRouter(prefix="/ml", tags=["Machine Learning Pipeline"])

@router.get("/models", response_model=List[ModelMetadataOut])
def get_model_metadata(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_viewer)
):
    """Retrieve actual evaluation metrics and metadata for active ML models."""
    return db.query(ModelMetadata).order_by(ModelMetadata.id).all()

@router.post("/train", response_model=TrainResponse)
def trigger_training(
    train_req: TrainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Retrain Isolation Forest and Random Forest classifiers (Admin only)."""
    train_res = train_models()
    eval_res = evaluate_models()

    # Reload inference engine models
    ml_predictor._load_models()

    return {
        "message": f"Successfully retrained ML models on {train_res['train_samples']} samples and evaluated on {train_res['test_samples']} samples.",
        "anomaly_model": eval_res["anomaly_detector"],
        "classifier_model": eval_res["attack_classifier"]
    }

@router.post("/predict", response_model=PredictResponse)
def test_predict(
    pred_req: PredictRequest,
    current_user: User = Depends(require_viewer)
):
    """Run real-time ML inference on a supplied feature dictionary."""
    result = ml_predictor.predict(pred_req.features)
    return result
