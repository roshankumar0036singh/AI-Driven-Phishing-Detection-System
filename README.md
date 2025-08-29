# PhishBlocker: Advanced AI-Driven Phishing Detection System
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.9%2B-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.116.1-green)](https://fastapi.tiangolo.com)

## 🛡️ Overview

PhishBlocker is a comprehensive, real-time phishing detection system that combines advanced machine learning with practical browser protection.It addresses the growing threat of phishing attacks through innovative AI-driven detection and user-friendly protection mechanisms.

### 🎯 Problem Statement

Phishing remains the top cyber threat with **3.4 billion phishing emails sent daily**, affecting **57% of organizations weekly**. University students are particularly vulnerable, with **70.6% falling for phishing simulations**. The average cost of a phishing-driven breach reached **$4.88 million in 2024**.

### 💡 Solution

PhishBlocker provides multi-platform security through:
- **Real-time AI-driven detection** using ensemble ML models
- **Browser extension** with visual threat indicators
- **Interactive dashboard** for analytics and monitoring
- **Adaptive learning** from user feedback
- **Safe-sandbox mode** for high-risk content isolation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   Frontend      │    │   ML Engine     │
│   Extension     │◄──►│   Dashboard     │◄──►│   (LightGBM +   │
│                 │    │                 │    │   Neural Net)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                     ┌─────────────────┐
                     │   FastAPI       │
                     │   Backend       │
                     └─────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
        ┌───────▼───────┐ ┌──▼──┐ ┌────▼────┐
        │ PostgreSQL    │ │Redis│ │ Docker  │
        │ Database      │ │Cache│ │ Stack   │
        └───────────────┘ └─────┘ └─────────┘
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Docker & Docker Compose
- Node.js (for performance testing)
- Chrome/Firefox browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/phishblocker.git
   cd phishblocker
   ```

2. **Start with Docker Compose** (Recommended)
   ```bash
   docker-compose up -d
   ```
   This starts:
   - API Server: http://localhost:8000
   - Dashboard: http://localhost:80
   - Database: PostgreSQL on port 5432
   - Cache: Redis on port 6379

3. **Manual Setup** (Development)
   ```bash
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or
   venv\Scripts\activate     # Windows

   # Install dependencies
   pip install -r requirements.txt

   # Start API server
   cd src/api
   python main.py
   ```

4. **Install Browser Extension**
   - Open Chrome: `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `src/extension/` directory

### Verification

1. **API Health Check**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Test URL Scan**
   ```bash
   curl -X POST http://localhost:8000/scan \
        -H "Content-Type: application/json" \
        -d '{"url": "https://www.google.com", "user_id": "test"}'
   ```

3. **Access Dashboard**
   Open http://localhost:80 in your browser

## 🔧 Features

### 🤖 Machine Learning Engine
- **Ensemble Model**: LightGBM + Neural Network
- **42+ URL Features**: Entropy, SSL age, domain analysis
- **Real-time Processing**: <100ms response time
- **Continuous Learning**: User feedback integration
- **95%+ Accuracy**: Based on PhishTank dataset

### 🌐 Browser Extension
- **Real-time Protection**: Automatic URL scanning
- **Visual Indicators**: Threat level overlays
- **Site Blocking**: Automatic dangerous site prevention
- **Form Protection**: HTTPS and security warnings
- **User Reports**: One-click phishing feedback

### 📊 Interactive Dashboard
- **Live Analytics**: Real-time threat monitoring
- **Trend Graphs**: Historical attack patterns
- **Domain Heat Maps**: Geographic threat visualization
- **User Risk Scores**: Personal security metrics
- **Performance Metrics**: System health monitoring

### 🔧 API Features
- **RESTful Endpoints**: Complete API documentation
- **Batch Processing**: Multiple URL scanning
- **Caching**: Redis-powered performance
- **Rate Limiting**: DDoS protection
- **Monitoring**: Health checks and metrics

## 📖 Documentation

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/scan` | POST | Single URL scan |
| `/scan-batch` | POST | Multiple URL scan |
| `/feedback` | POST | User feedback submission |
| `/analytics/{user_id}` | GET | User analytics |
| `/analytics/global/stats` | GET | Global statistics |
| `/model/info` | GET | ML model information |

### URL Scanning Example

```python
import requests

response = requests.post('http://localhost:8000/scan', json={
    'url': 'https://suspicious-site.com',
    'user_id': 'demo_user'
})

result = response.json()
print(f"Threat Level: {result['threat_level']}")
print(f"Confidence: {result['confidence']:.2%}")
print(f"Risk Factors: {result['risk_factors']}")
```

### Browser Extension Integration

```javascript
// Send URL for scanning
chrome.runtime.sendMessage({
    action: 'scan_url',
    url: window.location.href
}, (response) => {
    if (response.is_phishing) {
        showPhishingWarning(response);
    }
});
```

## 🧪 Testing

### Run Unit Tests
```bash
pytest tests/ -v --cov=src/
```

### Performance Testing
```bash
# Start services
docker-compose up -d

# Run load tests
npm install -g artillery
artillery run tests/performance/load-test.yml
```

### Security Testing
```bash
# Vulnerability scanning
docker run --rm -v $(pwd):/app aquasec/trivy fs /app
```

## 🚀 Deployment

### Production Deployment

1. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Enable HTTPS**
   ```bash
   # Update nginx.conf with SSL certificates
   # Restart nginx container
   docker-compose restart nginx
   ```

### Cloud Deployment (AWS/GCP/Azure)

The application is containerized and ready for cloud deployment:
- **Kubernetes**: Use provided k8s manifests
- **AWS ECS**: Deploy with task definitions
- **Google Cloud Run**: Single-command deployment
- **Azure Container Instances**: Quick cloud deployment

### CI/CD Pipeline

GitHub Actions automatically:
1. **Tests**: Run unit and integration tests
2. **Security**: Vulnerability scanning
3. **Build**: Create Docker images
4. **Deploy**: Push to production
5. **Monitor**: Performance testing

## 📊 Performance

### Benchmarks
- **API Response Time**: <100ms average
- **Throughput**: 1000+ requests/second
- **Accuracy**: 95.2% on test dataset
- **False Positive Rate**: <2%
- **Memory Usage**: <512MB per container

### Scalability
- **Horizontal Scaling**: Multiple API instances
- **Caching**: Redis for performance
- **Database**: Optimized PostgreSQL queries
- **Load Balancing**: Nginx reverse proxy

## 🛠️ Development

### Project Structure
```
PhishBlocker/
├── src/
│   ├── api/                 # FastAPI backend
│   ├── frontend/            # Dashboard UI
│   └── extension/           # Browser extension
├── data/                    # Training datasets
├── models/                  # Trained ML models
├── tests/                   # Test suites
├── docker/                  # Docker configurations
├── docs/                    # Documentation
└── .github/workflows/       # CI/CD pipelines
```

### Development Setup
```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Code formatting
black src/

# Linting
flake8 src/

# Type checking
mypy src/
```

### Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 🔒 Security

### Data Privacy
- **No Personal Data Storage**: Only URLs processed
- **Local Processing**: Sensitive operations client-side
- **Encryption**: All API communications encrypted
- **Anonymization**: User data anonymized in analytics

### Security Features
- **Rate Limiting**: DDoS protection
- **Input Validation**: SQL injection prevention
- **CORS Protection**: Cross-origin security
- **Authentication**: API key validation

## 📈 Roadmap

### Phase 1: Core Features ✅
- [x] ML model development
- [x] API implementation
- [x] Browser extension
- [x] Basic dashboard

### Phase 2: Enhanced Protection (Q1 2024)
- [ ] Email integration (Outlook add-in)
- [ ] Mobile app development
- [ ] Advanced ML models (BERT integration)
- [ ] Enterprise features

### Phase 3: Advanced Analytics (Q2 2024)
- [ ] Threat intelligence feeds
- [ ] Advanced visualization
- [ ] Machine learning optimization
- [ ] Global threat network

## 🏆 Impact & Results

### Hackathon Achievement
- **Theme**: Cybersecurity for the Future
- **Innovation**: Real-time AI-driven protection
- **Practicality**: Production-ready implementation
- **Scalability**: Cloud-native architecture

### Expected Impact
- **95% Threat Detection**: Advanced ML accuracy
- **$4.88M+ Savings**: Prevent average breach cost
- **Real-time Protection**: <100ms response time
- **User-friendly**: Seamless browser integration

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- **PhishTank**: Open phishing URL database
- **OpenPhish**: Additional threat intelligence
- **NextGen Hackathon**: Platform and inspiration
- **Open Source Community**: Libraries and frameworks used

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/roshankumar00036singh/AI-Driven-Phishing-Detection-System/issues)
- **Email**: roshankumar00036@gmail.com

---

**Built with ❤️ for a safer internet**

*PhishBlocker - Protecting users from phishing threats through advanced AI and real-time detection.*
