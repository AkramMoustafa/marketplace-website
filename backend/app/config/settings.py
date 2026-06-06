from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "Car Marketplace API"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # Database
    SQL_DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/marketplace_db"
    SQL_DATABASE_URL_SYNC: str = "postgresql+psycopg2://postgres:password@localhost:5432/marketplace_db"

    # JWT
    SECRET_KEY: str = "change-this-secret-key-in-production-must-be-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Upload
    UPLOAD_DIR: str = "app/uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # AI
    OPENAI_API_KEY: str = ""

    # eBay Marketplace
    EBAY_MOCK_MODE: bool = True
    EBAY_CLIENT_ID: str = ""
    EBAY_CLIENT_SECRET: str = ""
    EBAY_DEV_ID: str = ""
    EBAY_REDIRECT_URI: str = ""
    EBAY_ENVIRONMENT: str = "sandbox"  # "sandbox" | "production"
    EBAY_MARKETPLACE_ID: str = "EBAY_US"
    # OAuth token lifecycle — prefer refresh token over static access token
    # Long-lived refresh token from Authorization Code flow (never expires, survives restarts)
    EBAY_REFRESH_TOKEN: str = ""
    # Optional pre-seeded access token — seeds in-memory cache on startup
    EBAY_ACCESS_TOKEN: str = ""
    # Unix timestamp (float as string) of EBAY_ACCESS_TOKEN expiry — e.g. "1703012345.0"
    EBAY_TOKEN_EXPIRES_AT: str = ""
    # Legacy static access token — used only when EBAY_REFRESH_TOKEN is not set
    # Expires every 2 hours and must be replaced manually
    EBAY_USER_TOKEN: str = ""
    # Business policy IDs — auto-fetched from Account API if left empty
    EBAY_FULFILLMENT_POLICY_ID: str = ""
    EBAY_PAYMENT_POLICY_ID: str = ""
    EBAY_RETURN_POLICY_ID: str = ""

    # Seed
    ADMIN_EMAIL: str = "admin@marketplace.com"
    ADMIN_PASSWORD: str = "Admin123!"
    ADMIN_NAME: str = "Admin"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
