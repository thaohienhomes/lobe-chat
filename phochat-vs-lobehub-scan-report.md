# Scan & So sánh Artifacts: Pho.Chat (v1.132.5) vs LobeHub (v2.1.39)

**Ngày scan**: 11/03/2026  
**Pho.Chat repo**: `thaohienhomes/lobe-chat` — commit `659fdd6` (v1.132.5)  
**LobeHub repo**: `lobehub/lobe-chat` → renamed `lobehub/lobehub` — commit `14dd5d0` (v2.1.39)

---

## 1. Khoảng cách phiên bản tổng thể

| Metric | Pho.Chat (v1.x) | LobeHub (v2.x) | Gap |
|---|---|---|---|
| **Version** | 1.132.5 | 2.1.39 | **Major version behind** |
| **Total TS/TSX files (src/)** | 2,977 | 4,057 | +1,080 files |
| **Packages** | 13 | 52 | +39 packages |
| **Artifact-related files** | 81 | 62 | Pho.Chat có nhiều hơn! |

**Nhận xét quan trọng**: Mặc dù LobeHub v2 lớn hơn ~36% về code, Pho.Chat lại có **nhiều artifact files hơn** (81 vs 62) nhờ các custom artifact types riêng.

---

## 2. Kiến trúc Artifacts: So sánh chi tiết

### 2.1 Artifact Types (enum)

| Type | Pho.Chat | LobeHub v2 |
|---|---|---|
| `application/lobe.artifacts.code` | ✅ | ✅ |
| `application/lobe.artifacts.react` | ✅ | ✅ |
| `text/html` (HTML) | ✅ | ✅ (default) |
| `image/svg+xml` (SVG) | ✅ | ❌ (not in enum) |
| `application/lobe.artifacts.mermaid` | ✅ | ❌ (not in enum) |
| `text/markdown` | ✅ | ❌ (not in enum) |
| `application/lobe.artifacts.interactive-image` | ✅ **custom** | ❌ |
| `application/lobe.artifacts.generative-diagram` | ✅ **custom** | ❌ |
| `application/lobe.artifacts.content-visualizer` | ✅ **custom** | ❌ |
| `application/lobe.artifacts.ai-rendering` | ✅ **custom** | ❌ |
| `python` | ✅ | ✅ |

**Pho.Chat có 4 artifact types độc quyền** mà LobeHub không có.

### 2.2 React Renderer — Khác biệt kiến trúc lớn nhất

| | Pho.Chat | LobeHub v2 |
|---|---|---|
| **Approach** | Custom iframe + Babel standalone | Sandpack (CodeSandbox) |
| **File size** | 351 lines (`buildIframeHtml.ts`) + 212 lines (renderer) | 52 lines (renderer) + template |
| **Dependencies** | Zero external runtime dependency | Phụ thuộc CodeSandbox CDN |
| **Build system** | Babel compiles JSX in-browser | Vite + React plugin |
| **Libraries** | CDN-loaded globals via custom `require()` shim | npm dependencies (`antd`, `lucide-react`, `recharts`, `@lshay/ui`) |
| **Streaming support** | ✅ Debounce 350ms cho streaming | ❌ Không rõ |
| **Display modes** | 3 modes: Preview / Code / **Split** | 2 modes: Preview / Code |
| **Error handling** | postMessage parent-child | Sandpack built-in |

**Đánh giá**:
- **Pho.Chat advantage**: Không phụ thuộc CDN bên ngoài → ổn định hơn, không bị ad-blocker chặn, hoạt động offline. Có Split view (code + preview cạnh nhau).
- **LobeHub advantage**: Code ngắn gọn hơn, dễ maintain. Hỗ trợ nhiều npm packages hơn (antd, radix-ui). Có thể edit code trực tiếp (Sandpack feature).

### 2.3 System Prompt cho Artifacts

| | Pho.Chat | LobeHub v2 |
|---|---|---|
| **Approach** | Monolithic prompt trong `src/tools/artifacts/systemRole.ts` | Modular "Skill" trong `packages/builtin-skills/src/artifacts/` |
| **`<lobeThinking>` tag** | ✅ Required | ❌ **Đã bỏ** — prompt mới không yêu cầu thinking tag |
| **Code artifacts** | Cho phép code artifacts | **KHÔNG cho phép** — "Always present code inline using markdown code blocks, never as an artifact" |
| **Document artifacts** | Cho phép markdown documents | **KHÔNG cho phép** — "Use regular markdown text in conversation" |
| **Focus** | Broad (code, docs, visuals, interactive) | **Narrow** — chỉ interactive/visual content |
| **Custom types** | InteractiveImage, GenerativeDiagram, ContentVisualizer, AIRendering | Không có |

**⚠️ Thay đổi quan trọng trong LobeHub v2**: Prompt artifacts đã được thu hẹp đáng kể — chỉ focus vào **visual/interactive deliverables** (React components, SVG, HTML pages, dashboards). Code snippets và documents giờ phải inline trong chat. Đây là thiết kế có chủ đích để giảm "artifact fatigue" cho users.

### 2.4 Portal State Management

| | Pho.Chat | LobeHub v2 |
|---|---|---|
| **Portal architecture** | Flat state với individual fields | **View Stack** pattern (`portalStack: PortalViewData[]`) |
| **View types** | artifact, file, messageDetail, thread, deepResearch | artifact, file, messageDetail, thread, **document, notebook, groupThread, toolUI** |
| **Navigation** | Direct field setting | Push/pop stack (giống browser history) |
| **Deep Research** | ✅ `portalDeepResearch`, `portalResearch`, `pendingResearchQuery` | ❌ Không có |
| **Split mode** | ✅ `ArtifactDisplayMode.Split` | ❌ Chỉ Code/Preview |

---

## 3. Pho.Chat Custom Features (Không có trong LobeHub)

### 3.1 Content Visualizer Pipeline (26 files)
```
Input → ContentIngestion → ConceptAnalyzer → VisualizationPlanner 
→ ReactArtifactGenerator → QualityValidator → AssemblyOrchestrator → Output
```
- Multi-agent pipeline với 5 chuyên biệt agents
- Tự động tạo interactive React artifacts từ bất kỳ content nào
- Có progress tracking (6 stages: ingestion → analysis → planning → generating → validating → assembling)
- Hỗ trợ: URL, PDF, text, topic → visual artifact

### 3.2 Interactive Image Artifacts
- Cho phép upload ảnh → AI tạo interactive regions (clickable hotspots)
- Hỗ trợ: floor plans, anatomy diagrams, X-rays, charts
- Mỗi region có color, label, details, follow-up questions

### 3.3 Generative Diagrams
- AI tạo interactive diagrams từ JSON data
- Parse tự động từ artifact content
- Custom `DiagramRenderer` component

### 3.4 AI Rendering (Before/After View)
- Upload ảnh → AI rendering/virtual staging
- Before/After slider view
- Hỗ trợ multiple render styles

### 3.5 Slides Tool
- 12 curated style presets (dark, light, specialty)
- Inline editing mode (contenteditable)
- PPT conversion support
- Advanced animation patterns (3D tilt, particles, glitch)
- Speaker notes, fullscreen, print-friendly

### 3.6 Scientific Skills System (12 files)
- Domain-based skill registry (Bioinformatics, Genomics, etc.)
- 170+ scientific skills organized by domain
- Integrated with artifact system

### 3.7 Deep Research Portal Integration
- Research queries trigger from portal
- `portalDeepResearch` / `portalResearch` state flags
- Pending research query management

---

## 4. LobeHub v2 Features (Không có trong Pho.Chat)

### 4.1 Agent Teams / Multi-Agent (117 files)
- Group conversations với multiple AI agents
- AgentCouncil pattern — agents discuss and deliberate
- Supervisor agent orchestrates team
- Task assignment & parallel execution
- **Đây là feature lớn nhất** mà Pho.Chat thiếu

### 4.2 Skill Store & Skill Engine
- Dynamic skill loading (`runSkill`, `readReference`, `execScript`, `exportFile`)
- Skills marketplace — install/manage from store
- Context Engine (`packages/context-engine`) — dynamic context assembly
- Skill-based prompt injection thay vì hardcoded system prompts

### 4.3 Cloud Sandbox
- Remote code execution environment
- `builtin-tool-cloud-sandbox` package
- Hỗ trợ Python, shell commands

### 4.4 Memory System (110 files)
- `packages/memory-user-memory` — personal memory per user
- Persistent memory across sessions
- Memory-aware conversation context

### 4.5 Notebook Tool
- PortalViewType.Notebook
- `builtin-tool-notebook` package
- Note-taking integrated với chat

### 4.6 Desktop App (Electron)
- `apps/desktop/` — full Electron desktop app
- `packages/electron-client-ipc` / `electron-server-ipc`
- Desktop bridge, device gateway

### 4.7 Portal View Stack
- Navigation stack pattern (push/pop views)
- Hỗ trợ: Home, Artifact, Document, Notebook, FilePreview, MessageDetail, ToolUI, Thread, GroupThread
- Giống browser history — có thể go back/forward

### 4.8 Kiến trúc mới
- React Router DOM (SPA) thay vì chỉ Next.js App Router
- Monorepo với 52 packages
- Agent Runtime + Agent Tracing
- Observability (OpenTelemetry)
- Better Auth (thay thế auth cũ)

---

## 5. Đánh giá & Khuyến nghị cho Pho.Chat

### 5.1 Điều Pho.Chat đang làm TỐT hơn LobeHub

| Feature | Tại sao tốt hơn |
|---|---|
| **Custom artifact types** (4 types riêng) | Unique differentiator, không ai có |
| **Content Visualizer pipeline** | Multi-agent pipeline tự động tạo interactive content — enterprise-grade |
| **React renderer không CDN** | Ổn định hơn, không bị ad-blocker, offline-capable |
| **Split view mode** | UX tốt hơn cho developers (code + preview cạnh nhau) |
| **Scientific skills** | Domain-specific — đúng target vertical |
| **Deep Research integration** | Research → Portal → Artifact pipeline |
| **Slides tool** | 12 presets, animations, speaker notes — production-ready |

### 5.2 Điều Pho.Chat THIẾU và CẦN cân nhắc

| Feature | Mức ưu tiên | Lý do |
|---|---|---|
| **Agent Teams** | 🔴 Cao | Multi-agent là trend 2025-2026, đặc biệt cho research workflows (multiple reviewers, debate) |
| **Skill Store/Engine** | 🟡 Trung bình | Modular hơn, nhưng Pho.Chat đã có scientific-skills registry |
| **Memory system** | 🟡 Trung bình | Hữu ích cho returning users, research continuity |
| **Portal View Stack** | 🟢 Thấp | UX improvement nhưng không critical |
| **Cloud Sandbox** | 🟢 Thấp | Nice-to-have cho code execution |
| **Narrowed artifact prompt** | 🟡 Trung bình | LobeHub đã giảm scope artifact — cân nhắc follow? |

### 5.3 Chiến lược đề xuất

**KHÔNG nên merge LobeHub v2 nguyên bộ** vì:
1. Pho.Chat đã diverge quá xa (81 artifact files custom)
2. LobeHub v2 thay đổi kiến trúc lớn (React Router, 52 packages, skill engine)
3. Merge conflict sẽ rất lớn và mất nhiều tuần
4. Pho.Chat có nhiều custom features sẽ bị mất

**NÊN cherry-pick các features cụ thể:**

#### Giai đoạn 1 (Ngay): Cải thiện Artifact Prompt
- Xem xét thu hẹp artifact scope như LobeHub v2 (chỉ visual/interactive)
- Giữ lại custom types (InteractiveImage, GenerativeDiagram, ContentVisualizer, AIRendering)
- Bỏ `<lobeThinking>` tag nếu gây overhead

#### Giai đoạn 2 (1-2 tháng): Agent Teams cho Research
- Implement multi-agent pattern cho systematic review workflows
- Agent roles: Searcher, Screener, Extractor, Quality Assessor, Synthesizer
- Tham khảo LobeHub's `AgentCouncil` + `GroupSupervisor` pattern

#### Giai đoạn 3 (2-3 tháng): Skill Engine
- Migrate scientific-skills sang modular skill engine pattern
- Cho phép users install/manage skills from marketplace
- Tham khảo `packages/builtin-tool-skills` architecture

---

## 6. Appendix: Cây thư mục Artifacts

### Pho.Chat Artifact Files (81 files)
```
src/
├── features/
│   ├── Portal/Artifacts/
│   │   ├── Body/
│   │   │   ├── Renderer/
│   │   │   │   ├── AIRendering.tsx          ← CUSTOM
│   │   │   │   ├── ContentVisualizer.tsx    ← CUSTOM
│   │   │   │   ├── GenerativeDiagram.tsx    ← CUSTOM
│   │   │   │   ├── InteractiveImage.tsx     ← CUSTOM
│   │   │   │   ├── React/
│   │   │   │   │   ├── buildIframeHtml.ts   ← CUSTOM (351 lines)
│   │   │   │   │   ├── escapeJsx.ts         ← CUSTOM
│   │   │   │   │   └── index.tsx            ← CUSTOM (212 lines)
│   │   │   │   ├── SVG.tsx
│   │   │   │   ├── HTML/ (inherited)
│   │   │   │   └── index.tsx                ← CUSTOM (routes to 7 renderers)
│   │   ├── Header.tsx
│   │   └── useEnable.ts
│   └── Conversation/components/MarkdownElements/
│       ├── LobeArtifact/rehypePlugin.ts     ← Same as LobeHub
│       └── LobeThinking/                    ← Will be removed in LobeHub v2
├── services/
│   └── content-visualizer/                  ← CUSTOM (26 files)
│       ├── agents/ (5 specialized agents)
│       ├── types/
│       ├── validators/
│       └── pipeline.ts
├── components/
│   └── InteractiveUI/                       ← CUSTOM (22 files)
│       ├── BeforeAfterView/
│       ├── GenerativeDiagram/
│       └── InteractiveImage/
├── tools/
│   ├── artifacts/systemRole.ts              ← CUSTOM (extended prompt)
│   └── slides/systemRole.ts                 ← CUSTOM
├── scientific-skills/                       ← CUSTOM
└── prompts/
    ├── generative-diagram.ts                ← CUSTOM
    └── interactive-ui-base.ts               ← CUSTOM
```

### LobeHub v2 Artifact Files (62 files)
```
packages/
├── builtin-skills/src/artifacts/            ← NEW: Skill-based architecture
│   ├── content.ts (system prompt)
│   └── index.ts
├── builtin-tool-skills/src/systemRole.ts    ← NEW: Skill engine
└── context-engine/                          ← NEW: Dynamic context

src/
├── features/
│   ├── Portal/Artifacts/
│   │   ├── Body/
│   │   │   └── Renderer/
│   │   │       ├── React/
│   │   │       │   ├── index.tsx            ← Sandpack (52 lines)
│   │   │       │   └── template.ts          ← NEW: Vite template
│   │   │       ├── SVG.tsx
│   │   │       ├── HTML/ (inherited)
│   │   │       └── index.tsx                ← 5 renderers (vs Pho.Chat's 7)
│   │   └── Title.tsx
│   └── Conversation/
│       ├── Markdown/plugins/LobeArtifact/   ← Reorganized path
│       ├── Messages/AgentCouncil/           ← NEW: Multi-agent
│       └── Messages/AssistantGroup/         ← NEW: Group messages
└── services/chat/mecha/skillEngineering.ts  ← NEW: Skill engine
```

---

*Báo cáo scan kỹ thuật cho Pho.Chat — 11/03/2026*
