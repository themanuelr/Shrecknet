FROM python:3.11-slim

WORKDIR /app

# Pre-copy and install only requirements first (leverages Docker cache)
COPY requirements.txt ./
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir chromadb==1.0.12

# Now copy the rest of your app (so code changes don't bust the cache above)
COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]