from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Aegis-Quant"
    APP_ENV: str = "development"
    LOG_LEVEL: str = "INFO"
    API_V1_STR: str = "/api/v1"
    
    # Frontend / CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Supabase / Database
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    DATABASE_URL: str = "sqlite:///./aegis_quant.db"
    
    # AI Engine
    AI_PROVIDER: str = "mock"
    AI_API_KEY: Optional[str] = None
    AI_MODEL: str = "mock-v1"
    
    # Risk Engine Configuration Defaults
    DEFAULT_CURRENCY: str = "INR"
    
    # Risk weights
    WEIGHT_EXPLOITABILITY: float = 0.30
    WEIGHT_THREAT_ACTIVITY: float = 0.25
    WEIGHT_EXPOSURE: float = 0.20
    WEIGHT_VULN_SEVERITY: float = 0.15
    WEIGHT_HISTORICAL_INCIDENTS: float = 0.10
    
    # Impact weights
    WEIGHT_FINANCIAL_IMPACT: float = 0.30
    WEIGHT_DATA_SENSITIVITY: float = 0.25
    WEIGHT_BUSINESS_CRITICALITY: float = 0.20
    WEIGHT_REGULATORY_IMPACT: float = 0.15
    WEIGHT_AVAILABILITY_IMPACT: float = 0.10
    
    # Classification Thresholds
    THRESHOLD_LOW: float = 20.0
    THRESHOLD_MODERATE: float = 40.0
    THRESHOLD_HIGH: float = 60.0
    THRESHOLD_VERY_HIGH: float = 80.0
    # > 80.0 is Critical
    
    CALCULATION_VERSION: str = "v1"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
