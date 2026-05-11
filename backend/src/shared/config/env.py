import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Platorin HUB"
    API_V1_STR: str = "/api/v1"
    
    API_URL: str = os.getenv("VITE_API_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    DB_URL: str = os.getenv("DATABASE_URL", "sqlite:///./hub.db")
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY")
    
    # Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 1 week

settings = Settings()
