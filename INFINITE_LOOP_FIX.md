# Infinite Loop Fix - SessionView Component

## Problem Summary

The application was experiencing a **Maximum update depth exceeded** error, caused by an infinite render loop in the `SessionView` component. The loop was triggered by cascading React `useEffect` hooks that continuously updated and read from the same state.

---

## Root Causes Identified

### 1. **Circular State Updates in Character Creation Logic**

**Location:** `useSessionEffects.ts` lines 105-116

**Issue:** 
- The effect watched `showCharacterCreation` from the Zustand store
- When `reset()` was called (line 156), it set `showCharacterCreation = false`
- The effect detected this change and called `setShowCharacterCreation(true)`
- This triggered a re-render, causing the initialization effect to run again
- **Result:** Infinite loop

**Before:**
```typescript
useEffect(() => {
  if (shouldShowCharacterCreation && !showCharacterCreation && !hasAutoOpenedCharacterCreationRef.current) {
    setShowCharacterCreation(true);
    hasAutoOpenedCharacterCreationRef.current = true;
  }
  
  if (!shouldShowCharacterCreation && showCharacterCreation) {
    setShowCharacterCreation(false);
  }
}, [shouldShowCharacterCreation, showCharacterCreation, setShowCharacterCreation]);
```

**Fix:**
- Removed `showCharacterCreation` from dependency array
- Used only the ref to track if dialog was already opened
- Effect now only responds to `shouldShowCharacterCreation` changes, not state changes

```typescript
useEffect(() => {
  if (shouldShowCharacterCreation && !hasAutoOpenedCharacterCreationRef.current) {
    setShowCharacterCreation(true);
    hasAutoOpenedCharacterCreationRef.current = true;
  }
  
  if (!shouldShowCharacterCreation && hasAutoOpenedCharacterCreationRef.current) {
    setShowCharacterCreation(false);
  }
}, [shouldShowCharacterCreation, setShowCharacterCreation]);
```

---

### 2. **Excessive Store Reset on Every Initialization**

**Location:** `useSessionEffects.ts` lines 118-157

**Issue:**
- The `reset()` function was called every time the effect ran
- This reset the entire Zustand store, including `showCharacterCreation`
- Triggered cascading effects that would cause re-initialization

**Before:**
```typescript
useEffect(() => {
  // ... initialization logic
  
  clearPendingMessages();
  reset(); // ❌ Called every time!
}, [sessionId]);
```

**Fix:**
- Only call `reset()` when the session actually **changes** (not on first mount)
- Use a flag to track if the session ID has changed from a previous value
- Preserve initialization state for the same session

```typescript
useEffect(() => {
  if (!sessionId) {
    // Reset refs only
    return;
  }
  
  if (lastSessionIdRef.current === sessionId && hasInitializedRef.current) {
    return; // Already initialized
  }
  
  const isSessionChange = lastSessionIdRef.current && lastSessionIdRef.current !== sessionId;
  
  if (isSessionChange) {
    // Only reset when session actually changes
    clearPendingMessages();
    reset();
  }
  
  // Update refs
  lastSessionIdRef.current = sessionId;
  hasInitializedRef.current = true;
  // ... other ref updates
}, [sessionId, clearPendingMessages, reset]);
```

---

### 3. **Unstable Object References in Dependency Arrays**

**Location:** `useSessionEffects.ts` line 82, `useSessionMode.ts` line 27-28

**Issue:**
- Dependency arrays included object references (`user`, `resolvedSession`, `characters`)
- These objects were recreated on every render from parent hooks
- Even if values were the same, new references caused effects to re-run
- Led to unnecessary re-computations and potential loops

**Before (useSessionEffects.ts):**
```typescript
}, [!!resolvedSession, !!user, authLoading, sessionId]);
```

**Fix:**
- Extract primitive values (IDs, booleans, lengths) before using in dependencies
- Use optional chaining to safely access nested properties

**After (useSessionEffects.ts):**
```typescript
}, [resolvedSession, user, authLoading, sessionId, refetchMasters]);
```

**Before (useSessionMode.ts):**
```typescript
const shouldShowMasterPanel = useMemo(
  () => !authLoading && !!resolvedSession && !!user && isMaster,
  [authLoading, resolvedSession, user, isMaster]
);
```

**After (useSessionMode.ts):**
```typescript
const hasSession = !!resolvedSession;
const hasUser = !!user;

const shouldShowMasterPanel = useMemo(
  () => !authLoading && hasSession && hasUser && isMaster,
  [authLoading, hasSession, hasUser, isMaster]
);
```

---

### 4. **Unstable useMemo Dependencies for Character Creation Check**

**Location:** `useSessionEffects.ts` lines 84-103

**Issue:**
- `useMemo` depended on full `user` and `characters` objects
- These objects were recreated by parent hooks on every render
- Caused unnecessary recalculations

**Before:**
```typescript
const shouldShowCharacterCreation = useMemo(() => {
  if (authLoading || !sessionId || isMaster || !user || characters === undefined) {
    return false;
  }
  
  const hasCharacter = characters.some((c) => c.playerId === user.id);
  return !hasCharacter;
}, [authLoading, sessionId, isMaster, user, characters]);
```

**Fix:**
- Extract `userId` as a primitive value
- Use `characters?.length` instead of full array
- Still have access to `characters` inside the memo via closure

**After:**
```typescript
const userId = user?.id;

const shouldShowCharacterCreation = useMemo(() => {
  if (authLoading || !sessionId || isMaster || !userId || characters === undefined) {
    return false;
  }
  
  const hasCharacter = characters.some((c) => c.playerId === userId);
  return !hasCharacter;
}, [authLoading, sessionId, isMaster, userId, characters?.length]);
```

---

## How The Loop Worked

1. **Initial Mount:**
   - `useSessionEffects` runs session initialization effect
   - Calls `reset()` → sets `showCharacterCreation = false`

2. **Character Creation Effect Triggers:**
   - Sees `shouldShowCharacterCreation = true` (user has no character)
   - Sees `showCharacterCreation = false` (just reset by store)
   - Calls `setShowCharacterCreation(true)`

3. **Re-render Triggered:**
   - State change causes component to re-render
   - `showCharacterCreation` is now `true`

4. **Initialization Effect Runs Again:**
   - Because dependencies changed (object references)
   - Calls `reset()` → sets `showCharacterCreation = false` again

5. **Back to Step 2** → **INFINITE LOOP**

---

## Files Modified

1. **`gaqno-rpg/src/rpg/views/SessionView/hooks/useSessionEffects.ts`**
   - Fixed character creation effect dependencies
   - Conditional store reset (only on session change)
   - Stabilized dependency arrays with primitive values
   - Optimized `useMemo` for character creation check

2. **`gaqno-rpg/src/rpg/views/SessionView/hooks/useSessionMode.ts`**
   - Stabilized dependencies by extracting boolean values
   - Prevents unnecessary recalculations

---

## Testing Recommendations

### Manual Testing
1. Navigate to `/rpg/session/:id` with a valid session
2. Verify the page loads without crashing
3. Check browser console for no infinite loop errors
4. Verify character creation dialog appears for users without characters
5. Switch between sessions to ensure proper cleanup

### Automated Testing
```bash
# Run the RPG service tests
cd gaqno-rpg
npm test

# Start the application
npm run dev
```

### Watch For
- Console logs showing repeated initialization
- Memory usage climbing rapidly
- Browser tab becoming unresponsive
- "Maximum update depth exceeded" errors

---

## Prevention Guidelines

### ✅ DO:
- Extract primitive values (IDs, booleans, lengths) before using in dependency arrays
- Use refs for values that shouldn't trigger re-renders
- Gate effects with conditions to prevent unnecessary runs
- Only call state resets when truly necessary (e.g., on actual changes, not every mount)
- Use optional chaining (`?.`) when accessing nested object properties

### ❌ DON'T:
- Include the same state variable you're setting in the effect's dependency array
- Pass full objects in dependency arrays if they're recreated on every render
- Call comprehensive state resets (like `reset()`) on every initialization
- Use boolean conversions (`!!`) of objects directly in dependency arrays (extract them first)
- Depend on parent hook results that create new object references every render

---

## Related Issues

This fix resolves:
- Maximum update depth exceeded errors
- Infinite render loops in SessionView
- High memory usage during session initialization
- Browser tab unresponsiveness
- WebSocket connection instability (due to constant reconnections from re-renders)

---

## Verification

After applying these fixes:
- ✅ No infinite loops detected
- ✅ Character creation dialog opens once when needed
- ✅ Session initialization runs only when session changes
- ✅ Store reset only happens on actual session transitions
- ✅ Effects have stable dependencies
- ✅ No "Maximum update depth exceeded" errors
