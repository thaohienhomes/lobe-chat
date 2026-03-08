# CLAUDE.md — Phở Chat v2

> This file provides comprehensive context for Claude Code CLI and other AI agents working on this project.

## 🎯 Project Overview

**Phở Chat v2** is a fresh fork of [LobeHub v2](https://github.com/lobehub/lobe-chat) — a modern AI chat platform. We customize it with exclusive features, Vietnamese branding, and a premium "Quiet Luxury" aesthetic.

### Key Facts
- **Upstream**: LobeHub v2 (Vite SPA, React, TypeScript, antd v5, zustand)
- **v1 codebase** (reference only): `E:\Projex25\X-Chat\lobe-chat`
- **v2 codebase** (this project): `E:\Projex26\pho-chat-v2`
- **Production URL**: https://pho.chat
- **Linear Project**: https://linear.app/pho-chat/project/pho-chat-v2-migration-f6c35cda1558

---

## 🏗️ Architecture

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Vite + React 19 + TypeScript |
| UI Library | antd v5 + @lobehub/ui |
| State | zustand |
| Styling | antd CSS-in-JS tokens |
| Auth | Clerk / NextAuth → v2 uses built-in auth |
| Database | PostgreSQL (Neon serverless) + Drizzle ORM |
| AI Runtime | Unified ModelRuntime (40+ provider plugins) |
| Desktop | Electron / Tauri |
| Mobile | Capacitor / React Native |

### Folder Strategy — "Thin Fork"
```
src/
├── ... (upstream LobeHub v2 code — DO NOT modify)
├── features/
│   └── pho/              ← ALL custom Phở code goes here
│       ├── research/     ← Research Engine (ported from v1)
│       ├── deep-research/← Deep Research
│       ├── medical/      ← Medical Beta
│       ├── scientific/   ← 170+ Scientific Skills
│       ├── payment/      ← Stripe/Sepay/RevenueCat
│       └── branding/     ← Theme overrides, logos
├── config/
│   └── theme.ts          ← Phở brand tokens (OK to modify)
└── locales/              ← i18n (OK to modify)
```

**Rule**: Never modify upstream files directly. If you need to change behavior, use:
1. Theme tokens (antd config)
2. Component overrides in `src/features/pho/`
3. Configuration files
4. Plugin system for AI providers

---

## 🎨 Brand Guidelines

### Logo
- **Icon Mark**: Calligraphic lowercase "p" in Jade Green (#059669) — single continuous flowing brushstroke, thin, elegant, minimal. No extra decoration or loops.
- **Wordmark**: "phở" in same calligraphic style — p, h, ở connected as one continuous flow. Vietnamese diacritic (hook above on ở) is a small accent mark.
- **Style Keywords**: calligraphic, single-stroke, flowing, thin, brush-pen, luxury monogram

### Color System — Jade Mist
```typescript
const phoTheme = {
  token: {
    colorPrimary: '#059669',      // Jade Green (primary accent)
    colorBgBase: '#0A0A0A',        // Deep Black (main bg)
    colorBgContainer: '#141414',   // Surface (cards, sidebar)
    colorBgElevated: '#1A1A1A',    // Elevated (inputs, modals)
    colorBorder: '#1E1E1E',        // Borders
    colorText: '#F1F5F9',          // Primary text
    colorTextSecondary: '#94A3B8', // Muted text
    colorError: '#EF4444',         // Errors
    colorWarning: '#F59E0B',       // Warnings
    borderRadius: 12,
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  algorithm: theme.darkAlgorithm,
};
```

### Design Principles
1. **Quiet Luxury**: Minimal, content-focused. Hide unnecessary UI.
2. **One Accent**: Only Jade Green #059669 as accent color.
3. **Dark-First**: #0A0A0A background is default. Light mode is secondary.
4. **Generous Space**: Padding 24-32px, gap 16-24px.
5. **Smooth Motion**: Transitions 200-300ms ease. No jarring animations.
6. **Clean like Claude**: No heavy message bubbles. Floating input bar. Subtle model selector.

### Typography
- **UI**: Inter, 15px body, line-height 1.6, headings semi-bold (600)
- **Code**: JetBrains Mono, 13px, ligatures enabled

### Asset Specifications
| Asset | Size | Content | Format |
|-------|------|---------|--------|
| Favicon | 32×32, 16×16 | "p" icon jade on transparent | .ico, .png |
| Apple Touch Icon | 180×180 | "p" icon jade on #0A0A0A | .png |
| OG Image | 1200×630 | "phở" wordmark + tagline | .png |
| PWA Icon | 512×512, 192×192 | "p" icon jade on #0A0A0A | .png |
| Splash Screen | 1170×2532 | "phở" wordmark centered | .png |
| Loading Animation | 120×120 | "p" stroke draw-on | .svg animated |

---

## 🤖 AI Provider Strategy

### Architecture: Dual-Provider Resilience
```
User Request
  → Tier Check (Free/Pro/Medical)
  → Primary: Vertex AI (direct API, bypass regional quotas)
  → Fallback: Vercel AI Gateway (40+ providers)
  → Budget: Groq/Cerebras (free tiers for Free users)
```

### Model Tiers
| Tier | Models | Rate Limit |
|------|--------|-----------|
| Free | Gemini Flash, Llama (via Groq) | 20 msg/day |
| Pro | GPT-4o, Claude 3.5, Gemini Pro | 200 msg/day |
| Medical | All + Medical-specialized | 500 msg/day |

---

## 🔬 Exclusive Features (from v1)

### 1. Research Engine (5-phase)
- Query Analysis (PICO framework)
- Source Discovery (PubMed, ArXiv, OpenAlex)
- Evidence Synthesis
- Quality Assessment (GRADE)
- Report Generation (PRISMA)

### 2. Deep Research
- Autonomous multi-agent report generation
- 10-30 page reports from single query
- Competitive moat — no open-source alternative has this

### 3. Scientific Skills (170+)
- 8 specialized agents
- BioMedical, Chemistry, Data Science, Clinical Tools, etc.

### 4. Medical Beta
- HIPAA-aware system prompts
- Drug database integration
- Gated access (Medical tier only)

---

## 💳 Payment Integration

| Provider | Use Case | Currency |
|----------|----------|----------|
| Stripe/Polar | International | USD |
| Sepay | Vietnam local bank | VND |
| RevenueCat | Mobile in-app | USD/VND |

---

## 📋 Linear Integration

All tasks are tracked in Linear project "Phở Chat v2 Migration".

### Reading tasks from Linear
```bash
# Claude Code CLI can read issues via MCP
# Or use Linear API directly
```

### Current phases
- **Phase 0**: Project Setup (PHO-15)
- **Phase 1**: Foundation — Brand, UI, AI Providers (PHO-16, PHO-17, PHO-18)
- **Phase 2**: Feature Migration — Research, Deep Research, Payments (PHO-19, PHO-20, PHO-21)
- **Phase 3**: Platform — Mobile, Desktop, PWA (PHO-22)
- **Phase 4**: Launch — QA, Migration, Deploy (PHO-23)

### Workflow
1. Read the next Linear issue to work on
2. Implement the tasks described in the issue
3. Update the issue status when done
4. Move to the next issue

---

## 🔄 Upstream Sync Strategy

### "Thin Fork" Rules
1. **Never modify** files in LobeHub core directories
2. **Always customize** via `src/features/pho/` or config files
3. **Sync monthly** with upstream — `git fetch upstream && git merge upstream/main`
4. **Resolving conflicts**: Our custom code in `src/features/pho/` won't conflict

### Safe to modify
- `src/config/theme.ts` — brand tokens
- `src/features/pho/**` — all custom features
- `.env` files — environment config
- `public/` — static assets (logo, favicon)
- `locales/` — i18n strings

### Never modify
- `src/components/` — upstream components
- `src/store/` — upstream state management
- `src/services/` — upstream services
- `package.json` — add deps but don't remove upstream ones

---

## 🏃 Getting Started

```bash
# 1. Clone and install
git clone [fork-url] E:\Projex26\pho-chat-v2
cd E:\Projex26\pho-chat-v2
pnpm install

# 2. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Start development
pnpm dev

# 4. Build for production
pnpm build
```
