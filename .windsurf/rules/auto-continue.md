---
trigger: model_decision
description: Auto-continue implementation until task completion
globs: "**/*"
---

# Auto-Continue Rule

When implementing a multi-phase plan:
1. **Never ask user to continue** - proceed automatically through all phases
2. **Work autonomously** until the entire task is complete
3. **Update todo_list** after each phase completion
4. **Only stop** for true blockers requiring user input (errors, unclear requirements)
5. **Report completion** with final summary when all phases done

Applies to: feature implementation, refactoring, multi-step improvements.
