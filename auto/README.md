# Autoresearch — Autonomous Optimization Loop

Adapted from [pi-autoresearch](https://github.com/davebcn87/pi-autoresearch) for Pho.Chat.

## What is this?

Agent tự edit code → build → đo metric → giữ/revert → lặp vô hạn.
Pattern lấy cảm hứng từ [karpathy/autoresearch](https://github.com/karpathy/autoresearch).

## Directory Structure

```
auto/
├── bundle/                     # Bundle size optimization
│   ├── autoresearch.md         # Session doc (agent reads this)
│   ├── measure.mjs             # Benchmark script
│   └── checks.mjs              # Correctness gate
├── autoresearch.jsonl           # Append-only log of all runs
└── README.md                   # This file
```

## How to Run

```bash
# 1. Create branch
git checkout -b autoresearch/bundle-opt-YYYYMMDD

# 2. Baseline
node auto/bundle/measure.mjs

# 3. Agent loops: brainstorm → implement → measure → keep/revert → repeat
```

## For Agents

Read `.agents/skills/autoresearch/SKILL.md` for full loop instructions.
Read `auto/bundle/autoresearch.md` for session context.
