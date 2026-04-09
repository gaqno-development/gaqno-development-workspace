---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS find root cause before attempting fixes. Symptom fixes are failure.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## When to Use

Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

## The Four Phases

You MUST complete each phase before proceeding to the next.

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully** - Don't skip past errors or warnings. Read stack traces completely.
2. **Reproduce Consistently** - Can you trigger it reliably? What are the exact steps?
3. **Check Recent Changes** - What changed that could cause this? Git diff, recent commits.
4. **Gather Evidence in Multi-Component Systems** - Add diagnostic instrumentation at each component boundary.
5. **Trace Data Flow** - Where does bad value originate? Keep tracing up until you find the source.

### Phase 2: Pattern Analysis

1. **Find Working Examples** - Locate similar working code in same codebase
2. **Compare Against References** - Read reference implementation COMPLETELY
3. **Identify Differences** - What's different between working and broken?
4. **Understand Dependencies** - What other components does this need?

### Phase 3: Hypothesis and Testing

1. **Form Single Hypothesis** - State clearly: "I think X is the root cause because Y"
2. **Test Minimally** - Make the SMALLEST possible change to test hypothesis
3. **Verify Before Continuing** - Didn't work? Form NEW hypothesis. DON'T add more fixes on top.
4. **When You Don't Know** - Say "I don't understand X". Don't pretend to know.

### Phase 4: Implementation

1. **Create Failing Test Case** - MUST have before fixing
2. **Implement Single Fix** - Address root cause. ONE change at a time.
3. **Verify Fix** - Test passes now? No other tests broken?
4. **If Fix Doesn't Work** - If >= 3 fixes failed: STOP and question the architecture.
5. **If 3+ Fixes Failed: Question Architecture** - Discuss with your human partner before attempting more fixes.

## Red Flags - STOP and Follow Process

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- Proposing solutions before tracing data flow

**ALL of these mean: STOP. Return to Phase 1.**

## Supporting Techniques

- **root-cause-tracing.md** - Trace bugs backward through call stack
- **defense-in-depth.md** - Add validation at multiple layers after finding root cause
- **condition-based-waiting.md** - Replace arbitrary timeouts with condition polling

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **1. Root Cause** | Read errors, reproduce, check changes, gather evidence | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare | Identify differences |
| **3. Hypothesis** | Form theory, test minimally | Confirmed or new hypothesis |
| **4. Implementation** | Create test, fix, verify | Bug resolved, tests pass |
