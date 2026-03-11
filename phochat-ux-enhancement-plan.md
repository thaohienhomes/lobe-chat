# Bài học UI/UX từ Claude AI, ChatGPT, Gemini → Áp dụng cho Pho.Chat

**Ngày**: 11/03/2026 | **Mục tiêu**: Fix lỗi UI/UX & nâng cấp artifacts Pho.Chat

---

## 1. Tổng quan: 4 nền tảng so sánh UX

| UX Feature | Claude Artifacts | ChatGPT Canvas | Gemini Canvas | Pho.Chat hiện tại |
|---|---|---|---|---|
| **Inline editing** (highlight → edit) | ✅ | ✅✅ (tốt nhất) | ✅ | ❌ |
| **Suggest edits** (gợi ý chỉnh sửa) | ❌ | ✅ (accept/reject) | ❌ | ❌ |
| **Auto-open** khi cần | ✅ (AI tự quyết) | ✅ (>10 dòng) | ❌ (manual) | ✅ (AI quyết) |
| **Version history** | ✅ (navigate versions) | ✅ (back button) | Hạn chế | ✅ (via identifier) |
| **Export** | Copy code | PDF, MD, DOCX, code files | Google Docs | ✅ HTML, PDF (print) |
| **Publish/Share link** | ✅ | ❌ | ❌ | ❌ |
| **Direct editing** (gõ vào artifact) | ❌ | ✅ | ✅ | ❌ |
| **Split view** (code + preview) | ❌ | ❌ | ❌ | ✅ ← **Pho.Chat dẫn** |
| **Streaming UX** | Preview khi done | N/A | N/A | ✅ Split khi stream |
| **Error recovery** ("Fix with Claude") | ✅ | ❌ | ❌ | ❌ |
| **Shortcuts menu** | ❌ | ✅ (6 writing, 5 coding) | Quick tools | ❌ |
| **Reading level adjust** | ❌ | ✅ (K → Graduate) | ❌ | ❌ |
| **Persistent storage** | ✅ (20MB/artifact) | ❌ | ❌ | ❌ |
| **MCP integration** | ✅ | ❌ | ❌ | ❌ |
| **AI inside artifact** | ✅ (API calls) | ❌ | ❌ | ❌ |

---

## 2. Lỗi UI/UX phổ biến trong Pho.Chat (từ scan code)

### 2.1 Không có Error Boundary / Fallback UI

**Vấn đề**: `Renderer/index.tsx` không có error handling. Nếu artifact render fail (bad JSON, invalid React, broken SVG), user thấy blank screen hoặc crash.

**So sánh**: Claude có nút **"Try fixing with Claude"** khi artifact lỗi — tự copy error details vào chat.

**Fix đề xuất**:
```tsx
// Wrap mỗi renderer trong ErrorBoundary
import { ErrorBoundary } from 'react-error-boundary';

const Renderer = memo(({ content, type }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 text-center">
          <p>⚠️ Artifact render failed</p>
          <button onClick={() => /* copy error to chat */}>
            Fix with AI
          </button>
          <button onClick={() => /* switch to code view */}>
            View Code
          </button>
        </div>
      }
    >
      {/* actual renderer */}
    </ErrorBoundary>
  );
});
```

### 2.2 Không có Loading State

**Vấn đề**: Khi artifact đang load (đặc biệt React renderer phải compile Babel), user thấy blank panel.

**So sánh**: ChatGPT Canvas hiển thị shimmer/skeleton khi loading. Gemini có progress indicator.

**Fix đề xuất**: Thêm skeleton loader trong `ArtifactsUI` component khi `isMessageGenerating && !artifactContent`.

### 2.3 Streaming Flicker — iframe thrashing

**Vấn đề hiện tại**: React renderer có debounce 350ms, nhưng mỗi lần debounce fire = tạo blob URL mới = iframe reload = flicker.

**So sánh**: Claude chỉ render preview SAU KHI artifact tag đóng. Pho.Chat đã implement logic này (split khi streaming → preview khi done) nhưng trong split mode, preview panel vẫn re-render liên tục.

**Fix đề xuất**:
- Trong split mode khi streaming: chỉ render code panel, preview panel show "Building..." placeholder
- Hoặc tăng debounce lên 800-1000ms cho split mode
- Hoặc chỉ render preview khi artifact tag closed (theo cách Claude làm)

### 2.4 Split View border quá tối

**Vấn đề**: `borderRight: '1px solid rgba(255,255,255,0.1)'` — hardcoded dark theme color. Trên light theme sẽ invisible.

**Fix**: Dùng theme token thay vì hardcode: `border-right: 1px solid var(--lobe-border-color)`

### 2.5 Font size không nhất quán

**Vấn đề**: Split mode code panel dùng `fontSize: 11`, normal code view dùng `fontSize: 12`. Sự khác biệt nhỏ nhưng tạo cảm giác inconsistent.

### 2.6 Portal Header không show trạng thái streaming

**Vấn đề**: Header chỉ show title + display mode toggle. Không có indicator artifact đang generating.

**So sánh**: ChatGPT Canvas hiển thị shimmer effect trên composer khi AI đang streaming.

**Fix đề xuất**: Thêm pulse dot hoặc "Generating..." text bên cạnh title khi `isMessageGenerating`.

### 2.7 Download menu thiếu format

**Hiện tại**: Chỉ có PDF (via print) và HTML.

**So sánh**: ChatGPT Canvas export ra PDF, Markdown, DOCX, và code files (.py, .js, .sql).

**Fix đề xuất**: Thêm download options: Markdown, raw code file, PNG (cho SVG/diagram artifacts).

---

## 3. Bài học UX từ từng nền tảng

### 3.1 Từ Claude AI — "Artifact as Micro-App"

**Bài học chính**: Claude đã biến artifacts thành platform cho micro-apps, không chỉ code preview.

**Tính năng nên học**:

#### a) "Fix with Claude" Button
Khi artifact lỗi → hiện nút → click → tự copy error message vào chat → AI fix.

**Implementation cho Pho.Chat:**
```tsx
// Trong ErrorBoundary fallback
const handleFixWithAI = (error: Error) => {
  const errorMessage = `The artifact "${artifactTitle}" encountered an error:\n\`\`\`\n${error.message}\n${error.stack}\n\`\`\`\nPlease fix this issue.`;
  // Inject message into chat composer
  useChatStore.getState().setInputMessage(errorMessage);
};
```

#### b) Persistent Storage
Claude cho phép artifacts lưu data xuyên session (journals, trackers).

**Cho Pho.Chat research vertical:**
- Lưu research progress (papers screened, included, excluded)
- Lưu PRISMA flowchart state
- Lưu annotation history trên uploaded papers

#### c) AI-powered Artifacts
Artifacts gọi được Claude API → tạo interactive AI apps.

**Cho Pho.Chat:**
- PICO extractor artifact: user paste abstract → artifact gọi LLM → extract P, I, C, O
- Evidence grader: user input study details → artifact gọi LLM → GRADE assessment
- Literature screener: show abstract → user swipe accept/reject → AI learns criteria

#### d) Publish & Share
Claude cho share artifact qua public link.

**Cho Pho.Chat research:**
- Chia sẻ PRISMA flowchart với co-authors
- Chia sẻ evidence tables với reviewers
- Chia sẻ interactive forest plots cho presentations

### 3.2 Từ ChatGPT Canvas — "The Editor Experience"

**Bài học chính**: ChatGPT Canvas biến AI thành collaborative editor, UX giống Google Docs hơn là code preview.

**Tính năng nên học**:

#### a) Highlight → Edit (Critical)
User highlight text/code → popup input → type instruction → AI chỉ sửa phần đó.

**Đây là feature UX impact cao nhất mà Pho.Chat thiếu.**

**Implementation approach:**
1. Artifact content editable (contenteditable hoặc Monaco editor)
2. User select text → floating toolbar appears
3. User type: "make this more concise" / "fix this function"
4. AI receives: full artifact + highlighted selection + instruction
5. AI returns: chỉ phần được sửa, merge vào artifact

#### b) Shortcut Menu (Quick Actions)
Floating menu bottom-right với preset actions:

**Writing shortcuts** (cho research documents):
- "Suggest edits" — inline suggestions accept/reject
- "Adjust length" — slider shorter ↔ longer
- "Change reading level" — K → Graduate School
- "Add citations" — (custom cho Pho.Chat!)
- "Check methodology" — (custom cho Pho.Chat!)

**Coding shortcuts**:
- "Review code" — inline code review
- "Add comments" — auto-comment code
- "Fix bugs" — detect + fix
- "Port language" — translate code

#### c) Direct Typing in Artifact
User có thể click vào artifact và gõ trực tiếp, không cần qua chat.

**Implementation**: Thay thế static render bằng editable component. Khi user edit → diff với original → AI có thể react.

#### d) Auto-trigger (>10 lines)
ChatGPT tự mở Canvas khi response >10 dòng code hoặc phát hiện task phức tạp.

**Pho.Chat đã có logic tương tự** qua `<lobeArtifact>` tag — nhưng cần tune prompt để model quyết định tốt hơn khi nào nên/không nên tạo artifact.

#### e) Export đa dạng
PDF, Markdown, DOCX, code files — tất cả 1-click.

**Pho.Chat đang thiếu**: Markdown export, DOCX export, code file export (.py, .r, .js).

### 3.3 Từ Google Gemini Canvas — "Search + Create"

**Bài học chính**: Gemini tích hợp Canvas vào Search — kết hợp research + creation trong cùng workflow.

**Tính năng nên học**:

#### a) Deep Research → Canvas Pipeline
Gemini: Deep Research report → click "Create" → chọn format (web page, infographic, quiz, audio overview).

**Cho Pho.Chat (đã có Deep Research integration!):**
- Deep Research kết quả → "Visualize as..." dropdown
- Options: PRISMA flowchart, Evidence table, Forest plot, Summary infographic
- Tự động tạo artifact từ research results

#### b) Multi-format Conversion
Từ 1 canvas output → convert sang web page, quiz, infographic, audio overview.

**Cho Pho.Chat research:**
- Evidence table → export as DOCX for paper submission
- PRISMA flowchart → export as SVG for publication
- Research summary → convert thành presentation slides
- Study data → convert thành interactive dashboard

#### c) Inline Text Editing (highlight → change tone)
Gemini: Highlight paragraph → "make it more concise, professional, or informal".

**Tương tự ChatGPT highlight-to-edit** — nên implement chung.

#### d) Knowledge Graph Grounding
Gemini Canvas được grounded bởi Google Knowledge Graph → giảm hallucination.

**Cho Pho.Chat:** Tích hợp PubMed/Semantic Scholar data làm grounding source cho artifacts.

### 3.4 Từ ChatGPT Apps SDK — "Design System"

**Bài học ẩn**: OpenAI vừa release Apps SDK UI guidelines với:
- Figma component library
- Tailwind + CSS variable design tokens
- Accessible, consistent components
- Light/dark mode tokens tự động

**Cho Pho.Chat**: Xây dựng internal design system cho artifacts:
- Consistent color tokens (không hardcode `rgba(255,255,255,0.1)`)
- Standard spacing/padding
- Accessible contrast ratios
- Responsive breakpoints cho mobile

---

## 4. Ưu tiên Implementation (Roadmap)

### Phase 1: Fix Critical UX Bugs (1-2 tuần)

| # | Task | Impact | Effort |
|---|---|---|---|
| 1 | **Error Boundary** + "Fix with AI" button | 🔴 High — user thấy blank screen | Nhỏ |
| 2 | **Loading skeleton** khi artifact đang generate | 🔴 High — confusion | Nhỏ |
| 3 | **Streaming indicator** trong Header | 🟡 Medium | Rất nhỏ |
| 4 | Fix **hardcoded dark theme** border color | 🟡 Medium — broken light theme | Rất nhỏ |
| 5 | Fix **font size inconsistency** (11 vs 12) | 🟢 Low | Rất nhỏ |
| 6 | Thêm **error message display** khi JSON parse fails (InteractiveImage, GenerativeDiagram) | 🔴 High | Nhỏ |

### Phase 2: Core UX Enhancements (2-4 tuần)

| # | Task | Học từ | Impact |
|---|---|---|---|
| 7 | **Highlight → Edit** cho text artifacts | ChatGPT, Gemini | 🔴 Game-changer |
| 8 | **Quick Actions menu** (shortcuts) | ChatGPT | 🔴 High |
| 9 | **Export menu mở rộng** (MD, DOCX, PNG, code file) | ChatGPT | 🟡 Medium |
| 10 | **Deep Research → Artifact pipeline** (tận dụng existing portalDeepResearch) | Gemini | 🟡 Medium |
| 11 | **Publish/Share link** cho artifacts | Claude | 🟡 Medium |

### Phase 3: Advanced Features (1-3 tháng)

| # | Task | Học từ | Impact |
|---|---|---|---|
| 12 | **AI-powered artifacts** (gọi LLM từ trong artifact) | Claude | 🔴 Unique value |
| 13 | **Persistent storage** cho research artifacts | Claude | 🟡 Medium |
| 14 | **Direct editing** trong artifact (contenteditable) | ChatGPT, Gemini | 🟡 Medium |
| 15 | **Research-specific shortcuts**: "Add citations", "Check methodology", "Grade evidence" | Original | 🔴 Differentiator |
| 16 | **Multi-format conversion**: Evidence table → DOCX, PRISMA → SVG publication-ready | Gemini | 🟡 Medium |

### Phase 4: Platform Features (3-6 tháng)

| # | Task | Học từ | Impact |
|---|---|---|---|
| 17 | **Artifact Marketplace** — share/install community artifacts | Claude catalog | 🟡 Medium |
| 18 | **Multi-agent artifacts** — multiple AI agents collaborate on artifact | LobeHub v2 | 🔴 High |
| 19 | **MCP integration** cho artifacts (connect PubMed, Semantic Scholar) | Claude | 🔴 High |
| 20 | **Design system** — consistent tokens, accessible components | ChatGPT Apps SDK | 🟢 Foundational |

---

## 5. Quick Wins — Code Fixes ngay bây giờ

### Fix 1: Error Boundary (thêm vào `Renderer/index.tsx`)

```tsx
import { Component, type ReactNode } from 'react';

class ArtifactErrorBoundary extends Component<
  { children: ReactNode; onError?: (error: Error) => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 8 }}>
            ⚠️ Artifact failed to render
          </div>
          <code style={{ fontSize: 11, opacity: 0.7 }}>
            {this.state.error.message}
          </code>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => this.setState({ error: null })}>
              Retry
            </button>
            <button onClick={() => this.props.onError?.(this.state.error!)}>
              Fix with AI
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Fix 2: Streaming Indicator trong Header

```tsx
// Trong Header component, thêm bên cạnh title:
{isMessageGenerating && !isArtifactTagClosed && (
  <span style={{ 
    animation: 'pulse 1.5s infinite',
    color: '#3b82f6',
    fontSize: 12 
  }}>
    ● Generating...
  </span>
)}
```

### Fix 3: Theme-aware border

```tsx
// Replace hardcoded color
borderRight: '1px solid rgba(255,255,255,0.1)'
// With
borderRight: `1px solid ${token.colorBorderSecondary}`
// Or CSS variable
borderRight: '1px solid var(--ant-color-border-secondary)'
```

---

## 6. Kết luận

**Pho.Chat artifact system đã rất advanced** — có 4 custom artifact types mà không nền tảng nào có. Nhưng UX layer đang thiếu polish so với Claude/ChatGPT/Gemini.

**Top 3 priorities:**
1. **Fix bugs** (error boundary, loading, streaming) — 1-2 tuần
2. **Highlight → Edit** — feature có ROI cao nhất, biến artifact từ "view-only" thành "collaborative editor"
3. **Research-specific shortcuts** — đây là unique selling point, không ai làm cho medical/academic research

**Triết lý:**
- Claude = "Artifact as Micro-App Platform" (AI-powered, persistent, shareable)
- ChatGPT = "Artifact as Collaborative Editor" (inline edit, shortcuts, direct typing)
- Gemini = "Artifact as Creation Hub" (research → create → multi-format)
- **Pho.Chat = "Artifact as Research Workbench"** (PRISMA, GRADE, evidence tables, domain-specific AI tools)

Kết hợp cả 3 triết lý vào research context = unique value proposition không ai có.

---

*Báo cáo UX Enhancement cho Pho.Chat — 11/03/2026*
