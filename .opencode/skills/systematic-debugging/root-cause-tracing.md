# Root Cause Tracing

## Overview

Bugs often manifest deep in the call stack. Your instinct is to fix where the error appears, but that's treating a symptom.

**Core principle:** Trace backward through the call chain until you find the original trigger, then fix at the source.

## The Tracing Process

### 1. Observe the Symptom
Note the error message and location.

### 2. Find Immediate Cause
What code directly causes this?

### 3. Ask: What Called This?
Trace back through the call chain.

### 4. Keep Tracing Up
What value was passed? Where did it come from?

### 5. Find Original Trigger
Where did the bad value originate?

## Adding Stack Traces

When you can't trace manually, add instrumentation:

```typescript
async function riskyOperation(directory: string) {
  const stack = new Error().stack;
  console.error('DEBUG:', {
    directory,
    cwd: process.cwd(),
    stack,
  });
  // ... operation
}
```

## Key Principle

**NEVER fix just where the error appears.** Trace back to find the original trigger.

## Stack Trace Tips

- In tests: Use `console.error()` not logger
- Before operation: Log before the dangerous operation
- Include context: Directory, cwd, environment variables
- Capture stack: `new Error().stack`
