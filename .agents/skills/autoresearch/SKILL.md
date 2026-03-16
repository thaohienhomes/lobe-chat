---
name: autoresearch
description: Set up and run an autonomous experiment loop for any optimization target. Use when asked to "run autoresearch", "optimize X in a loop", "start experiments", or "bundle optimization". Adapted from pi-autoresearch for non-Pi agents.
---

# Autoresearch

Autonomous experiment loop: try ideas, keep what works, discard what doesn't, never stop.

## Overview

This is an adaptation of [pi-autoresearch](https://github.com/davebcn87/pi-autoresearch) for agents that don't have Pi extension tools. Instead of `run_experiment`/`log_experiment`, we use bash/node commands directly.

## Setup (if not already done)

1. Check if `auto/<topic>/autoresearch.md` exists — if yes, skip to Loop.
2. Ask (or infer): **Goal**, **Command**, **Metric** (+ direction), **Files in scope**, **Constraints**.
3. `git checkout -b autoresearch/<goal>-<date>`
4. Read the source files in scope. Understand the workload deeply before writing anything.
5. Create `auto/<topic>/autoresearch.md` — session doc (see template below).
6. Create `auto/<topic>/measure.mjs` — benchmark script outputting `METRIC name=number` lines.
7. Create `auto/<topic>/checks.mjs` — optional correctness gate.
8. Run baseline → record in `autoresearch.jsonl` → start looping.

## Loop Rules

**LOOP FOREVER.** Never ask "should I continue?" — the user expects autonomous work.

For EACH iteration:

1. Read `auto/<topic>/autoresearch.md` to understand context
2. Brainstorm 1 specific optimization idea
3. Implement the change (usually 1-3 files)
4. Run: `node auto/<topic>/measure.mjs`
5. If metric improved:
   - Run: `node auto/<topic>/checks.mjs`
   - If checks pass → `git add -A && git commit -m "autoresearch: <description>"`
   - If checks fail → `git checkout .` to revert
6. If metric worse or same → `git checkout .` to revert
7. Append result to `autoresearch.jsonl`:
   ```json
   {"run": N, "metric": X, "status": "kept|reverted|checks_failed", "description": "..."}
   ```
8. Update `autoresearch.md` (What's Been Tried, Dead Ends, Key Wins)
9. Repeat from step 1

### Decision Rules

- **Primary metric is king.** Improved → keep. Worse/equal → revert.
- **Simpler is better.** Removing code for equal perf = keep.
- **Don't thrash.** Repeatedly reverting the same idea? Try something different.
- **Think longer when stuck.** Re-read source files, study the data.

### Stopping Conditions

- User interrupts
- 20 consecutive runs with no improvement
- Context limit reached (update autoresearch.md so next agent can resume)

## For Bundle Size Optimization

Pre-configured files exist at `auto/bundle/`:

```
auto/bundle/
├── autoresearch.md     # Session doc — read this first
├── measure.mjs         # Build + measure bundle size
└── checks.mjs          # Type-check correctness gate
```

### Commands

```bash
# Measure baseline
node auto/bundle/measure.mjs

# Run correctness checks
node auto/bundle/checks.mjs
```

### Start

```bash
git checkout -b autoresearch/bundle-opt-<YYYYMMDD>
node auto/bundle/measure.mjs   # baseline
# start looping
```

## Session File Template

```markdown
# Autoresearch: <goal>

## Objective
<What we're optimizing>

## Metrics
- **Primary**: <name> (<unit>, lower/higher is better)
- **Secondary**: ...

## How to Run
`node auto/<topic>/measure.mjs`

## Files in Scope
<files the agent may modify>

## Off Limits
<files that must NOT be touched>

## Constraints
<hard rules>

## What's Been Tried
(update per iteration)

## Dead Ends
(approaches that failed)

## Key Wins
(approaches that worked)
```
