# PhishBlocker Deployment Guide

This guide covers deploying PhishBlocker in various environments from development to production.

## Table of Contents
1. [Development Deployment](#development-deployment)
2. [Production Deployment](#production-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Monitoring & Maintenance](#monitoring--maintenance)

## Development Deployment

### Local Development

1. **Clone and Setup**
   ```bash
   git clone https://github.com/roshankumar0036singh/AI-Driven-Phishing-Detection-System.git
   cd AI-Driven-Phishing-Detection-System

   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows

   # Install dependencies
   pip install -r requirements.txt
   ```

2. **Start Services**
   ```bash
   # Option 1: Docker Compose (Recommended)
   docker-compose up -d

   # Option 2: Manual startup
   # Start Redis
   redis-server

   # Start PostgreSQL
   pg_ctl -D /usr/local/var/postgres start

   # Start API
   cd src/api && python main.py
   ```

3. **Verify Installation**
   ```bash
   curl http://localhost:8000/health
   ```

### Development with Docker

```bash
# Build development image
docker build -t phishblocker:dev -f Dockerfile.dev .

# Run development stack
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f phishblocker-api
```

## Production Deployment

### Prerequisites

- Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- Docker 20.10+
- Docker Compose 1.29+
- 4GB+ RAM
- 20GB+ storage
- SSL certificates (for HTTPS)

### Production Setup

1. **System Preparation**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Application Deployment**
   ```bash
   # Create application directory
   sudo mkdir -p /opt/AI-Driven-Phishing-Detection-System
   cd /opt/AI-Driven-Phishing-Detection-System

   # Clone repository
   git clone https://github.com/roshankumar0036singh/AI-Driven-Phishing-Detection-System.git .

   # Create environment file
   cp .env.example .env
   # Edit .env with production values
   ```

3. **Environment Configuration**
   ```bash
   # .env file example
   ENVIRONMENT=production
   API_HOST=0.0.0.0
   API_PORT=8000

   # Database
   POSTGRES_DB=phishblocker
   POSTGRES_USER=phishblocker
   POSTGRES_PASSWORD=secure_random_password

   # Redis
   REDIS_PASSWORD=another_secure_password

   # SSL
   SSL_CERT_PATH=/etc/ssl/certs/phishblocker.crt
   SSL_KEY_PATH=/etc/ssl/private/phishblocker.key
   ```

4. **SSL Configuration**
   ```bash
   # Option 1: Let's Encrypt (Recommended)
   sudo apt install certbot
   sudo certbot certonly --standalone -d yourdomain.com

   # Copy certificates
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/phishblocker/docker/ssl/cert.pem
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/phishblocker/docker/ssl/key.pem

   # Option 2: Self-signed (Development only)
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout docker/ssl/key.pem -out docker/ssl/cert.pem
   ```

5. **Deploy Services**
   ```bash
   # Start production stack
   docker-compose -f docker-compose.prod.yml up -d

   # Verify deployment
   docker-compose ps
   docker-compose logs -f
   ```

6. **Configure Firewall**
   ```bash
   # UFW (Ubuntu)
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable

   # iptables (CentOS/RHEL)
   sudo firewall-cmd --permanent --add-service=http
   sudo firewall-cmd --permanent --add-service=https
   sudo firewall-cmd --reload
   ```

### Production Monitoring

1. **System Monitoring**
   ```bash
   # Install monitoring tools
   docker-compose -f docker-compose.monitoring.yml up -d

   # Access dashboards
   # Prometheus: http://yourdomain.com:9090
   # Grafana: http://yourdomain.com:3000
   ```

2. **Log Management**
   ```bash
   # Configure log rotation
   sudo nano /etc/logrotate.d/phishblocker

   /opt/phishblocker/logs/*.log {
       daily
       missingok
       rotate 30
       compress
       notifempty
       create 644 root root
   }
   ```

3. **Backup Setup**
   ```bash
   # Create backup script
   sudo nano /opt/phishblocker/backup.sh

   #!/bin/bash
   BACKUP_DIR="/backup/phishblocker"
   DATE=$(date +%Y%m%d_%H%M%S)

   # Database backup
   docker exec phishblocker-postgres pg_dump -U phishblocker phishblocker > $BACKUP_DIR/db_$DATE.sql

   # Models backup
   tar -czf $BACKUP_DIR/models_$DATE.tar.gz models/

   # Cleanup old backups (keep 30 days)
   find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
   find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

   # Make executable and schedule
   chmod +x /opt/phishblocker/backup.sh
   echo "0 2 * * * /opt/phishblocker/backup.sh" | sudo crontab -
   ```

## Cloud Deployment

### AWS Deployment

1. **EC2 Setup**
   ```bash
   # Launch EC2 instance (t3.medium recommended)
   # Amazon Linux 2 or Ubuntu 20.04
   # Security group: Allow ports 22, 80, 443

   # Connect and install Docker
   ssh -i your-key.pem ec2-user@your-instance-ip
   sudo yum update -y
   sudo yum install -y docker
   sudo service docker start
   sudo usermod -a -G docker ec2-user
   ```

2. **ECS Deployment**
   ```bash
   # Create task definition
   aws ecs create-task-definition --cli-input-json file://ecs-task-definition.json

   # Create service
   aws ecs create-service --cluster phishblocker --task-definition phishblocker:1 --desired-count 2
   ```

3. **RDS and ElastiCache**
   ```bash
   # Create RDS PostgreSQL instance
   aws rds create-db-instance \
     --db-instance-identifier phishblocker-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username phishblocker \
     --master-user-password YOUR_PASSWORD \
     --allocated-storage 20

   # Create ElastiCache Redis cluster
   aws elasticache create-cache-cluster \
     --cache-cluster-id phishblocker-redis \
     --cache-node-type cache.t3.micro \
     --engine redis
   ```

### Google Cloud Deployment

1. **Cloud Run Deployment**
   ```bash
   # Build and push image
   gcloud builds submit --tag gcr.io/YOUR_PROJECT/phishblocker

   # Deploy to Cloud Run
   gcloud run deploy phishblocker \
     --image gcr.io/YOUR_PROJECT/phishblocker \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

2. **Cloud SQL and Memorystore**
   ```bash
   # Create Cloud SQL instance
   gcloud sql instances create phishblocker-db \
     --database-version=POSTGRES_13 \
     --tier=db-f1-micro \
     --region=us-central1

   # Create Memorystore Redis instance
   gcloud redis instances create phishblocker-redis \
     --size=1 \
     --region=us-central1
   ```

### Azure Deployment

1. **Container Instances**
   ```bash
   # Create container group
   az container create \
     --resource-group phishblocker-rg \
     --name phishblocker \
     --image phishblocker:latest \
     --dns-name-label phishblocker \
     --ports 80 443
   ```

2. **Database and Cache**
   ```bash
   # Create PostgreSQL server
   az postgres server create \
     --resource-group phishblocker-rg \
     --name phishblocker-db \
     --admin-user phishblocker \
     --admin-password YOUR_PASSWORD

   # Create Redis cache
   az redis create \
     --resource-group phishblocker-rg \
     --name phishblocker-redis \
     --sku Basic \
     --vm-size c0
   ```

### Kubernetes Deployment

1. **Create Namespace**
   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: phishblocker
   ```

2. **Deploy Application**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

## Monitoring & Maintenance

### Performance Monitoring

1. **Metrics Collection**
   ```bash
   # Prometheus configuration
   global:
     scrape_interval: 15s

   scrape_configs:
     - job_name: 'phishblocker-api'
       static_configs:
         - targets: ['localhost:8000']
   ```

2. **Grafana Dashboards**
   - API Response Time
   - Request Rate
   - Error Rate
   - Database Performance
   - Cache Hit Rate

### Health Checks

```bash
# API health check
curl -f http://localhost:8000/health || exit 1

# Database health check
docker exec phishblocker-postgres pg_isready -U phishblocker

# Redis health check
docker exec phishblocker-redis redis-cli ping
```

### Scaling

1. **Horizontal Scaling**
   ```bash
   # Scale API containers
   docker-compose up -d --scale phishblocker-api=3

   # Kubernetes scaling
   kubectl scale deployment phishblocker-api --replicas=5
   ```

2. **Load Balancing**
   ```nginx
   upstream phishblocker_api {
       server api1:8000;
       server api2:8000;
       server api3:8000;
   }
   ```

### Security Hardening

1. **SSL/TLS Configuration**
   ```nginx
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256;
   ssl_prefer_server_ciphers off;
   add_header Strict-Transport-Security "max-age=63072000" always;
   ```

2. **API Security**
   ```python
   # Rate limiting
   from slowapi import Limiter
   limiter = Limiter(key_func=get_remote_address)

   @app.post("/scan")
   @limiter.limit("60/minute")
   async def scan_url():
       pass
   ```

### Troubleshooting

1. **Common Issues**
   ```bash
   # Check logs
   docker-compose logs -f phishblocker-api

   # Check resource usage
   docker stats

   # Check database connections
   docker exec phishblocker-postgres psql -U phishblocker -c "SELECT COUNT(*) FROM pg_stat_activity;"
   ```

2. **Performance Issues**
   ```bash
   # Monitor response times
   curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/scan

   # Check cache hit rate
   docker exec phishblocker-redis redis-cli info stats | grep keyspace_hits
   ```

This deployment guide ensures PhishBlocker can be deployed securely and reliably across various environments.
