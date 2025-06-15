from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///:memory:"
    secret_key: str = "secret"
    debug: bool = False
    allowed_origins: str = "*"
    openai_api_key: str | None = None
    open_ai_model:str | None = None
    vector_db_path: str = "./data/vector_db"
    chat_history_dir: str = "./data/chat/{user_id}"
    bulk_job_dir: str = "./data/bulk_jobs"
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()