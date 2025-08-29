from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import List, Optional, Dict, Any
import asyncio
import json
import redis
import hashlib
from datetime import datetime
import logging
import os
import sys
import uvicorn


# Add the ml module to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'api')))

# Import the ML model class


from phishing_model import PhishingDetectionEnsemble
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PhishBlocker API",
    description="Real-time phishing detection API with adaptive ML and threat intelligence",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for all origins (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class URLRequest(BaseModel):
    url: str
    user_id: Optional[str] = None
    timestamp: Optional[datetime] = None

class URLBatchRequest(BaseModel):
    urls: List[str]
    user_id: Optional[str] = None

class PhishingResponse(BaseModel):
    url: str
    is_phishing: bool
    confidence: float
    threat_level: str
    risk_factors: List[str]
    timestamp: datetime
    scan_id: str

class FeedbackRequest(BaseModel):
    url: str
    is_phishing: bool
    user_feedback: str
    scan_id: str

class UserRiskProfile(BaseModel):
    user_id: str
    risk_score: float
    total_scans: int
    phishing_encounters: int
    last_scan: datetime

# Globals
detector: Optional[PhishingDetectionEnsemble] = None
redis_client: Optional[redis.Redis] = None
user_analytics: Dict[str, Dict[str, Any]] = {}

@app.on_event("startup")
async def startup_event():
    global detector, redis_client
    logger.info("🚀 Starting PhishBlocker API...")

    try:
        detector = PhishingDetectionEnsemble()
        base_path="/app/models/"
        
        detector.load_models(base_path)  # Adjust to mounted path
        if detector.is_trained:
            logger.info("✅ ML phishing detector ensemble loaded successfully")
        else:
            logger.warning("⚠️ Model exists but is not trained")
    except Exception as e:
        logger.error(f"❌ Failed to load ML phishing model: {e}")
        detector = None

    # Redis setup
    try:
        redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
        redis_client.ping()
        logger.info("✅ Redis cache connected")
    except Exception as e:
        logger.warning(f"⚠️ Redis not available: {e}")
        redis_client = None

@app.get("/")
async def root():
    return {
        "service": "PhishBlocker API",
        "version": "1.0.0",
        "status": "active",
        "features": [
            "Real-time URL scanning",
            "Threat level assessment",
            "User analytics",
            "Feedback learning",
            "Batch processing"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "detector_loaded": detector is not None and detector.is_trained,
        "redis_connected": redis_client is not None,
        "timestamp": datetime.now()
    }

def generate_scan_id(url: str) -> str:
    timestamp = str(datetime.now().timestamp())
    return hashlib.md5(f"{url}_{timestamp}".encode()).hexdigest()[:12]

def get_risk_factors(features: Dict[str, Any]) -> List[str]:
    risk_factors = []
    if features.get('has_ip', 0):
        risk_factors.append("Uses IP address instead of domain name")
    if not features.get('is_https', 0):
        risk_factors.append("Not using HTTPS encryption")
    if features.get('suspicious_keywords', 0) > 0:
        risk_factors.append(f"Contains {features['suspicious_keywords']} suspicious keywords")
    if features.get('is_shortening', 0):
        risk_factors.append("Uses URL shortening service")
    if features.get('url_length', 0) > 100:
        risk_factors.append("Unusually long URL")
    if features.get('num_hyphens', 0) > 3:
        risk_factors.append("Excessive hyphens in domain")
    return risk_factors

@app.post("/scan", response_model=PhishingResponse)
async def scan_url(request: URLRequest):
    if not detector or not detector.is_trained:
        raise HTTPException(status_code=503, detail="Phishing detector not available")
    url = request.url.strip()
    scan_id = generate_scan_id(url)
    cache_key = f"scan:{hashlib.md5(url.encode()).hexdigest()}"
    if redis_client:
        try:
            cached_result = redis_client.get(cache_key)
            if cached_result:
                logger.info(f"Cache hit for URL: {url[:50]}...")
                cached_data = json.loads(cached_result)
                cached_data['scan_id'] = scan_id
                return PhishingResponse(**cached_data)
        except Exception as e:
            logger.warning(f"Cache read error: {e}")
    try:
        result = detector.predict_url(url, return_confidence=True)

        risk_factors = get_risk_factors(result['features'])
        response_data = {
            "url": url,
            "is_phishing": result['prediction'] == 1,
            "confidence": result['confidence'],
            "threat_level": result['threat_level'],
            "risk_factors": risk_factors,
            "timestamp": datetime.now(),
            "scan_id": scan_id
        }
        if redis_client:
            try:
                cache_data = response_data.copy()
                cache_data['timestamp'] = cache_data['timestamp'].isoformat()
                redis_client.setex(cache_key, 3600, json.dumps(cache_data))
            except Exception as e:
                logger.warning(f"Cache write error: {e}")
        if request.user_id:
            await update_user_analytics(request.user_id, result['prediction'] == 1)
        logger.info(f"Scanned URL: {url[:50]}... | Result: {'Phishing' if result['prediction'] == 1 else 'Safe'} | Confidence: {result['confidence']:.3f}")
        return PhishingResponse(**response_data)
    except Exception as e:
        logger.error(f"Error scanning URL {url}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during URL analysis")

@app.post("/scan-batch")
async def scan_batch_urls(request: URLBatchRequest):
    if not detector or not detector.is_trained:
        raise HTTPException(status_code=503, detail="Phishing detector not available")
    if len(request.urls) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 URLs per batch request")
    results = []
    for url in request.urls:
        try:
            url_request = URLRequest(url=url, user_id=request.user_id)
            result = await scan_url(url_request)
            results.append(result.dict())
        except Exception as e:
            logger.error(f"Error in batch scanning URL {url}: {str(e)}")
            results.append({
                "url": url,
                "is_phishing": False,
                "confidence": 0.0,
                "threat_level": "Unknown",
                "risk_factors": ["Scan failed"],
                "timestamp": datetime.now(),
                "scan_id": generate_scan_id(url)
            })
    phishing_count = sum(1 for r in results if r['is_phishing'])
    return {
        "total_urls": len(results),
        "phishing_detected": phishing_count,
        "safe_urls": len(results) - phishing_count,
        "results": results,
        "batch_id": generate_scan_id("batch_" + str(len(request.urls)))
    }

@app.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    try:
        feedback_entry = {
            "url": request.url,
            "user_reported_phishing": request.is_phishing,
            "feedback": request.user_feedback,
            "scan_id": request.scan_id,
            "timestamp": datetime.now().isoformat()
        }
        logger.info(f"Feedback received: {json.dumps(feedback_entry)}")  # Save feedback to DB in production
        return {
            "status": "success",
            "message": "Feedback received and will be used to improve detection accuracy",
            "feedback_id": generate_scan_id(request.url + request.user_feedback)
        }
    except Exception as e:
        logger.error(f"Error processing feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing feedback")

async def update_user_analytics(user_id: str, encountered_phishing: bool):
    if user_id not in user_analytics:
        user_analytics[user_id] = {
            "total_scans": 0,
            "phishing_encounters": 0,
            "risk_score": 0.0,
            "last_scan": datetime.now()
        }
    user_analytics[user_id]["total_scans"] += 1
    if encountered_phishing:
        user_analytics[user_id]["phishing_encounters"] += 1
    encounters = user_analytics[user_id]["phishing_encounters"]
    total = user_analytics[user_id]["total_scans"]
    user_analytics[user_id]["risk_score"] = (encounters / total) * 100
    user_analytics[user_id]["last_scan"] = datetime.now()

@app.get("/analytics/{user_id}", response_model=UserRiskProfile)
async def get_user_analytics(user_id: str):
    if user_id not in user_analytics:
        return UserRiskProfile(
            user_id=user_id,
            risk_score=0.0,
            total_scans=0,
            phishing_encounters=0,
            last_scan=datetime.now()
        )
    data = user_analytics[user_id]
    return UserRiskProfile(
        user_id=user_id,
        risk_score=data["risk_score"],
        total_scans=data["total_scans"],
        phishing_encounters=data["phishing_encounters"],
        last_scan=data["last_scan"]
    )

@app.get("/analytics/global/stats")
async def get_global_analytics():
    total_users = len(user_analytics)
    total_scans = sum(user["total_scans"] for user in user_analytics.values())
    total_threats = sum(user["phishing_encounters"] for user in user_analytics.values())
    return {
        "platform_stats": {
            "total_users": total_users,
            "total_scans": total_scans,
            "threats_blocked": total_threats,
            "detection_rate": (total_threats / total_scans * 100) if total_scans > 0 else 0
        },
        "threat_intelligence": {
            "active_threats": total_threats,
            "threat_level": "Medium" if total_threats > 0 else "Low",
            "last_updated": datetime.now()
        }
    }

@app.get("/model/info")
async def get_model_info():
    if not detector or not detector.is_trained:
        return {"status": "no_model_loaded"}
    return {
        "model_type": "Phishing Detection Ensemble",
        "version": detector.metadata.get("version", "unknown"),
        "features": detector.metadata.get("features", []),
        "last_updated": datetime.now(),
        "status": "active"
    }

@app.websocket("/ws/monitor")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            stats = await get_global_analytics()
            await websocket.send_json(stats)
            await asyncio.sleep(10)  # every 10 seconds
    except Exception as e:
        logger.error(f"WebSocket error: {e}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
