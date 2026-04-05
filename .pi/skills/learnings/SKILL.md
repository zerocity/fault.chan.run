---
name: learnings
description: "Self-learning system that captures patterns from development and reviews, then promotes recurring ones into skill improvements."
---

# Learnings Skill

Capture observations during work and promote **recurring patterns** into skill rules.

## Capture — Observing Patterns

Only log when something is **likely to recur**:

- Same kind of issue showed up before
- A review keeps finding the same category of problem
- An assumption turned out wrong and others might make the same one
- A missing convention caused confusion that will happen again

### Log format

Append to `docs/learnings.log`:

```
## YYYY-MM-DD — [short title]

Context: [phase/task or review]
Pattern: [what keeps happening]
Why it recurs: [root cause]
Prevention: [what convention or change would eliminate this]

---
```

## Promote — Turning Patterns Into Skills

Before ending a session, review `docs/learnings.log`:

- Pattern appeared more than once → **must promote**
- Pattern reveals a missing convention → **should promote**
- Pattern would cost >30 min if hit again → **should promote**

Promotion = add a concrete rule to the appropriate skill file.
Mark promoted entries with `Promoted: [skill-name]`.

## Escalation

If a pattern reappears after promotion, the fix was cosmetic.
Find the **structural cause** and change the workflow structure —
reorder steps, add required artifacts, split commits.
Do NOT just add stronger wording.
