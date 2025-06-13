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
