---
name: writing-skills
description: Use when creating new skills or improving existing ones - guides the development and testing of skills following best practices
---

# Writing Skills

## Overview

Skills are instructions that shape agent behavior. They are code, not prose — every word affects how agents act.

**Core principle:** Skills must be testable, specific, and actionable. Vague guidance produces vague results.

## Skill Structure

Every skill has a SKILL.md file with:

```markdown
---
name: skill-name
description: Use when [trigger condition] - [what it does]
---

# Skill Title

## Overview
[1-2 sentences: what this skill does and why]

[Core principle]

## When to Use
[Specific triggers]

## The Process
[Step-by-step instructions]

## Red Flags
[What NOT to do]
```

## Key Principles

1. **Trigger conditions in description** — The `description` field determines when agents invoke the skill. Make it specific.
2. **Actionable steps** — Every instruction must be something an agent can execute.
3. **No vague guidance** — "Be careful" means nothing. "Check X before Y" is actionable.
4. **Red flags section** — List specific rationalizations agents will use to skip the skill.
5. **Gate functions** — For critical checkpoints, write explicit if/then logic.
6. **Test with adversarial prompts** — Try to make the agent skip or misapply the skill.

## Testing Skills

1. Write the skill
2. Use it in a real session
3. Try to break it (adversarial testing)
4. Refine based on actual agent behavior
5. Repeat until robust

## Common Mistakes

- **Too abstract:** "Follow best practices" → agents interpret differently
- **Too rigid:** Doesn't adapt to different project types
- **No red flags:** Agents rationalize skipping without pushback
- **Untested:** Looks good on paper, fails in practice
