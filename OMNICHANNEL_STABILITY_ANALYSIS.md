# 🔍 Omnichannel Service Stability Analysis

## 📊 Current Issue Summary

**Problem**: 19x service restarts observed in logs with frequent WebSocket connections/disconnections

**Symptoms**:
- Frequent client connections/disconnections
- Heavy OPTIONS requests (CORS preflight storms)
- Multiple concurrent API calls to same endpoints
- Service instability requiring frequent restarts

## 🚨 Root Cause Analysis

### High Probability Issues:

#### 1. **WebSocket Connection Storm** 🌪️
**Evidence**: 
```
[Nest] Client K10qEiARdCsLX5DtAAAP joined tenant:80dbe376-1884-4505-ab53-344ad53e7e5c
[Nest] Client disconnected: K10qEiARdCsLX5DtAAAP
[Nest] Client xcnbkIfCMBbVtAuoAAAR joined tenant:80dbe376-1884-4505-ab53-344ad53e7e5c
```

**Impact**: Rapid connect/disconnect cycles causing:
- Memory leaks in socket handlers
- Database connection pool exhaustion
- Event handler accumulation

#### 2. **API Request Storm** ⛈️
**Evidence**:
```
[Http] OPTIONS /v1/conversations?channelId=d80c3386-0190-472e-b2e0-186879c820f9 204 1ms
[Http] OPTIONS /v1/teams/my 204 0ms
[Http] OPTIONS /v1/reports/dashboard 204 2ms
```

**Impact**: 
- CORS preflight overload
- Rate limiting triggers
- Server resource exhaustion

#### 3. **Token Polling Frequency** ⏱️
**Current**: 2000ms polling interval
**Issue**: Too frequent token refreshes causing connection churn

#### 4. **Memory Leaks in Socket Management** 🧠
**Issue**: Shared socket references not properly cleaned up
**Impact**: Gradual memory increase leading to OOM kills

## 🛠️ Immediate Solutions

### Frontend Optimizations (Implemented)

#### ✅ **Optimized Socket Hook Created**
- **File**: `useOmnichannelSocketOptimized.tsx`
- **Improvements**:
  - Token polling increased from 2s to 10s
  - Reconnection attempts reduced from 5 to 3
  - Reconnection delay increased from 2s to 5s
  - Debounced API calls to prevent storms
  - Proper socket cleanup with TTL
  - Connection state tracking

#### ✅ **Key Optimizations**:
```typescript
const TOKEN_POLL_MS = 10000; // Increased from 2000ms
const RECONNECTION_ATTEMPTS = 3; // Reduced from 5
const RECONNECTION_DELAY = 5000; // Increased from 2000ms
const CATCH_UP_WINDOW_MS = 2 * 60 * 1000; // Reduced from 5 minutes
```

### Backend Recommendations

#### 🚀 **Immediate Actions**:

1. **Implement Connection Rate Limiting**
```typescript
// Add to WebSocket gateway
const CONNECTION_RATE_LIMIT = new Map<string, number>();
const MAX_CONNECTIONS_PER_MINUTE = 10;
```

2. **Add Health Check Optimization**
```typescript
// Reduce health check frequency
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds instead of 1-2 seconds
```

3. **Database Connection Pool Tuning**
```typescript
// Increase pool size and add connection timeout
const DB_POOL_CONFIG = {
  min: 5,
  max: 20,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
};
```

4. **CORS Configuration Optimization**
```typescript
// Cache preflight responses
app.options('*', cors({
  maxAge: 86400, // 24 hours
  credentials: true
}));
```

## 📈 Performance Monitoring

### Key Metrics to Track:

1. **WebSocket Connections**
   - Connection rate per minute
   - Average connection duration
   - Concurrent connections count

2. **API Request Patterns**
   - OPTIONS request frequency
   - Request response times
   - Error rates by endpoint

3. **Memory Usage**
   - Heap size trends
   - Garbage collection frequency
   - Socket reference counts

4. **Database Performance**
   - Connection pool usage
   - Query execution times
   - Connection timeout rates

## 🔧 Implementation Steps

### Phase 1: Immediate (Today)
- [x] Create optimized socket hook
- [ ] Deploy frontend optimizations
- [ ] Monitor connection patterns

### Phase 2: Backend (This Week)
- [ ] Implement connection rate limiting
- [ ] Optimize CORS configuration
- [ ] Add connection monitoring
- [ ] Tune database connection pools

### Phase 3: Monitoring (Next Week)
- [ ] Add metrics dashboard
- [ ] Set up alerting thresholds
- [ ] Implement auto-scaling rules

## 🎯 Success Criteria

### Stability Targets:
- **Service restarts**: < 1 per day (currently 19+)
- **WebSocket connection success rate**: > 99%
- **API response times**: < 200ms (95th percentile)
- **Memory usage**: Stable, no gradual increase

### Performance Targets:
- **Connection establishment**: < 1 second
- **Message delivery**: < 500ms
- **UI responsiveness**: < 100ms for user interactions

## 🚨 Emergency Procedures

### If Service Becomes Unstable:
1. **Enable Connection Throttling**
2. **Increase Token Polling to 30s**
3. **Disable Non-Critical Features**
4. **Scale Up Resources**
5. **Implement Circuit Breakers**

## 📝 Next Steps

1. **Deploy Optimized Socket Hook**
2. **Monitor for 24 hours**
3. **Implement Backend Optimizations**
4. **Set Up Long-term Monitoring**
5. **Document Performance Baselines**

---

**Priority**: 🔴 **Critical** - Service stability impacts user experience
**ETA**: 2-3 days for full implementation
**Owner**: Development Team
**Review Date**: 2026-02-26
