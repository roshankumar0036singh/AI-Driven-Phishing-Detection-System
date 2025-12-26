# Gemini LLM Integration - Quick Start Guide

## 🚀 Setup Instructions

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Gemini API key
GEMINI_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Start the Server

```bash
# Development mode
cd src/api
python main.py

# Or with Docker
docker-compose up -d
```

## 📊 Testing LLM Integration

### Test URL Scan with LLM Analysis

```bash
curl -X POST http://localhost:8000/scan \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://suspicious-login-page.com/verify",
    "user_id": "test_user"
  }'
```

**Expected Response:**
```json
{
  "url": "https://suspicious-login-page.com/verify",
  "is_phishing": true,
  "confidence": 0.92,
  "threat_level": "High",
  "risk_factors": [
    "Contains 2 suspicious keywords",
    "Not using HTTPS encryption"
  ],
  "timestamp": "2025-12-25T13:45:00",
  "scan_id": "abc123def456",
  "llm_analysis": {
    "threat_assessment": "This URL exhibits multiple phishing indicators including suspicious keywords like 'verify' and 'login' in the path, which are commonly used in credential harvesting attacks.",
    "risk_factors": [
      "Suspicious keywords in URL path",
      "Domain name mimics legitimate services",
      "No HTTPS encryption for login page"
    ],
    "legitimate_indicators": [],
    "user_recommendation": "block",
    "confidence_explanation": "High confidence based on multiple phishing patterns and ML model agreement",
    "educational_tip": "Never enter credentials on non-HTTPS pages, especially from email links",
    "technical_summary": "URL entropy: 3.2, Domain age: Unknown, SSL: None"
  }
}
```

### Check LLM Statistics

```bash
curl http://localhost:8000/llm/stats
```

**Response:**
```json
{
  "status": "active",
  "model": "gemini-2.0-flash-exp",
  "analyzer": {
    "total_requests": 150,
    "api_calls": 15,
    "cache_hits": 135,
    "cache_hit_rate": 0.9,
    "cache_size": 120,
    "estimated_cost_saved": 0.135
  },
  "cache": {
    "hit_count": 135,
    "miss_count": 15,
    "hit_rate_percentage": 90.0,
    "cache_size": 120,
    "estimated_cost_saved_usd": 0.135
  },
  "cost_optimization": {
    "cache_enabled": true,
    "estimated_monthly_cost_usd": 0.45,
    "estimated_savings_usd": 0.135
  }
}
```

## 🎯 Features

### Natural Language Explanations
- **User-friendly**: Plain English threat descriptions
- **Educational**: Security tips for each scan
- **Context-aware**: Considers both ML and LLM analysis

### Intelligent Caching
- **90%+ cache hit rate**: Minimizes API costs
- **7-day TTL**: Balances freshness and efficiency
- **Redis-backed**: Distributed caching support

### Cost Optimization
- **~$0.001 per analysis**: With Gemini Flash model
- **90% cost reduction**: Through aggressive caching
- **Estimated $50-200/month**: For 100K scans

## 🔧 Configuration Options

### Enable/Disable LLM Analysis

```bash
# In .env file
ENABLE_LLM_ANALYSIS=true  # Set to false to disable
```

### Adjust Cache TTL

```bash
# Cache for 14 days instead of 7
GEMINI_CACHE_TTL=1209600
```

### Change Gemini Model

```bash
# Use different model (e.g., Pro for better quality)
GEMINI_MODEL=gemini-1.5-pro
```

## 📈 Monitoring

### View Cache Performance

```bash
# Get detailed cache statistics
curl http://localhost:8000/llm/stats
```

### Clear Cache (Admin)

```bash
# Clear all LLM cache entries
curl -X POST http://localhost:8000/llm/cache/clear
```

## 🐛 Troubleshooting

### LLM Analysis Not Working

1. **Check API Key**:
   ```bash
   echo $GEMINI_API_KEY
   ```

2. **Check Logs**:
   ```bash
   # Look for initialization messages
   tail -f logs/phishblocker.log | grep Gemini
   ```

3. **Verify Feature Flag**:
   ```bash
   curl http://localhost:8000/llm/stats
   ```

### High API Costs

1. **Check cache hit rate** (should be >90%):
   ```bash
   curl http://localhost:8000/llm/stats | jq '.cache.hit_rate_percentage'
   ```

2. **Increase cache TTL**:
   ```bash
   # In .env
   GEMINI_CACHE_TTL=1209600  # 14 days
   ```

3. **Disable for low-risk URLs**:
   - Modify code to only use LLM for medium/high risk predictions

## 💡 Best Practices

1. **Use caching**: Always enable Redis for production
2. **Monitor costs**: Check `/llm/stats` regularly
3. **Adjust TTL**: Balance freshness vs. cost
4. **Fallback gracefully**: System works without LLM if API fails
5. **Rate limiting**: Implement API rate limits to control costs

## 🔒 Security Notes

- **API Key Security**: Never commit `.env` to version control
- **Environment Variables**: Use secrets management in production
- **Rate Limiting**: Protect against abuse
- **Input Validation**: All URLs are validated before LLM analysis
