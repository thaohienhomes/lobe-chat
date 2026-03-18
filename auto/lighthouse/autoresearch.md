# Autoresearch: Pho.Chat Production Lighthouse Optimization

## Objective

Tối ưu Lighthouse performance score trên production (pho.chat) — hiện tại Mobile: 50, Desktop: 34.
Codebase: Next.js 15, React 19, TypeScript, Vercel deployment.
Target: Mobile ≥ 70, Desktop ≥ 70.

## Current Production Lighthouse Scores (pho.chat)
- Mobile: 50 (FCP 0.9s ✅, LCP 1.2s ✅, TBT 3200ms ❌, CLS 0.225 ⚠️, SI 12.2s ❌)
- Desktop: 34 (FCP 0.3s ✅, LCP 12.7s ❌, TBT 3940ms ❌, CLS 0.069 ✅, SI 9.7s ❌)

## Key Bottlenecks
1. **TBT ~3.2-3.9s** — Heavy JS execution during hydration (CSS-in-JS antd-style, 70+ AI providers, Zustand stores)
2. **Desktop LCP 12.7s** — Chat interface takes too long to paint largest content
3. **Mobile CLS 0.225** — Layout shifts during loading
4. **Speed Index 9.7-12.2s** — Slow visual progression

## Previous Optimizations (ALREADY DONE — DON'T REDO)
- NormalModuleReplacementPlugin for mermaid (-2391KB) ✅
- NormalModuleReplacementPlugin for emoji-mart (-610KB) ✅
- DeferredStoreInitialization: React.lazy() code-split into DeferredStores.tsx ✅ (commit 979a45b0cf)
  - The `next/dynamic({ ssr: false })` in GlobalProvider RSC was reverted (fb01cd24ae)
  - But the internal React.lazy split in DeferredStoreInitialization.tsx was KEPT
- optimizePackageImports expanded — diminishing returns

### Session 2026-03-18 Optimizations
1. **SideBar lazy-loaded (Desktop)** — `dynamic(() => import('./SideBar'))` in both DesktopLayoutContainer + Desktop/index.tsx. Defers Avatar, TopActions, BottomActions, PinList, @lobehub/ui SideNav and store selectors from critical path.
2. **TitleBar lazy-loaded (Electron only)** — `isDesktop ? dynamic(...) : () => null`. Avoids bundling electron store, UpdateModal, WinControl for 100% of web users.
3. **BANNER_HEIGHT extracted to const.ts** — Previously, importing `BANNER_HEIGHT` from `CloudBanner.tsx` pulled in ahooks, react-fast-marquee, createStyles and the entire CloudBanner module into the main chunk. Now imports from `@/features/AlertBanner/const.ts`.
4. **TITLE_BAR_HEIGHT imported from const.ts** — Same issue as BANNER_HEIGHT — importing from `@/features/ElectronTitlebar` pulled entire ElectronTitlebar module.
5. **CloudBanner loading placeholder** — Added `loading: () => <div style={{ height: BANNER_HEIGHT }} />` to prevent CLS on both Desktop and Mobile when CloudBanner loads asynchronously.
6. **useTranslation('error') moved to Phase 2** — Removed from StoreInitialization (Phase 1) to DeferredStores (Phase 2). Error translations are not needed for initial render.
7. **NavBar lazy-loaded (Mobile)** — `dynamic(() => import('./NavBar'))`. NavBar is position:fixed so no CLS risk. Defers @lobehub/ui/mobile TabBar, createStyles, lucide-react icons.
8. **RegisterHotkeys lazy-loaded (Desktop)** — Has no visual output, only registers keyboard handlers. Deferred from critical path.

## Architecture Context
- Middleware does server-side URL rewrite (NOT client redirect): `/` → `/${variant}/`
- GlobalProvider is an async Server Component (RSC) — CANNOT use `next/dynamic` with `ssr: false`
- Auth: Clerk middleware
- 50+ dynamic() imports already exist
- CSS-in-JS: antd-style (emotion-based)

## Metrics

- **Primary**: Production Lighthouse score (Mobile + Desktop average)
- **Proxy**: Build success + bundle analysis changes
- **Measure**: After deploying to Vercel, check via PageSpeed Insights

## How to Verify

```bash
bun run build
bun run type-check
```

If both pass, the change is safe to deploy.

## Files in Scope

- `src/app/[variants]/(main)/page.tsx` — main route entry
- `src/app/[variants]/(main)/_layout/` — layout components (Desktop/Mobile)
- `src/layout/GlobalProvider/` — global providers (RSC)
- `src/components/` — shared components (lazy load candidates)
- `src/features/` — feature modules (chat, conversation, portal)
- `src/store/` — Zustand stores (initialization optimization)
- `next.config.ts` — webpack/build config
- `src/middleware.ts` — edge middleware

## Off Limits (DON'T TOUCH)
- `src/server/**` — server-side only
- Database schemas (`packages/database/`)
- Auth configuration (Clerk)
- `auto/` directory
- `.env*` files

## Ideas to Explore

### Priority 1: Reduce TBT (30% of Lighthouse score weight)
1. Move heavy store init to `requestIdleCallback` or `setTimeout(() => ..., 0)`
2. Code-split heavy client components using `next/dynamic` WITHOUT `ssr: false`
3. Defer CSS-in-JS evaluation for below-fold components
4. `React.lazy()` inside 'use client' component boundaries
5. Profile which scripts block the main thread in production build

### Priority 2: Fix Desktop LCP (25% weight)
6. Identify LCP element on desktop — add `fetchpriority="high"` or preload
7. Add static loading skeleton as LCP placeholder
8. Server-render the chat page shell with static content
9. Inline critical CSS for above-fold content

### Priority 3: Fix Mobile CLS (25% weight)
10. Find and fix layout shifts — add explicit dimensions
11. Reserve space for dynamically loaded content
12. Avoid injecting content above existing content during load

### Priority 4: Improve Speed Index
13. Optimize visual loading progression
14. Prioritize above-fold content rendering
15. Defer below-fold component rendering with Intersection Observer

## Constraints
- Must pass TypeScript check: `bun run type-check`
- Must pass build: `bun run build`
- Must not remove any user-facing feature
- Must not change API contracts
- Must not break i18n
- Desktop (Electron) build must not be affected

## Workflow
1. Analyze the render pipeline starting from `page.tsx`
2. Make ONE targeted change
3. Run `bun run build` to verify
4. If build passes, commit with gitmoji prefix (e.g., ⚡ perf: ...)
5. Move to next optimization
6. After 5-8 changes, summarize results
