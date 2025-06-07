from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    debug: bool = False
    allowed_origins: str = "*"
    openai_api_key: str | None = None
    open_ai_model:str | None = None

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()