# Autoresearch: Pho.Chat Bundle Optimization

## Objective

Giảm JS bundle size của pho.chat (lobe-chat fork) xuống thấp nhất có thể mà không break functionality.
Codebase: Next.js 15, React 19, TypeScript, 70+ AI model providers, 4 custom artifact types.
Target users: Việt Nam (mobile-first, 4G) — mỗi KB giảm = bounce rate thấp hơn.

## Metrics

- **Primary**: `js_bundle_kb` — tổng KB các file .js trong .next/static (lower is better)
- **Secondary**:
  - `build_seconds` — thời gian build (lower is better)
  - `total_bundle_kb` — tổng .next/static size bao gồm CSS, media
  - `chunk_count` — số file .js chunks (lower = ít ChunkLoadError hơn)

## How to Run

```bash
node auto/bundle/measure.mjs
```

Outputs `METRIC name=number` lines. Cross-platform (works on Windows + Linux).

## Files in Scope

- `next.config.ts` — webpack config, code splitting, optimizePackageImports
- `package.json` — dependencies
- `src/app/**/page.tsx` — route-level code splitting
- `src/components/**` — shared components (lazy load candidates)
- `src/features/**` — feature modules
- `src/libs/**` — library wrappers
- `src/tools/**` — tool UI components (dalle, web-browsing, scientific, visualizer)
- `src/store/**` — Zustand stores (tree-shake candidates)

## Off Limits (DON'T TOUCH)

- `src/server/**` — server-side only, doesn't affect client bundle
- Database schemas (`packages/database/`)
- Auth configuration (Clerk) — breaking auth = production down
- `src/prompts/**` — prompt templates, no bundle impact
- `auto/` directory — autoresearch infrastructure
- `.env*` files

## Constraints

- Must pass TypeScript check: `bun run type-check`
- Must not remove any user-facing feature
- Must not change API contracts
- Must not break i18n (100+ locale files)
- Image/font loading must remain functional
- Desktop (Electron) build must not be affected

## Ideas to Explore

1. Dynamic imports cho heavy features (artifact renderer, markdown editor, code highlighter)
2. Lazy load AI model provider configs (70+ models nhưng user chỉ dùng vài cái)
3. Tree-shake unused lobe-chat features (discover page, plugins marketplace)
4. Replace heavy dependencies với lighter alternatives (check bundle analyzer)
5. Route-level code splitting cho admin/settings pages
6. `optimizePackageImports` — thêm packages nặng chưa có trong list
7. Analyze và remove dead code paths
8. Review `transpilePackages` — `pdfjs-dist`, `mermaid` rất nặng
9. Deferred loading cho emoji picker (`emoji-mart`)
10. Web Worker cho heavy computation (tokenizer, markdown parser)
11. Lazy load rich text editors / code editors chỉ khi user cần

## What's Been Tried

### Round 1 (2026-03-16): Mermaid exclusion + optimizePackageImports

- **Baseline**: js=59045, total=72558, chunks=2006
- Removed `mermaid` from `transpilePackages` → minimal impact alone (-27 KB)
- Added `resolve.alias['mermaid'] = false` → same minimal impact
- **NormalModuleReplacementPlugin** for mermaid → **-2391 KB** ✅
- Expanded `optimizePackageImports` (+8 packages) → included in above measurement
- Tried adding pptxgenjs, xlsx to replacement list → zero additional impact
- Root cause: `@lobehub/ui`'s `useMermaid.js` does `import('mermaid')` at module load, pulling in entire mermaid + d3 + dagre tree

### Analysis findings

- Top chunk (1.99MB) contains: highlight, monaco, antd, swagger, xlsx references (string content, not modules)
- pdfjs-dist already behind `dynamic()` import in FileViewer
- 55.2 MB in shared chunks vs 2.4 MB in app routes → most size is vendor code
- 1136 chunks under 10KB (2.9 MB) → many small chunks, not a major concern

## Dead Ends

- `resolve.alias['mermaid'] = false` — doesn't catch dynamic `import()` calls
- Removing from `transpilePackages` alone — mermaid pulled in by @lobehub/ui, not by transpile
- pptxgenjs/xlsx exclusion via NormalModuleReplacementPlugin — these packages aren't actually bundled (strings in chunks are content references)

## Key Wins

- **NormalModuleReplacementPlugin for mermaid**: -2391 KB (-4.1%), 45 chunks removed
- **Technique**: Replace `import('mermaid')` with empty module stub at webpack resolution time

### Round 2 (2026-03-16): Extended optimizePackageImports

- Added 13 more packages: shiki, @shikijs/core, @shikijs/transformers, rc-picker, rc-table, rc-tree, rc-select, rc-cascader, rc-field-form, rc-util, rc-menu, @ant-design/cssinjs, @ant-design/icons-svg
- **Result**: js=56617 (-37 KB, -0.07%) — diminishing returns
- **Conclusion**: These packages are already adequately tree-shaken by webpack

### Round 3 (2026-03-16): Deep analysis — hitting the floor

- Route chunks: 2573 KB (4.5%) — well split already
- Shared vendor: 54029 KB (95.5%) — fundamental limit
- Main chat page: 13749 KB across 116 chunks
- Markdown component imported 35+ times — pulls shiki (9.8MB) + emoji-mart (26.6MB)
- 50+ dynamic() imports already exist
- **Conclusion**: Further gains require architectural changes (upstream @lobehub/ui refactoring or CDN-loading vendor libs)

### Round 4 (2026-03-16): emoji-mart NormalModuleReplacementPlugin

- Excluded @emoji-mart/data, @emoji-mart/react, emoji-mart
- **Result**: js=56044 (-610 KB, -1.1% from Round 1)
- **Cumulative**: -3001 KB from baseline (-5.1%)
- **Technique**: Same NormalModuleReplacementPlugin approach as mermaid

### Round 5 (2026-03-16): pptxgenjs analysis — dead end

- Added NormalModuleReplacementPlugin for pptxgenjs → **zero impact** (56044 → 56044)
- Root cause: pptxgenjs is CDN-loaded in ResearchSlides.tsx and NOT actually bundled
- The "pptx" strings matched in chunks are text references (prompt content, file type names), not bundled modules
- Also tested string-matching for swagger, xlsx, katex → same issue (text references in minified strings)
- **Conclusion**: String-matching unreliable for identifying actual bundled modules in minified chunks

## Analysis Summary

### Effective Optimizations (Confirmed)

| Change               | JS Reduction          | Technique                     |
| -------------------- | --------------------- | ----------------------------- |
| Mermaid exclusion    | -2,391 KB             | NormalModuleReplacementPlugin |
| emoji-mart exclusion | -610 KB               | NormalModuleReplacementPlugin |
| **Total**            | **-3,001 KB (-5.1%)** |                               |

### Cannot Be Excluded (UX-Critical)

- **katex/rehype-katex**: Math rendering in chat messages (via @lobehub/ui's Markdown component)
- **shiki**: Code syntax highlighting in chat messages
- **antd**: Core UI framework

### Optimization Ceiling

- 95.5% of bundle is shared vendor code from @lobehub/ui and its dependencies
- 50+ dynamic() imports already exist
- Further gains require upstream @lobehub/ui tree-shaking improvements
