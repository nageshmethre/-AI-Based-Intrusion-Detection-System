from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import pandas as pd

def build_feature_pipeline() -> Pipeline:
    """
    Constructs an scikit-learn preprocessing pipeline.
    Imputes any missing values with median and standardizes continuous features.
    """
    return Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
