import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Callio API"
    DATABASE_URL: str = "postgresql://neondb_owner:npg_6JNlX8IZfGHz@ep-jolly-dust-b5x4aw3u-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require"
    JWT_SECRET: str = "callio_secret_jwt_key_super_secure_production_2026_change_me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,https://callio-frontend.onrender.com"
    
    STUN_SERVER: str = "stun:stun.l.google.com:19302"
    TURN_SERVER: str = ""
    TURN_USERNAME: str = ""
    TURN_PASSWORD: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
