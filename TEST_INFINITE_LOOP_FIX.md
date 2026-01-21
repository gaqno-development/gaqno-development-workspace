# Testing the Infinite Loop Fix

## Quick Test Steps

### 1. Start the Application

```bash
# If using Docker
docker-compose up gaqno-rpg gaqno-rpg-service

# Or if running locally
cd gaqno-rpg
npm run dev
```

### 2. Open Browser and Test

1. Open Chrome/Firefox DevTools (F12)
2. Go to the **Console** tab
3. Navigate to a RPG session: `http://localhost:3000/rpg/session/[session-id]`

### 3. What to Watch For

#### ✅ SUCCESS Indicators:
- Page loads without crashing
- Console shows initialization logs **only once**
- No "Maximum update depth exceeded" errors
- Character creation dialog appears (if you don't have a character)
- Memory usage stays stable (check DevTools Performance tab)

#### ❌ FAILURE Indicators:
- Browser tab becomes unresponsive
- Console shows repeated "Initializing session" logs
- Memory usage climbs rapidly
- React error: "Maximum update depth exceeded"
- Page crashes or freezes

### 4. Console Log Check

You should see logs like this **once**:

```
[useSessionEffects] Session init effect: { sessionId: "...", hasInitialized: false }
[useSessionEffects] Initializing session, resetting state
[useSessionEffects] Character creation check: { ... }
```

You should **NOT** see these logs repeating infinitely.

### 5. Advanced Testing

#### Test Session Switching:
1. Load session A
2. Navigate to session B
3. Check that:
   - Store reset happens once
   - Old session localStorage is cleaned up
   - New session initializes properly

#### Test Character Creation:
1. Load a session where you don't have a character
2. Character creation dialog should appear **once**
3. Create a character
4. Dialog should close and **not reopen**

#### Test WebSocket Reconnection:
1. Load a session
2. Check Network tab in DevTools
3. WebSocket should connect **once**, not repeatedly

### 6. Performance Check

Open Chrome DevTools → Performance tab:

1. Start recording
2. Navigate to a session
3. Stop recording after 5 seconds
4. Check for:
   - ✅ Normal: Initialization spike, then stable
   - ❌ Problem: Continuous re-renders and state updates

---

## If Issues Persist

### Check for Related Problems:

1. **Verify files are saved:**
   ```bash
   git diff gaqno-rpg/src/rpg/views/SessionView/hooks/
   ```

2. **Clear build cache:**
   ```bash
   cd gaqno-rpg
   rm -rf .next node_modules/.cache
   npm run dev
   ```

3. **Check for other infinite loops:**
   - Look for other `useEffect` hooks with state setters in dependencies
   - Check for `useMemo` or `useCallback` that create new objects in each render

4. **Enable React DevTools Profiler:**
   - Install React DevTools browser extension
   - Open Profiler tab
   - Record a session load
   - Look for components re-rendering excessively

---

## Debugging Commands

### Check Memory Usage:
```javascript
// In browser console
console.log(performance.memory.usedJSHeapSize / 1048576 + ' MB');
```

### Monitor Re-renders:
Add this to `SessionView.tsx` temporarily:
```typescript
useEffect(() => {
  console.log('[SessionView] Rendered at', new Date().toISOString());
});
```

### Count Effect Runs:
Add this to `useSessionEffects.ts` temporarily:
```typescript
const renderCountRef = useRef(0);
useEffect(() => {
  renderCountRef.current++;
  console.log('[useSessionEffects] Effect run count:', renderCountRef.current);
}, [sessionId]);
```

---

## Success Criteria

- ✅ Page loads in < 2 seconds
- ✅ Console shows max 3-5 initialization logs (not hundreds)
- ✅ Memory usage stays under 100MB after load
- ✅ No infinite loop errors
- ✅ Character creation works correctly
- ✅ WebSocket connects once and stays connected
- ✅ Session switching works without crashes

---

## Report Issues

If the infinite loop persists, collect:

1. Full console logs (first 100 lines)
2. React DevTools Profiler screenshot
3. Network tab showing WebSocket connections
4. Memory usage graph from Performance tab
5. Browser and React versions

Then provide this information for further debugging.
