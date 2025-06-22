FROM python:3.11-slim

WORKDIR /app

# Only copy requirements for pip install (enables Docker cache)
COPY requirements.txt .

# Leverage pip cache, upgrade pip and install deps
ENV PIP_CACHE_DIR=/tmp/pipcache
RUN pip install --upgrade pip \
    && pip install --cache-dir=$PIP_CACHE_DIR --no-cache-dir -r requirements.txt

# Now copy the rest of your code (doesn't bust the pip cache on rebuilds)
COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]