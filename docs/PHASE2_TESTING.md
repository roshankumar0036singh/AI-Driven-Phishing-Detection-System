# Phase 2 Performance Testing Guide

## 🧪 Testing Performance Optimizations

This guide provides step-by-step instructions for testing all Phase 2 performance optimizations.

---

## Prerequisites

```bash
# Ensure all dependencies are installed
pip install -r requirements.txt

# Start Redis
docker run -d -p 6379:6379 redis:latest

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost:5432/phishblocker"
export CACHE_L1_SIZE=1000
export CACHE_L2_TTL=3600
export DB_POOL_SIZE=20
```

---

## Test 1: Multi-Layer Cache

### Start Server
```bash
cd src/api
python main.py
```

### Test Cache Statistics
```bash
curl http://localhost:8000/cache/stats
```

**Expected Response**:
```json
{
  "status": "active",
  "layers": {
    "l1": {
      "type": "memory_lru",
      "hit_rate_percentage": 85.0
    },
    "l2": {
      "type": "redis",
      "hit_rate_percentage": 10.0
    }
  },
  "overall": {
    "hit_rate_percentage": 95.0
  }
}
```

### Test Cache Performance
```bash
# First request (cache miss)
time curl -X POST http://localhost:8000/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'

# Second request (cache hit - should be faster)
time curl -X POST http://localhost:8000/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}'
```

**Expected**:
- First request: ~100ms
- Second request: ~10ms (90% faster)

---

## Test 2: Database Connection Pool

### Check Pool Statistics
```bash
curl http://localhost:8000/db/pool/stats
```

**Expected Response**:
```json
{
  "status": "healthy",
  "pool": {
    "size": 20,
    "checked_out": 2,
    "utilization_percentage": 10.0
  },
  "health": {
    "is_healthy": true
  }
}
```

### Check Pool Health
```bash
curl http://localhost:8000/db/pool/health
```

**Expected**:
```json
{
  "healthy": true,
  "status": "operational"
}
```

### Load Test Pool
```bash
# Send 100 concurrent requests
for i in {1..100}; do
  curl -X POST http://localhost:8000/scan \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"https://test$i.com\"}" &
done
wait

# Check pool stats again
curl http://localhost:8000/db/pool/stats
```

**Expected**: All requests complete without "pool exhausted" errors

---

## Test 3: Batch Processing

### Check Batch Statistics
```bash
curl http://localhost:8000/batch/stats
```

**Expected Response**:
```json
{
  "status": "active",
  "pending": {
    "scans": 0,
    "feedback": 0
  },
  "configuration": {
    "batch_size": 100
  }
}
```

### Test Batch Auto-Flush
```bash
# Send 100 scans (should auto-flush)
for i in {1..100}; do
  curl -X POST http://localhost:8000/scan \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"https://batch-test-$i.com\", \"user_id\": \"test\"}"
done

# Check if batch was flushed
curl http://localhost:8000/batch/stats
```

**Expected**: `pending.scans` should be 0 (auto-flushed at 100)

### Manual Flush
```bash
curl -X POST http://localhost:8000/batch/flush
```

---

## Test 4: Feature Extraction Caching

### Test Cached vs Uncached
```python
import time
import requests

url = "https://example.com"

# First extraction (uncached)
start = time.time()
requests.post("http://localhost:8000/scan", json={"url": url})
uncached_time = time.time() - start

# Second extraction (cached)
start = time.time()
requests.post("http://localhost:8000/scan", json={"url": url})
cached_time = time.time() - start

print(f"Uncached: {uncached_time*1000:.0f}ms")
print(f"Cached: {cached_time*1000:.0f}ms")
print(f"Speedup: {uncached_time/cached_time:.1f}x")
```

**Expected Output**:
```
Uncached: 100ms
Cached: 10ms
Speedup: 10.0x
```

---

## Test 5: Performance Summary

### Get Comprehensive Summary
```bash
curl http://localhost:8000/performance/summary
```

**Expected Response**:
```json
{
  "components": {
    "cache": {
      "status": "active",
      "hit_rate": 95.0,
      "performance_impact": "95% of requests served from cache"
    },
    "database_pool": {
      "status": "healthy",
      "performance_impact": "Connection reuse reduces latency by 90%"
    },
    "llm_cache": {
      "status": "active",
      "cost_saved": "$0.13"
    },
    "batch_processor": {
      "status": "active",
      "performance_impact": "10x throughput improvement"
    }
  },
  "overall": {
    "active_optimizations": 4,
    "optimization_level": "4/4 components active",
    "estimated_performance_gain": "100% improvement"
  }
}
```

---

## Load Testing

### Install Artillery
```bash
npm install -g artillery
```

### Create Load Test Config
```yaml
# load-test.yml
config:
  target: "http://localhost:8000"
  phases:
    - duration: 60
      arrivalRate: 50
      name: "Sustained load"
scenarios:
  - name: "Scan URLs"
    flow:
      - post:
          url: "/scan"
          json:
            url: "https://test-{{ $randomNumber() }}.com"
            user_id: "load-test"
```

### Run Load Test
```bash
artillery run load-test.yml
```

**Expected Results**:
- Requests/second: 1000+
- P95 latency: <100ms
- P99 latency: <200ms
- Error rate: <0.1%

---

## Benchmark Script

### Python Benchmark
```python
import asyncio
import time
from multi_cache import MultiLayerCache
import redis

async def benchmark_cache():
    # Setup
    redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
    cache = MultiLayerCache(redis_client, l1_max_size=1000, l2_ttl_seconds=3600)
    
    # Warm cache
    print("Warming cache...")
    for i in range(1000):
        await cache.set(f"key{i}", {"data": i})
    
    # Benchmark L1 hits
    print("\nBenchmarking L1 cache...")
    start = time.time()
    for i in range(10000):
        await cache.get(f"key{i % 1000}")
    l1_duration = time.time() - start
    
    print(f"10K L1 hits: {l1_duration:.2f}s")
    print(f"Average: {l1_duration/10000*1000:.2f}ms per request")
    print(f"Throughput: {10000/l1_duration:.0f} req/s")
    
    # Get statistics
    stats = cache.get_stats()
    print(f"\nCache Statistics:")
    print(f"Hit rate: {stats['overall']['hit_rate_percentage']:.1f}%")
    print(f"L1 hits: {stats['l1']['hits']}")
    print(f"L2 hits: {stats['l2']['hits']}")

if __name__ == "__main__":
    asyncio.run(benchmark_cache())
```

**Expected Output**:
```
Warming cache...
Benchmarking L1 cache...
10K L1 hits: 0.05s
Average: 0.005ms per request
Throughput: 200000 req/s

Cache Statistics:
Hit rate: 100.0%
L1 hits: 10000
L2 hits: 0
```

---

## Monitoring Dashboard

### Real-time Monitoring
```bash
# Watch cache stats
watch -n 1 'curl -s http://localhost:8000/cache/stats | jq ".overall.hit_rate_percentage"'

# Watch pool stats
watch -n 1 'curl -s http://localhost:8000/db/pool/stats | jq ".pool.utilization_percentage"'

# Watch performance summary
watch -n 5 'curl -s http://localhost:8000/performance/summary | jq'
```

---

## Troubleshooting

### Low Cache Hit Rate

**Check**:
```bash
curl http://localhost:8000/cache/stats | jq ".overall.hit_rate_percentage"
```

**If <80%**:
1. Increase L1 size: `export CACHE_L1_SIZE=2000`
2. Increase L2 TTL: `export CACHE_L2_TTL=7200`
3. Restart server

### Pool Exhaustion

**Check**:
```bash
curl http://localhost:8000/db/pool/stats | jq ".pool.overflow"
```

**If overflow >10**:
1. Increase pool size: `export DB_POOL_SIZE=40`
2. Increase max overflow: `export DB_MAX_OVERFLOW=80`
3. Restart server

### Slow Queries

**Check database**:
```sql
-- Find slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

**Solutions**:
1. Add missing indexes
2. Refresh materialized views
3. Optimize query logic

---

## Success Criteria

✅ **Cache hit rate**: >90%
✅ **P95 latency**: <100ms
✅ **Throughput**: >1000 req/s
✅ **Pool utilization**: <80%
✅ **Error rate**: <0.1%
✅ **All components**: Active

---

## Next Steps

After successful testing:
1. Deploy to staging environment
2. Run production load tests
3. Monitor metrics for 24 hours
4. Proceed to Phase 3 (Advanced ML Features)
