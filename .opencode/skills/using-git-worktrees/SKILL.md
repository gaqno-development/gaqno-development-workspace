---
name: using-git-worktrees
description: Use when starting feature work that needs isolation from current workspace or before executing implementation plans - creates isolated git worktrees with smart directory selection and safety verification
---

# Using Git Worktrees

## Overview

Git worktrees create isolated workspaces sharing the same repository, allowing work on multiple branches simultaneously without switching.

**Core principle:** Systematic directory selection + safety verification = reliable isolation.

**Announce at start:** "I'm using the using-git-worktrees skill to set up an isolated workspace."

## Directory Selection Process

### 1. Check Existing Directories

```bash
ls -d .worktrees 2>/dev/null     # Preferred (hidden)
ls -d worktrees 2>/dev/null      # Alternative
```

**If found:** Use that directory. If both exist, `.worktrees` wins.

### 2. Check CLAUDE.md

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**If preference specified:** Use it without asking.

### 3. Ask User

If no directory exists and no preference found, ask.

## Safety Verification

### For Project-Local Directories

**MUST verify directory is ignored before creating worktree:**

```bash
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**If NOT ignored:** Add to .gitignore and commit before proceeding.

### For Global Directory

No .gitignore verification needed.

## Creation Steps

1. **Detect Project Name:** `project=$(basename "$(git rev-parse --show-toplevel)")`
2. **Create Worktree:** `git worktree add "$path" -b "$BRANCH_NAME"`
3. **Run Project Setup:** Auto-detect (package.json → npm install, etc.)
4. **Verify Clean Baseline:** Run tests to ensure worktree starts clean
5. **Report Location:** Show path, test results, ready status

## Red Flags

**Never:**
- Create worktree without verifying it's ignored (project-local)
- Skip baseline test verification
- Proceed with failing tests without asking
- Assume directory location when ambiguous

**Always:**
- Follow directory priority: existing > CLAUDE.md > ask
- Verify directory is ignored for project-local
- Auto-detect and run project setup
- Verify clean test baseline

## Integration

**Called by:**
- **brainstorming** - When design is approved and implementation follows
- **subagent-driven-development** - Before executing any tasks
- **executing-plans** - Before executing any tasks

**Pairs with:**
- **finishing-a-development-branch** - Cleanup after work complete
