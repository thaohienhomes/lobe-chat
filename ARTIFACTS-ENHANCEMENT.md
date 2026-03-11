# ARTIFACTS-ENHANCEMENT.md
# Pho.Chat Artifact System — Audit & Enhancement Task Spec
# Giao việc cho Claude Code CLI

> **Repo**: `thaohienhomes/lobe-chat` (Pho.Chat fork, v1.132.5)
> **Ngày tạo**: 11/03/2026
> **Mục tiêu**: Audit toàn bộ artifact system, fix lỗi UI/UX, enhance theo best practices từ Claude AI, ChatGPT Canvas, Google Gemini Canvas
> **Cách dùng**: Copy file này vào repo root hoặc chạy `claude` CLI với context file này

---

## MỤC LỤC

1. [Context & Architecture](#1-context--architecture)
2. [Phase 1: Critical Bug Fixes](#2-phase-1-critical-bug-fixes-1-2-tuần)
3. [Phase 2: Core UX Enhancements](#3-phase-2-core-ux-enhancements-2-4-tuần)
4. [Phase 3: Advanced Features](#4-phase-3-advanced-features-1-3-tháng)
5. [Phase 4: Platform Features](#5-phase-4-platform-features-3-6-tháng)
6. [Reference: Code Locations](#6-reference-code-locations)
7. [Reference: Competitor Analysis](#7-reference-competitor-analysis)

---

## 1. Context & Architecture

### 1.1 Pho.Chat Artifact System hiện tại

Pho.Chat (fork từ LobeChat v1.x) đã có artifact system hoạt động với kiến trúc:

```
User prompt
  → LLM generates <lobeArtifact> XML tags
  → React Markdown parser (rehype plugin) detects tags
  → Extracts attributes: identifier, type, title, language
  → Opens Portal side panel
  → Routes to appropriate Renderer based on type
  → Displays in Portal with Header (title, mode toggle, download)
```

### 1.2 Artifact Types đã implement (11 types)

| Type enum | MIME / identifier | Renderer | Status |
|---|---|---|---|
| `React` | `application/lobe.artifacts.react` | Custom iframe + Babel standalone (351 LOC) | ✅ Working |
| `Html` | `text/html` | HTMLRenderer (iframe) | ✅ Working |
| `SVG` | `image/svg+xml` | SVGRender (dangerouslySetInnerHTML) | ✅ Working |
| `Mermaid` | `application/lobe.artifacts.mermaid` | @lobehub/ui Mermaid | ✅ Working |
| `Code` | `application/lobe.artifacts.code` | Highlighter (code view only) | ✅ Working |
| `Python` | `python` | Highlighter | ✅ Working |
| `InteractiveImage` | `application/lobe.artifacts.interactive-image` | Custom JSON → clickable regions | ✅ Custom |
| `GenerativeDiagram` | `application/lobe.artifacts.generative-diagram` | Custom JSON → DiagramRenderer | ✅ Custom |
| `ContentVisualizer` | `application/lobe.artifacts.content-visualizer` | Multi-agent pipeline → React | ✅ Custom |
| `AIRendering` | `application/lobe.artifacts.ai-rendering` | BeforeAfterView slider | ✅ Custom |
| `Default` | `html` | HTMLRenderer fallback | ✅ Working |

### 1.3 Key Files Map

```
src/
├── tools/artifacts/systemRole.ts          ← System prompt cho LLM (artifact instructions)
├── features/
│   ├── Portal/Artifacts/
│   │   ├── Body/
│   │   │   ├── Renderer/
│   │   │   │   ├── index.tsx              ← Main router (7 renderers) ⚠️ NO ERROR BOUNDARY
│   │   │   │   ├── React/
│   │   │   │   │   ├── index.tsx          ← iframe + Babel renderer (212 LOC)
│   │   │   │   │   ├── buildIframeHtml.ts ← HTML template builder (351 LOC)
│   │   │   │   │   └── escapeJsx.ts       ← JSX text content escaper
│   │   │   │   ├── SVG.tsx
│   │   │   │   ├── HTML/                  ← HTMLRenderer
│   │   │   │   ├── InteractiveImage.tsx   ← Custom: JSON → clickable image regions
│   │   │   │   ├── GenerativeDiagram.tsx  ← Custom: JSON → interactive diagrams
│   │   │   │   ├── ContentVisualizer.tsx  ← Custom: pipeline output → scrollytelling
│   │   │   │   └── AIRendering.tsx        ← Custom: before/after slider
│   │   │   └── index.tsx                  ← ArtifactsUI main body ⚠️ NO LOADING STATE
│   │   ├── Header.tsx                     ← Title, mode toggle, download ⚠️ NO STREAMING INDICATOR
│   │   ├── useEnable.ts
│   │   └── index.ts
│   └── Conversation/components/MarkdownElements/
│       ├── LobeArtifact/
│       │   ├── rehypePlugin.ts            ← Parses <lobeArtifact> XML from markdown
│       │   ├── rehypePlugin.test.ts
│       │   ├── Render/
│       │   │   ├── index.tsx              ← Clickable artifact card in chat
│       │   │   └── Icon.tsx
│       │   └── index.ts
│       └── LobeThinking/
│           ├── Render.tsx                 ← <lobeThinking> display
│           └── index.ts
├── store/chat/slices/portal/
│   ├── initialState.ts                    ← ArtifactDisplayMode enum (Preview/Code/Split)
│   ├── action.ts                          ← openArtifact, closeArtifact actions
│   └── selectors.ts                       ← artifactMessageId, artifactType, artifactCode, etc.
├── packages/types/src/artifact.ts         ← ArtifactType enum + PortalArtifact interface
├── services/content-visualizer/           ← Multi-agent pipeline (26 files)
│   ├── pipeline.ts                        ← Main orchestrator
│   ├── agents/                            ← 5 specialized agents
│   ├── types/
│   └── validators/
├── components/InteractiveUI/              ← Shared interactive components (22 files)
├── prompts/
│   ├── generative-diagram.ts
│   └── interactive-ui-base.ts
└── tools/
    ├── artifacts/systemRole.ts            ← Artifact system prompt
    └── slides/systemRole.ts               ← Slides creator prompt
```

### 1.4 Display Modes

Pho.Chat đã có 3 modes (nhiều hơn Claude và ChatGPT):
- `Preview` — render artifact output
- `Code` — show source code with syntax highlighting
- `Split` — code left + preview right (unique feature!)

Streaming UX: Khi artifact đang generate → auto Split mode → khi tag đóng → auto switch to Preview.

---

## 2. Phase 1: Critical Bug Fixes (1-2 tuần)

### Task 1.1: Add Error Boundary cho tất cả Renderers

**File**: `src/features/Portal/Artifacts/Body/Renderer/index.tsx`

**Vấn đề**: Không có error handling. Nếu renderer crash (bad JSON, invalid React, broken SVG), user thấy blank screen hoặc React white screen of death.

**Yêu cầu**:
1. Tạo `ArtifactErrorBoundary` component (class component vì Error Boundaries cần getDerivedStateFromError)
2. Wrap toàn bộ `<Renderer>` trong ErrorBoundary
3. Fallback UI hiển thị:
   - Error icon + message mô tả lỗi
   - Nút **"Retry"** — reset error state và re-render
   - Nút **"Fix with AI"** — copy error message vào chat input box, format: `The artifact "${title}" encountered an error: \`\`\`\n${error.message}\n\`\`\` Please fix this issue.`
   - Nút **"View Code"** — switch sang Code display mode
4. Log error to console cho debugging

**Học từ**: Claude AI có "Try fixing with Claude" button khi artifact lỗi. ChatGPT không có feature này.

**Test cases**:
- Invalid JSON trong InteractiveImage artifact
- Syntax error trong React artifact
- Malformed SVG
- Network error khi load CDN scripts trong React renderer

### Task 1.2: Add Loading State / Skeleton

**File**: `src/features/Portal/Artifacts/Body/index.tsx`

**Vấn đề**: Khi artifact đang generate, portal body trống (đặc biệt trước khi content bắt đầu stream). Khi React renderer đang compile Babel (có thể mất 1-3 giây), user thấy blank iframe.

**Yêu cầu**:
1. Khi `isMessageGenerating === true` VÀ `artifactContent` rỗng hoặc rất ngắn (<50 chars): hiển thị skeleton loader
2. Skeleton gồm:
   - Animated pulse bars (giống code skeleton)
   - Text: "Generating artifact..." với icon spinner
3. Khi React renderer đang compile (giữa lúc có code nhưng chưa render xong): show "Compiling..." overlay
4. Sử dụng `@lobehub/ui` Skeleton component nếu có, hoặc tạo simple CSS animation

**Học từ**: ChatGPT Canvas có shimmer effect. Gemini có progress indicator.

### Task 1.3: Streaming Indicator trong Header

**File**: `src/features/Portal/Artifacts/Header.tsx`

**Vấn đề**: Header chỉ show title + mode toggle. Không có visual indicator khi artifact đang generate.

**Yêu cầu**:
1. Thêm selector `isMessageGenerating` và `isArtifactTagClosed` vào Header component
2. Khi `isMessageGenerating && !isArtifactTagClosed`: hiển thị animated dot + "Generating..." text bên cạnh title
3. Style: nhỏ, subtle, không chiếm quá nhiều space — dùng `color: token.colorPrimary` + `animation: pulse 1.5s infinite`
4. Khi generation xong: tự ẩn

### Task 1.4: Fix Hardcoded Dark Theme Colors

**Files**: `src/features/Portal/Artifacts/Body/index.tsx`

**Vấn đề**: Split mode có `borderRight: '1px solid rgba(255,255,255,0.1)'` — hardcoded dark theme. Trên light theme border invisible.

**Yêu cầu**:
1. Scan toàn bộ `src/features/Portal/Artifacts/` cho hardcoded color values (`rgba`, `#`, hex colors)
2. Replace với Ant Design theme tokens:
   - `rgba(255,255,255,0.1)` → `token.colorBorderSecondary` hoặc `token.colorSplit`
   - Sử dụng `useToken()` hook từ `antd` hoặc `antd-style` `useTheme()`
3. Verify cả light và dark theme

### Task 1.5: Fix Font Size Inconsistency

**File**: `src/features/Portal/Artifacts/Body/index.tsx`

**Vấn đề**: Split mode code panel dùng `fontSize: 11`, normal code view dùng `fontSize: 12`.

**Yêu cầu**:
1. Define constant `ARTIFACT_CODE_FONT_SIZE = 12`
2. Sử dụng consistent ở cả 2 places
3. Hoặc tốt hơn: dùng `token.fontSizeSM` từ antd theme

### Task 1.6: Fix Streaming Flicker trong Split Mode

**File**: `src/features/Portal/Artifacts/Body/Renderer/React/index.tsx`

**Vấn đề**: Mỗi 350ms debounce = tạo blob URL mới = iframe reload = flicker. Trong split mode khi streaming, preview panel re-render liên tục.

**Yêu cầu**:
1. Khi đang streaming (`isMessageGenerating && !isArtifactTagClosed`):
   - Split mode code panel: render code bình thường (real-time)
   - Split mode preview panel: show placeholder "Preview will appear when generation completes" HOẶC tăng debounce lên 1500ms
2. Khi artifact tag closed: render preview ngay lập tức (không debounce)
3. Cleanup: revoke previous blob URLs khi tạo mới (tránh memory leak)

### Task 1.7: Error Display cho JSON-based Artifacts

**Files**: `InteractiveImage.tsx`, `GenerativeDiagram.tsx`, `ContentVisualizer.tsx`, `AIRendering.tsx`

**Vấn đề**: Tất cả 4 custom renderers parse JSON nhưng khi parse fail chỉ return `null` (blank) hoặc generic error div.

**Yêu cầu**:
1. Mỗi renderer khi JSON parse fails:
   - Show error message mô tả rõ: "Invalid JSON for [type] artifact"
   - Show truncated raw content (first 200 chars) để user thấy AI đã generate gì
   - Nút "View Raw" switch sang Code mode
   - Nút "Fix with AI" giống Task 1.1

---

## 3. Phase 2: Core UX Enhancements (2-4 tuần)

### Task 2.1: Highlight → Edit (Học từ ChatGPT Canvas + Gemini)

**Đây là feature có UX impact cao nhất.**

**Mô tả**: User highlight một đoạn text/code trong artifact → floating toolbar hiện lên → user gõ instruction → AI chỉ sửa phần được highlight.

**Implementation approach**:

1. **Cho text/markdown artifacts**: Dùng `contentEditable` div hoặc lightweight editor
2. **Cho code artifacts** (HTML, React, Code): Integrate Monaco Editor hoặc CodeMirror (thay thế static Highlighter cho edit mode)
3. **Flow**:
   ```
   User highlights text in artifact
   → Floating toolbar appears near selection
   → Toolbar có: input field + "Apply" button + preset actions
   → User types: "make this more concise" / "fix this bug"
   → System constructs prompt:
     "Here is the full artifact:\n```\n{full_code}\n```\n
      The user has selected this portion (lines X-Y):\n```\n{selected_text}\n```\n
      User instruction: {user_input}\n
      Please update ONLY the selected portion. Return the complete updated artifact."
   → Send to LLM → receive updated artifact → replace in portal
   ```

4. **Preset actions** (floating toolbar buttons):
   - 📝 "Edit" — open text input
   - 🔧 "Fix" — auto-send "fix any issues in this section"
   - 📖 "Explain" — send "explain this section" (show in chat, not artifact)
   - ✂️ "Simplify" — "make this section simpler and more concise"

**Files to create/modify**:
- `src/features/Portal/Artifacts/Body/SelectionToolbar.tsx` — NEW: floating toolbar component
- `src/features/Portal/Artifacts/Body/index.tsx` — add selection listener
- `src/store/chat/slices/portal/action.ts` — add `editArtifactSection` action

**Lưu ý**: Bắt đầu với text/markdown artifacts trước (đơn giản nhất), rồi mở rộng sang HTML/React.

### Task 2.2: Quick Actions Menu (Học từ ChatGPT Canvas)

**Mô tả**: Floating menu (bottom-right của artifact panel) với preset actions phù hợp loại artifact.

**Implementation**:
1. Tạo `src/features/Portal/Artifacts/QuickActions.tsx`
2. Menu hiện khi hover góc dưới phải artifact panel
3. Actions thay đổi theo `artifactType`:

**Cho text/markdown artifacts:**
- "Suggest edits" — AI tạo inline suggestions (hiển thị dạng tracked changes)
- "Make shorter" / "Make longer" — adjust length
- "Simplify language" — lower reading level
- "Add citations" — (custom cho research!) tìm và thêm citations
- "Check methodology" — (custom!) AI review methodology section

**Cho code artifacts (HTML, React, Python):**
- "Review code" — AI tạo inline comments
- "Add comments" — auto-comment
- "Fix bugs" — detect + fix
- "Optimize" — improve performance
- "Add error handling" — wrap in try/catch

**Cho research-specific artifacts:**
- "Grade evidence" — (custom!) GRADE assessment
- "Check PRISMA compliance" — (custom!) validate flowchart
- "Extract PICO" — (custom!) extract Population, Intervention, Comparison, Outcome
- "Add risk of bias" — (custom!) RoB assessment

### Task 2.3: Mở rộng Export Menu

**File**: `src/features/Portal/Artifacts/Header.tsx`

**Hiện tại**: Chỉ có PDF (via print window) và HTML download.

**Thêm options**:
1. **Markdown** — convert artifact content to .md file download
2. **Code file** — download với extension đúng (.tsx, .py, .html, .svg, .json)
3. **PNG** — cho SVG và Mermaid artifacts: render to canvas → toBlob → download
4. **Copy to clipboard** — copy raw content
5. **Open in new tab** — cho HTML/React artifacts: open blob URL trong tab mới (fullscreen view)

**Implementation**:
```tsx
const downloadMenuItems: MenuProps['items'] = [
  { key: 'copy', icon: '📋', label: 'Copy to clipboard', onClick: handleCopy },
  { key: 'code', icon: '💾', label: `Download .${extension}`, onClick: handleDownloadCode },
  { key: 'html', icon: '🌐', label: 'Download HTML', onClick: handleDownloadHTML },
  { key: 'pdf', icon: '📄', label: 'Download PDF', onClick: handlePrintPDF },
  // Conditional:
  artifactType === ArtifactType.SVG && { key: 'png', label: 'Download PNG', onClick: handleSVGtoPNG },
  isPreviewable && { key: 'newtab', label: 'Open in new tab', onClick: handleOpenNewTab },
];
```

### Task 2.4: Deep Research → Artifact Pipeline (Học từ Gemini)

**Mô tả**: Pho.Chat đã có `portalDeepResearch` state. Nối pipeline: khi Deep Research xong → cho user chọn artifact format để visualize.

**Flow**:
```
User triggers Deep Research
→ Research completes → results in portal
→ New button appears: "Visualize as..."
→ Dropdown options:
  - 📊 PRISMA Flowchart (Mermaid artifact)
  - 📋 Evidence Summary Table (React artifact)
  - 🌲 Forest Plot (React/SVG artifact)
  - 📄 Structured Report (Markdown artifact)
  - 🎯 PICO Summary (React card artifact)
→ User selects → system constructs prompt with research data
→ LLM generates appropriate artifact
```

**Files to modify**:
- `src/features/Portal/` — add "Visualize" button khi research done
- `src/store/chat/slices/portal/action.ts` — add `visualizeResearchAs` action
- Tạo prompt templates cho mỗi visualization type

### Task 2.5: Publish / Share Artifact Link (Học từ Claude)

**Mô tả**: User có thể tạo public link cho artifact để share với collaborators.

**Implementation approach (đơn giản nhất)**:
1. Serialize artifact content + type + title thành JSON
2. Base64 encode → append to URL as hash: `https://pho.chat/artifact#<base64>`
3. Tạo route `/artifact` render artifact từ URL hash
4. Nút "Share" trong Header → copy link to clipboard

**Hoặc phức tạp hơn** (cần backend):
1. Save artifact to database với unique ID
2. Generate short URL: `https://pho.chat/a/<id>`
3. Viewer can see artifact without login
4. Creator can un-publish

---

## 4. Phase 3: Advanced Features (1-3 tháng)

### Task 3.1: AI-powered Artifacts (Học từ Claude)

**Mô tả**: Artifacts có thể gọi LLM API từ bên trong → biến artifact thành mini AI app.

**Implementation**:
1. Tạo API route: `src/app/api/artifact-ai/route.ts`
   - Accepts: system prompt + user message + model selection
   - Returns: LLM response
   - Auth: phải verify user session (tránh abuse)
2. Trong React artifact iframe, inject helper function:
   ```js
   window.phoChat = {
     async askAI(prompt, options) {
       const response = await fetch('/api/artifact-ai', {
         method: 'POST',
         body: JSON.stringify({ prompt, ...options })
       });
       return response.json();
     }
   };
   ```
3. Update `buildIframeHtml.ts` để inject helper
4. Update system prompt để LLM biết cách sử dụng `window.phoChat.askAI()`

**Use cases cho research:**
- Interactive PICO extractor: paste abstract → AI extracts P, I, C, O
- Evidence grader: input study details → AI returns GRADE assessment
- Literature screener: show abstract cards → swipe accept/reject → AI learns

### Task 3.2: Persistent Storage cho Artifacts

**Mô tả**: Artifacts lưu data xuyên session (không mất khi refresh page).

**Implementation (simple — localStorage wrapper)**:
```ts
// Inject vào artifact iframe
window.phoChat.storage = {
  async get(key) { return JSON.parse(localStorage.getItem(`artifact:${artifactId}:${key}`)); },
  async set(key, value) { localStorage.setItem(`artifact:${artifactId}:${key}`, JSON.stringify(value)); },
  async delete(key) { localStorage.removeItem(`artifact:${artifactId}:${key}`); },
  async list(prefix) { /* filter localStorage keys */ },
};
```

**Implementation (advanced — database)**:
- Tạo `artifact_storage` table trong database
- API routes cho CRUD operations
- Sync across devices

### Task 3.3: Research-specific Quick Actions

**Tạo domain-specific shortcuts chưa ai có**:

1. **"Add Citations"**: AI tìm relevant citations cho highlighted text, format theo style (APA, Vancouver, etc.)
2. **"Check Methodology"**: AI review methodology section theo CONSORT/STROBE checklist
3. **"Grade Evidence"**: AI đánh giá quality of evidence theo GRADE framework
4. **"Extract PICO"**: AI extract Population, Intervention, Comparison, Outcome từ study text
5. **"Risk of Bias"**: AI assess risk of bias theo RoB 2 / ROBINS-I
6. **"Validate PRISMA"**: AI check PRISMA 2020 flowchart completeness

**Implementation**: Mỗi shortcut = predefined prompt template + artifact update logic.

---

## 5. Phase 4: Platform Features (3-6 tháng)

### Task 4.1: Design System cho Artifacts

Tạo consistent design tokens:
- Color tokens (light/dark) — KHÔNG hardcode rgba/hex
- Spacing scale
- Typography scale
- Border radius
- Shadow system
- Responsive breakpoints

### Task 4.2: Multi-agent Artifacts (Học từ LobeHub v2)

Multiple AI agents collaborate trên cùng 1 artifact:
- Agent 1: Researcher (tìm evidence)
- Agent 2: Analyst (evaluate quality)
- Agent 3: Writer (synthesize findings)

### Task 4.3: MCP Integration cho Artifacts

Artifacts kết nối external services:
- PubMed search results → render as evidence table
- Semantic Scholar → citation network visualization
- ClinicalTrials.gov → trial comparison dashboard

### Task 4.4: Artifact Marketplace

Community-created artifact templates:
- PRISMA 2020 flowchart generator
- Systematic review evidence table
- Forest plot builder
- Risk of bias visualization

---

## 6. Reference: Code Locations

### Core artifact files (modify these):
```
src/features/Portal/Artifacts/Body/Renderer/index.tsx     ← Task 1.1 (Error Boundary)
src/features/Portal/Artifacts/Body/index.tsx               ← Task 1.2 (Loading), 1.4 (theme), 1.5 (font), 1.6 (flicker)
src/features/Portal/Artifacts/Header.tsx                   ← Task 1.3 (streaming), 2.3 (export)
src/features/Portal/Artifacts/Body/Renderer/React/index.tsx ← Task 1.6 (flicker)
src/features/Portal/Artifacts/Body/Renderer/InteractiveImage.tsx ← Task 1.7 (JSON error)
src/features/Portal/Artifacts/Body/Renderer/GenerativeDiagram.tsx ← Task 1.7
src/features/Portal/Artifacts/Body/Renderer/ContentVisualizer.tsx ← Task 1.7
src/features/Portal/Artifacts/Body/Renderer/AIRendering.tsx ← Task 1.7
```

### State management:
```
src/store/chat/slices/portal/initialState.ts   ← ArtifactDisplayMode enum
src/store/chat/slices/portal/action.ts         ← openArtifact, closeArtifact
src/store/chat/slices/portal/selectors.ts      ← artifact selectors
```

### Types:
```
packages/types/src/artifact.ts                 ← ArtifactType enum, PortalArtifact interface
```

### System prompts:
```
src/tools/artifacts/systemRole.ts              ← Main artifact prompt
src/prompts/generative-diagram.ts              ← Diagram-specific prompt
src/prompts/interactive-ui-base.ts             ← Interactive UI base prompt
```

### Custom features (preserve these — unique to Pho.Chat):
```
src/services/content-visualizer/               ← 26 files, multi-agent pipeline
src/components/InteractiveUI/                  ← 22 files, shared components
src/scientific-skills/                         ← Domain-specific skills
src/tools/slides/systemRole.ts                 ← Slides tool
```

---

## 7. Reference: Competitor Analysis

### Claude AI Artifacts — Key learnings

**Architecture**: Sandboxed iframe, AI tự quyết khi tạo artifact (>15 dòng, self-contained, reusable).

**UX patterns cần học**:
- ✅ **"Fix with Claude" button** khi artifact error → copy error vào chat
- ✅ **Persistent Storage** API (key-value, personal/shared, 20MB/artifact)
- ✅ **AI-powered artifacts** — artifact gọi Claude API trực tiếp, không cần API key riêng
- ✅ **Publish & Share** — public link, viewer tạo bản copy riêng (remix)
- ✅ **MCP integration** — artifacts kết nối external services
- ✅ **Artifact Catalog** — community marketplace

**Prompt philosophy**: Broad scope — code, documents, visuals, interactive, AI-powered apps. Yêu cầu `<antThinking>` tag trước artifact.

### ChatGPT Canvas — Key learnings

**Architecture**: Dedicated editor pane, auto-opens >10 lines, direct typing vào canvas.

**UX patterns cần học**:
- ✅ **Highlight → Edit** — select text → floating input → AI sửa chỉ phần đó (HIGHEST PRIORITY)
- ✅ **Suggest edits** — inline suggestions với accept/reject (giống tracked changes)
- ✅ **Quick Action shortcuts** — 6 writing + 5 coding preset actions
- ✅ **Reading level slider** — K → Graduate School
- ✅ **Length adjuster** — slider shorter ↔ longer
- ✅ **Direct editing** — click vào canvas và gõ trực tiếp
- ✅ **Export đa dạng** — PDF, Markdown, DOCX, code files
- ✅ **Version history** — back button restore previous versions
- ✅ **Auto-trigger** — thông minh detect khi nào cần mở canvas

**Prompt philosophy**: ChatGPT tự quyết mở Canvas khi response >10 dòng hoặc detect complex task.

### Google Gemini Canvas — Key learnings

**Architecture**: Explicit activation (user chọn "Canvas"), powered by Gemini 3, Knowledge Graph grounding.

**UX patterns cần học**:
- ✅ **Deep Research → Canvas** pipeline — research xong → "Create" → chọn format
- ✅ **Multi-format conversion** — 1 output → web page, infographic, quiz, audio overview
- ✅ **Inline text editing** — highlight → change tone (concise, professional, informal)
- ✅ **Export to Google Docs** — 1-click export
- ✅ **Creative Canvas** (experimental) — interactive blocks ngay trong chat window
- ✅ **Audio Overview** — convert document thành podcast-style discussion

**Prompt philosophy**: Deliberate activation — user phải chọn Canvas mode. Focus vào creation + research integration.

### LobeHub v2 (upstream) — Key differences

**Thay đổi architecture lớn** (v1 → v2):
- React Router DOM (SPA) thay thế chỉ Next.js App Router
- 52 packages (monorepo) thay vì 13
- Portal View Stack pattern (push/pop) thay vì flat state
- Skill Engine architecture thay vì hardcoded prompts
- Sandpack (CodeSandbox) cho React renderer thay vì custom iframe

**Artifact prompt đã thu hẹp trong v2**:
- ❌ KHÔNG cho phép code artifacts (phải inline markdown)
- ❌ KHÔNG cho phép document artifacts (phải inline text)
- ✅ CHỈ visual/interactive: React components, SVG, HTML, dashboards
- ❌ ĐÃ BỎ `<lobeThinking>` tag

**Khuyến nghị**: KHÔNG merge LobeHub v2 nguyên bộ (quá nhiều breaking changes). Cherry-pick features cụ thể.

---

## EXECUTION NOTES cho Claude Code CLI

1. **Chạy từng Phase tuần tự** — Phase 1 trước, test xong mới Phase 2
2. **Mỗi task = 1 commit** với message format: `fix(artifacts): [Task X.Y] description`
3. **Test mỗi renderer** sau khi thêm Error Boundary — tạo test artifacts cho mỗi type
4. **KHÔNG xóa custom features** (InteractiveImage, GenerativeDiagram, ContentVisualizer, AIRendering, Slides) — đây là differentiators
5. **KHÔNG upgrade lên LobeHub v2 architecture** — giữ v1.x, cherry-pick features
6. **Sử dụng existing dependencies** — `@lobehub/ui`, `antd`, `antd-style`, `lucide-react`, `react-layout-kit`
7. **Prefer theme tokens** over hardcoded colors — `useTheme()` từ `antd-style` hoặc `useToken()` từ `antd`
8. **i18n**: Thêm translation keys vào `src/locales/default/portal.ts` cho mọi UI text mới

---

*Task spec cho Claude Code CLI — Pho.Chat Artifacts Enhancement — 11/03/2026*
