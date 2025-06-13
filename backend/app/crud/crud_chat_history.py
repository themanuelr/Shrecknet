import json
import os
from pathlib import Path

from app.config import settings


def _history_path(user_id: int, agent_id: int) -> Path:
    base = settings.chat_history_dir.format(user_id=user_id)
    path = Path(base)
    path.mkdir(parents=True, exist_ok=True)
    return path / f"{agent_id}.json"


def load_history(user_id: int, agent_id: int) -> list[dict]:
    """Load chat history for a user and agent."""
    file_path = _history_path(user_id, agent_id)
    if file_path.is_file():
        try:
            with open(file_path, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_history(user_id: int, agent_id: int, messages: list[dict]) -> None:
    """Save chat history for a user and agent."""
    file_path = _history_path(user_id, agent_id)
    with open(file_path, "w") as f:
        json.dump(messages, f)


def clear_history(user_id: int, agent_id: int) -> None:
    """Delete chat history for a user and agent if it exists."""
    file_path = _history_path(user_id, agent_id)
    if file_path.is_file():
        try:
            file_path.unlink()
        except Exception:
            pass
