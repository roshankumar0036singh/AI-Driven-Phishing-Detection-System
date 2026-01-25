# 🐳 Docker Deployment Guide

This guide details how to deploy PhishBlocker using Docker and Docker Compose.

## Prerequisites

- **Docker Desktop** (latest version)
- **Git**

## Quick Start (Development)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/roshankumar0036singh/AI-Driven-Phishing-Detection-System.git
    cd AI-Driven-Phishing-Detection-System
    ```

2.  **Set up Environment Variables:**
    ```bash
    cp .env.example .env
    # Open .env and add your GEMINI_API_KEY
    ```

3.  **Start Services:**
    ```bash
    docker-compose up --build
    ```

    This will start:
    - **API**: `http://localhost:8000`
    - **Frontend**: `http://localhost:3000`
    - **PostgreSQL**: `localhost:5432`
    - **Redis**: `localhost:6379`

## Production Deployment

For production, use the `production` profile which may include Nginx or optimized configurations.

```bash
docker-compose --profile production up -d --build
```

## Troubleshooting

### Database Connection Failed
If the API cannot connect to the database, try resetting the volume:
```bash
docker-compose down -v
docker-compose up -d
```

### Port Conflicts
If port 8000 or 3000 is in use, modify the `docker-compose.yml` `ports` section:
```yaml
ports:
  - "8080:8000" # Maps localhost:8080 to container:8000
```
