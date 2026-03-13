# CLAUDE.md

This document serves as a shared guideline for all team members when using Claude Code in this repository.

## Tech Stack

read @.cursor/rules/project-introduce.mdc

## Directory Structure

read @.cursor/rules/project-structure.mdc

## Development

### Git Workflow

#### ⚠️ CRITICAL: Branch Strategy for pho.chat Production

**This is a solo-developer project. `main` is the single source of truth for production.**

**MANDATORY steps at the START of every session:**

```bash
git checkout main
git pull origin main # Always sync with latest main first
```

**Branch rules:**

- ✅ **ALWAYS start new features from the latest `main` branch**
- ✅ **When feature is complete: merge back into `main` and push**
- ✅ If you must create a feature branch, merge it back to `main` before ending the session
- ❌ **NEVER leave a feature branch unmerged** - unmerged branches cause incomplete production deployments
- ❌ **NEVER promote a Preview deployment to Production** without verifying it contains ALL features from `main`

**Why this matters:**

- Vercel deploys whatever branch you tell it to - a partial branch = partial production
- `main` must always contain 100% of all shipped features
- If you're unsure what's in `main`, run: `git log --oneline origin/main -10`

**Preferred workflow:**

```bash
# Start of session
git checkout main && git pull origin main

# Make changes directly on main (for small features)
# OR create branch + merge back immediately after
git checkout -b feat/my-feature
# ... do work ...
git checkout main
git merge feat/my-feature
git push origin main
```

#### QUAN TRỌNG: Visualizer Feature Branch

**KHÔNG BAO GIỜ push trực tiếp lên main.** Tất cả code mới commit vào branch hiện tại (`feat/visualizer`). Khi cần deploy staging, push lên origin branch hiện tại — Vercel sẽ tạo Preview deployment tự động.

#### Other Git Rules

- use rebase for git pull (when pulling into a feature branch)
- git commit message must prefix with gitmoji
- git branch name format: `claude/feature-description` or `feat/feature-name`
- use .github/PULL_REQUEST_TEMPLATE.md to generate pull request description

### Package Management

This repository adopts a monorepo structure.

- Use `pnpm` as the primary package manager for dependency management
- Use `bun` to run npm scripts
- Use `bunx` to run executable npm packages

### TypeScript Code Style Guide

see @.cursor/rules/typescript.mdc

### Modify Code Rules

- **Code Language**:
  - For files with existing Chinese comments: Continue using Chinese to maintain consistency
  - For new files or files without Chinese comments: MUST use American English.
    - eg: new react tsx file and new test file
- Conservative for existing code, modern approaches for new features

### Testing

Testing work follows the Rule-Aware Task Execution system above.

- **Required Rule**: `testing-guide/testing-guide.mdc`
- **Command**:
  - web: `bunx vitest run --silent='passed-only' '[file-path-pattern]'`
  - packages(eg: database): `cd packages/database && bunx vitest run --silent='passed-only' '[file-path-pattern]'`

**Important**:

- wrapped the file path in single quotes to avoid shell expansion
- Never run `bun run test` etc to run tests, this will run all tests and cost about 10mins
- If try to fix the same test twice, but still failed, stop and ask for help.

### Typecheck

- use `bun run type-check` to check type errors.

### i18n

- **Keys**: Add to `src/locales/default/namespace.ts`
- **Dev**: Translate `locales/zh-CN/namespace.json` locale file only for preview
- DON'T run `pnpm i18n`, let CI auto handle it

## Rules Index

Some useful rules of this project. Read them when needed.

**IMPORTANT**: All rule files referenced in this document are located in the `.cursor/rules/` directory. Throughout this document, rule files are referenced by their filename only for brevity.

### 📋 Complete Rule Files

**Core Development**

- `backend-architecture.mdc` - Three-layer architecture, data flow
- `react-component.mdc` - antd-style, Lobe UI usage
- `drizzle-schema-style-guide.mdc` - Schema naming, patterns
- `define-database-model.mdc` - Model templates, CRUD patterns
- `i18n.mdc` - Internationalization workflow

**State & UI**

- `zustand-slice-organization.mdc` - Store organization
- `zustand-action-patterns.mdc` - Action patterns
- `packages/react-layout-kit.mdc` - flex layout components usage

**Testing & Quality**

- `testing-guide/testing-guide.mdc` - Test strategy, mock patterns
- `code-review.mdc` - Review process and standards

**Desktop (Electron)**

- `desktop-feature-implementation.mdc` - Main/renderer process patterns
- `desktop-local-tools-implement.mdc` - Tool integration workflow
- `desktop-menu-configuration.mdc` - App menu, context menu, tray menu
- `desktop-window-management.mdc` - Window creation, state management, multi-window
- `desktop-controller-tests.mdc` - Controller unit testing guide

---

## Product Requirements Documents

PRD files nằm tại `docs/prd/`. Agent PHẢI đọc PRD trước khi implement bất kỳ feature nào
thuộc Interactive & Generative UI.

### Danh sách PRD

- `docs/prd/prd-interactive-generative-ui.md` — Tổng quan 5 phases + kiến trúc tích hợp
- `docs/prd/phase-2.5-content-visualizer.md` — Chi tiết 7-agent pipeline, schemas, file structure

### Implementation Priority

Bắt đầu từ Phase 1 (Interactive Images) trừ khi được chỉ định khác.
Đọc section "Implementation Priority" trong mỗi PRD để biết thứ tự triển khai.

### 5 Phases Overview

| Phase | Codename                                  | Timeline    |
| ----- | ----------------------------------------- | ----------- |
| 1     | Interactive Images (Tap-to-Explore)       | Month 1–2   |
| 2     | Generative Diagrams (Text-to-Interactive) | Month 3–4   |
| 2.5   | Content Visualizer (Paper-to-Visual)      | Month 4–5   |
| 3     | AI Rendering & Virtual Staging            | Month 5–7   |
| 4     | Full Generative UI Engine                 | Month 8–10  |
| 5     | Creator Studio & Collaboration            | Month 11–12 |

### Coding Conventions cho Interactive UI features

- Tất cả components mới đặt trong `src/components/InteractiveUI/` (Phase 1-2)
  hoặc `src/components/ContentVisualizer/` (Phase 2.5)
- Services đặt trong `src/services/content-visualizer/`
- Type definitions đặt trong `src/services/content-visualizer/types/`
- System prompts đặt trong `src/prompts/`
- Dùng Tailwind CSS only trong Artifact components (không custom CSS)
- Tất cả schemas phải match TypeScript interfaces trong PRD
- React functional components with hooks, single file, default export
- Dark theme (#0F172A family)
- Mobile responsive (touch support) + ARIA labels
- NEVER use localStorage/sessionStorage in Artifact components

CLAUDE.md Snippet — Content Visualizer Engine

> Copy-paste this entire block into your project's CLAUDE.md file.
> This gives every Claude Code session the context it needs.

---

```markdown
## Content Visualizer Engine (v2.0)

### What it is

An inline Generative UI system that renders interactive HTML/SVG visualizations
directly within chat messages. Modeled after Claude.ai's Visualizer (show_widget)
architecture, reverse-engineered from production.

### Architecture summary

- Tool-based: AI calls `show_widget` tool → frontend renders in sandboxed iframe
- Streaming: partial HTML streamed via morphdom DOM diffing for progressive rendering
- Guidelines: domain-specific design modules loaded lazily via `read_me` pattern
- Separate from Artifacts: inline + ephemeral vs side-panel + persistent

### Key files

- src/features/visualizer/ — Core engine
- src/features/visualizer/shellHTML.ts — iframe shell with morphdom + CSP + bridges
- src/features/visualizer/VisualizerRenderer.tsx — Main React component
- src/features/visualizer/StreamingManager.ts — 150ms debounced morphdom streaming
- src/features/visualizer/LoadingOverlay.tsx — Loading messages display
- src/features/visualizer/modules/ — Design guideline modules
- src/features/visualizer/modules/general/ — chart, diagram, interactive, mockup, art
- src/features/visualizer/modules/medical/ — prisma, consort, forest-plot, drug-interaction, kaplan-meier, rob
- src/features/visualizer/modules/academic/ — citation-network, methodology-flow, stats-dashboard
- src/features/visualizer/modules/education/ — step-by-step, quiz, math-plot
- src/features/visualizer/modules/ModuleManager.ts — Lazy loader + auto-suggest
- docs/prd/content-visualizer-v2.md — Full PRD
- docs/prd/visualizer-kickstart.md — Sprint-by-sprint implementation guide

### Implementation rules

1. All visualizer output renders inside sandboxed iframe (CSP enforced)
2. iframe sandbox="allow-scripts" — NO allow-same-origin, NO allow-forms, NO allow-popups
3. morphdom for streaming DOM diff (NOT innerHTML replacement)
4. CSS variables for theming — inherit from parent app theme via postMessage
5. Scripts execute ONLY after streaming completes (\_runScripts clones script tags)
6. CDN allowlist: cdnjs.cloudflare.com, cdn.jsdelivr.net, unpkg.com, esm.sh
7. Widget code structure: style → HTML content → script (progressive rendering order)
8. sendPrompt(text) available inside widgets to send messages back to chat
9. ResizeObserver in iframe reports height to parent for auto-sizing
10. 150ms debounce on streaming updates to prevent visual jitter

### Tool definitions

Two built-in tools (not external plugins):

show_widget:
parameters: i_have_seen_read_me (bool), title (string), loading_messages (string[]), widget_code (string)
client-side only — rendering happens in frontend, backend just confirms success

visualizer_read_me:
parameters: modules (string[])
returns: concatenated guideline text for requested modules
silent — no UI rendered for this tool call

### Module system

General: chart, diagram, interactive, mockup, art
Medical: prisma, consort, forest-plot, drug-interaction, kaplan-meier, rob-assessment
Academic: citation-network, methodology-flow, stats-dashboard
Education: step-by-step, quiz, math-plot

Modules loaded lazily via ModuleManager — only requested modules enter context (token efficiency).

### Integration points in lobe-chat

- Message rendering: MessageItem/MessageContent — detect show_widget tool calls, render VisualizerRenderer inline
- Streaming: SSE/WebSocket handler — intercept toolcall_delta for show_widget, feed to StreamingManager
- Tool registration: plugin/tool system — register show_widget and visualizer_read_me as built-in
- System prompt: add Visualizer instructions conditionally (NEXT_PUBLIC_VISUALIZER_ENABLED=true)

### Feature flag

NEXT_PUBLIC_VISUALIZER_ENABLED=true/false — master toggle
NEXT_PUBLIC_VISUALIZER_CDN_ALLOWLIST — override CDN domains
NEXT_PUBLIC_VISUALIZER_MAX_WIDGETS=3 — max per message

### Relationship with Artifacts

Visualizer and Artifacts coexist:

- Visualizer: inline in chat, ephemeral, for understanding/explanation
- Artifacts: side panel, persistent, for deliverables/downloads
- Routing: "build me X" → Artifact, "show me how X works" → Visualizer, "visualize X" → Visualizer
```
