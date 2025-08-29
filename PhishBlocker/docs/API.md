# PhishBlocker API Documentation

## Overview

The PhishBlocker API provides real-time phishing detection capabilities through RESTful endpoints. It uses advanced machine learning models to analyze URLs and provide threat assessments.

## Base URL

```
Production: https://api.phishblocker.com
Development: http://localhost:8000
```

## Authentication

Currently, the API is open for testing. In production, authentication will be required:

```http
Authorization: Bearer YOUR_API_KEY
```

## Rate Limiting

- **General endpoints**: 100 requests per minute
- **Scanning endpoints**: 60 requests per minute
- **Batch endpoints**: 10 requests per minute

Rate limit headers included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Window reset time

## Endpoints

### Health Check

Check API availability and status.

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "detector_loaded": true,
  "redis_connected": true,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### URL Scanning

Scan a single URL for phishing threats.

```http
POST /scan
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "user_id": "optional-user-id",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "url": "https://example.com",
  "is_phishing": false,
  "confidence": 0.95,
  "threat_level": "Low",
  "risk_factors": [],
  "timestamp": "2024-01-15T10:30:00Z",
  "scan_id": "abc123def456"
}
```

**Threat Levels:**
- `Low`: Confidence < 0.3
- `Medium`: 0.3 ≤ Confidence < 0.7  
- `High`: Confidence ≥ 0.7

### Batch Scanning

Scan multiple URLs in a single request.

```http
POST /scan-batch
```

**Request Body:**
```json
{
  "urls": [
    "https://example1.com",
    "https://example2.com",
    "https://example3.com"
  ],
  "user_id": "optional-user-id"
}
```

**Response:**
```json
{
  "total_urls": 3,
  "phishing_detected": 1,
  "safe_urls": 2,
  "results": [
    {
      "url": "https://example1.com",
      "is_phishing": false,
      "confidence": 0.15,
      "threat_level": "Low",
      "risk_factors": [],
      "timestamp": "2024-01-15T10:30:00Z",
      "scan_id": "abc123def456"
    }
  ],
  "batch_id": "batch_abc123"
}
```

### Submit Feedback

Submit user feedback for continuous learning.

```http
POST /feedback
```

**Request Body:**
```json
{
  "url": "https://example.com",
  "is_phishing": true,
  "user_feedback": "This is actually a phishing site",
  "scan_id": "abc123def456"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Feedback received and will be used to improve detection accuracy",
  "feedback_id": "feedback_789xyz"
}
```

### User Analytics

Get analytics for a specific user.

```http
GET /analytics/{user_id}
```

**Response:**
```json
{
  "user_id": "demo_user",
  "risk_score": 25.5,
  "total_scans": 150,
  "phishing_encounters": 5,
  "last_scan": "2024-01-15T10:30:00Z"
}
```

### Global Statistics

Get global platform statistics.

```http
GET /analytics/global/stats
```

**Response:**
```json
{
  "platform_stats": {
    "total_users": 1250,
    "total_scans": 50000,
    "threats_blocked": 2500,
    "detection_rate": 5.0
  },
  "threat_intelligence": {
    "active_threats": 2500,
    "threat_level": "Medium",
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

### Model Information

Get information about the ML model.

```http
GET /model/info
```

**Response:**
```json
{
  "model_type": "Ensemble (LightGBM + Neural Network)",
  "version": "1.0.0",
  "features": [
    "URL length analysis",
    "Domain structure analysis",
    "Suspicious keyword detection",
    "SSL certificate validation",
    "Entropy calculation"
  ],
  "last_updated": "2024-01-15T10:30:00Z",
  "status": "active"
}
```

## Error Handling

The API uses standard HTTP status codes:

- `200`: Success
- `400`: Bad Request
- `422`: Validation Error
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error
- `503`: Service Unavailable

**Error Response Format:**
```json
{
  "error": "Bad Request",
  "message": "Invalid URL format",
  "detail": "URL must start with http:// or https://",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## WebSocket Support

For real-time monitoring:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/monitor');
ws.onmessage = function(event) {
    const stats = JSON.parse(event.data);
    console.log('Real-time stats:', stats);
};
```

## SDK Examples

### Python
```python
import requests

class PhishBlockerClient:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url

    def scan_url(self, url, user_id=None):
        response = requests.post(
            f"{self.base_url}/scan",
            json={"url": url, "user_id": user_id}
        )
        return response.json()

# Usage
client = PhishBlockerClient()
result = client.scan_url("https://suspicious-site.com")
print(f"Threat Level: {result['threat_level']}")
```

### JavaScript
```javascript
class PhishBlockerAPI {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
    }

    async scanURL(url, userId = null) {
        const response = await fetch(`${this.baseURL}/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, user_id: userId })
        });
        return response.json();
    }
}

// Usage
const api = new PhishBlockerAPI();
api.scanURL('https://suspicious-site.com')
   .then(result => console.log('Threat Level:', result.threat_level));
```

### cURL Examples

```bash
# Health check
curl http://localhost:8000/health

# Scan single URL
curl -X POST http://localhost:8000/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Batch scan
curl -X POST http://localhost:8000/scan-batch \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [
      "https://example1.com", 
      "https://example2.com"
    ]
  }'

# Submit feedback
curl -X POST http://localhost:8000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://phishing-site.com",
    "is_phishing": true,
    "user_feedback": "Confirmed phishing site",
    "scan_id": "abc123"
  }'
```

## Monitoring & Observability

### Health Endpoints
- `/health`: Basic health check
- `/metrics`: Prometheus metrics
- `/info`: System information

### Logging
All requests are logged with:
- Request timestamp
- User ID (if provided) 
- URL scanned (hashed for privacy)
- Response time
- Threat level detected

### Performance Metrics
- Average response time: <100ms
- Throughput: 1000+ req/sec
- Error rate: <1%
- Uptime: 99.9%
