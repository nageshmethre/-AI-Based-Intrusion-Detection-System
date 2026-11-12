import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Suspicious Log Detector & Security Analytics Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./soc_platform.db"
    
    # JWT & Auth
    JWT_SECRET: str = "soc-cybersecurity-secret-key-change-in-production-2026-auth"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Detection Thresholds
    BRUTE_FORCE_THRESHOLD: int = 5          # 5 failed attempts
    BRUTE_FORCE_WINDOW_MINUTES: int = 5     # in 5 minutes
    PORT_SCAN_PORT_THRESHOLD: int = 5       # 5 distinct ports
    PORT_SCAN_WINDOW_MINUTES: int = 2       # in 2 minutes
    EXCESSIVE_REQUESTS_THRESHOLD: int = 60  # 60 requests
    EXCESSIVE_REQUESTS_WINDOW_MINUTES: int = 1
    HIGH_DATA_TRANSFER_BYTES: int = 10 * 1024 * 1024  # 10 MB
    ANOMALY_THRESHOLD: float = 65.0         # 0-100 scale
    
    # Ingestion limits
    UPLOAD_MAX_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: List[str] = [".log", ".txt", ".csv", ".json"]
    
    # Working Hours (Local Time 09:00 - 18:00)
    WORK_HOUR_START: int = 9
    WORK_HOUR_END: int = 18

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
