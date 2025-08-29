# PhishBlocker API Dockerfile
FROM python:3.11-slim

LABEL maintainer="PhishBlocker Team"
LABEL description="PhishBlocker API - Real-time phishing detection service"

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV API_HOST=0.0.0.0
ENV API_PORT=8000

# Create app directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir numpy==2.3.2


# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/
COPY data/ ./data/
COPY models/ ./models/

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash phishblocker
RUN chown -R phishblocker:phishblocker /app
USER phishblocker

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$API_PORT/health || exit 1

# Expose port
EXPOSE $API_PORT

# Run the application
CMD ["python", "src/api/main.py"]
