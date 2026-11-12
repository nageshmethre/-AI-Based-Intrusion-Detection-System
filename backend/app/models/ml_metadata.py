from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from backend.app.database.session import Base

class ModelMetadata(Base):
    """Metadata and real evaluation metrics for trained ML models."""
    __tablename__ = "model_metadata"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), unique=True, index=True, nullable=False) # e.g. anomaly_isolation_forest, attack_classifier_rf
    version = Column(String(50), nullable=False, default="1.0.0")
    algorithm = Column(String(100), nullable=False)
    training_date = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    dataset = Column(String(200), nullable=False)
    features = Column(Text, nullable=False) # JSON list of feature names
    
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    metrics_json = Column(Text, nullable=True) # Full confusion matrix, classification report, threshold parameters
