---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching fresh subagent per task, with two-stage review after each: spec compliance review first, then code quality review.

**Why subagents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task.

**Core principle:** Fresh subagent per task + two-stage review (spec then quality) = high quality, fast iteration

## When to Use

- Have an implementation plan with mostly independent tasks
- Want to stay in this session
- Use superpowers:executing-plans for parallel session instead

## The Process

1. Read plan, extract all tasks with full text, note context, create TodoWrite
2. For each task:
   a. Dispatch implementer subagent (see implementer-prompt.md)
   b. Handle implementer questions if any
   c. Implementer implements, tests, commits, self-reviews
   d. Dispatch spec reviewer subagent (see spec-reviewer-prompt.md)
   e. If spec issues found, implementer fixes and re-review
   f. Dispatch code quality reviewer subagent (see code-quality-reviewer-prompt.md)
   g. If quality issues found, implementer fixes and re-review
   h. Mark task complete
3. After all tasks: dispatch final code reviewer for entire implementation
4. Use superpowers:finishing-a-development-branch

## Model Selection

Use the least powerful model that can handle each role to conserve cost and increase speed.

- **Mechanical implementation** (isolated functions, clear specs, 1-2 files): fast, cheap model
- **Integration and judgment** (multi-file coordination, pattern matching): standard model
- **Architecture, design, and review**: most capable available model

## Handling Implementer Status

- **DONE:** Proceed to spec compliance review
- **DONE_WITH_CONCERNS:** Read concerns before proceeding
- **NEEDS_CONTEXT:** Provide missing context and re-dispatch
- **BLOCKED:** Assess blocker — provide more context, use more capable model, or break task down

## Prompt Templates

- `./implementer-prompt.md` - Dispatch implementer subagent
- `./spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `./code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent

## Red Flags

**Never:**
- Start implementation on main/master branch without explicit user consent
- Skip reviews (spec compliance OR code quality)
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel (conflicts)
- Make subagent read plan file (provide full text instead)
- Skip review loops (reviewer found issues = implementer fixes = review again)
- **Start code quality review before spec compliance is approved**

## Integration

**Required workflow skills:**
- **superpowers:using-git-worktrees** - Set up isolated workspace before starting
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:requesting-code-review** - Code review template for reviewer subagents
- **superpowers:finishing-a-development-branch** - Complete development after all tasks

**Subagents should use:**
- **superpowers:test-driven-development** - Subagents follow TDD for each task
