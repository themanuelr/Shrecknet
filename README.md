# Shrecknet

## Background task worker

Cross-link generation is now handled by a Celery worker. To run the worker:

```bash
cd backend
celery -A app.task_queue.celery_app worker --loglevel=info
```

Ensure a Redis instance is available and configure `CELERY_BROKER_URL` if needed.

### Chat history

Chats with agents are stored on disk. Configure the location with the
`CHAT_HISTORY_DIR` environment variable. The default value is
`./data/chat/{user_id}` and the `{user_id}` placeholder will be replaced with
the authenticated user's ID. Each agent's history is saved in a JSON file named
`<agent_id>.json` containing the last 20 messages.

# Quick Start - Docker App

1. Install Docker Desktop for Windows from https://www.docker.com/products/docker-desktop
2. Unzip this file to a folder (e.g., C:\myapp)
3. Open Docker Desktop and wait until it is running
4. Open this folder, right-click, and choose 'Open in Terminal'
5. Type: docker compose up --build
6. Wait until it says 'Ready'
7. Visit http://localhost:3000 (frontend) and http://localhost:8000 (backend)

To stop: Press Ctrl+C in the terminal, or run: docker compose down

Enjoy!