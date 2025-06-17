FROM python:3.11

WORKDIR /app

# Install dependencies
COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --upgrade pip setuptools wheel
RUN pip install  --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host=files.pythonhosted.org -r requirements.txt
RUN pip install chromadb==1.0.12


# Copy the backend code
COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
