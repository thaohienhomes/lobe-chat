# Nghiên cứu Artifacts cho Pho.Chat
## So sánh Claude AI vs LobeHub (LobeChat) vs Google Gemini Canvas

**Ngày**: 11/03/2026 | **Mục tiêu**: Đánh giá và lựa chọn chiến lược xây dựng Artifacts cho Pho.Chat

---

## 1. Tổng quan: Artifacts là gì?

Artifacts (hay Canvas) là **không gian làm việc tương tác** được tích hợp vào giao diện chat AI, cho phép người dùng tạo, xem trước, chỉnh sửa và chia sẻ nội dung ngay trong cuộc hội thoại — thay vì chỉ nhận text response rồi copy-paste ra ngoài.

Mỗi nền tảng triển khai artifacts theo cách riêng, nhưng ý tưởng cốt lõi giống nhau: **biến AI chatbot thành công cụ sáng tạo nội dung (co-creation platform)**.

---

## 2. So sánh chi tiết 3 nền tảng

### 2.1 Claude AI Artifacts (Anthropic)

**Ra mắt**: Tháng 6/2024 cùng Claude 3.5 Sonnet

**Kiến trúc kỹ thuật:**
- Model tự quyết định khi nào nên tạo artifact (dựa trên tiêu chí: >15 dòng, self-contained, có khả năng reuse)
- Render trong **sandboxed iframe** phía client
- Hỗ trợ **React components** với Tailwind CSS, các thư viện: recharts, d3, Three.js, lodash, mathjs, Plotly, Tone.js, shadcn/ui, Chart.js, mammoth, tensorflow
- Không dùng localStorage/sessionStorage (dùng React state thay thế)
- Có **Persistent Storage API** (key-value, personal/shared) cho Pro/Max/Team/Enterprise

**Các loại artifact được hỗ trợ:**
- Code (mọi ngôn ngữ) 
- HTML/CSS/JS (render trực tiếp thành web page)
- React components (JSX, render live)
- SVG graphics
- Mermaid diagrams
- Markdown documents
- PDF

**Tính năng nổi bật:**
- **AI-powered artifacts**: Gọi Anthropic API trực tiếp từ trong artifact → tạo AI app không cần backend
- **MCP Integration**: Kết nối external services (Asana, Google Calendar, Slack, v.v.) qua Model Context Protocol
- **Persistent Storage**: Lưu data xuyên session (journals, trackers, leaderboards)
- **Publish & Share**: Tạo link public, người khác mở dùng ngay (AI usage tính vào plan của họ)
- **Remix/Fork**: Người nhận có thể modify artifact tạo bản riêng
- **Version history**: Chuyển đổi giữa các phiên bản trong conversation
- **Artifact Catalog**: Kho artifacts public do cộng đồng đóng góp

**Hạn chế:**
- Không gọi external API trực tiếp từ artifact (phải qua MCP hoặc workaround)
- Không import external images vào artifact
- Không tạo realistic images (SVG only)
- Không hỗ trợ Vue, Angular (chỉ React)

---

### 2.2 LobeHub / LobeChat Artifacts

**Ra mắt**: Phiên bản 1.19 (tháng 9/2024)

**Kiến trúc kỹ thuật:**
- **Phương pháp ban đầu dự kiến**: Dùng Sandpack (CodeSandbox) để render → hỗ trợ nhiều template (Vue, React, Angular)
- **Phương pháp thực tế đã triển khai**: Theo chuẩn Anthropic, sử dụng **XML tags** trong output
  - `<lobeThinking>` — Phần suy nghĩ/đánh giá của model
  - `<lobeArtifact identifier="..." type="..." language="..." title="...">` — Nội dung artifact
- Parsing: Dùng **React Markdown** + **rehype plugin** custom để parse XML tags thành React components
- Render qua hệ thống **Portal** (side panel riêng biệt)

**Cấu trúc XML artifact:**
```xml
<lobeThinking>Evaluating artifact criteria...</lobeThinking>

<lobeArtifact identifier="my-dashboard" type="application/lobe.artifacts.code" language="python" title="Dashboard Script">
  # code content here
</lobeArtifact>
```

**Các type được hỗ trợ:**
- `application/lobe.artifacts.code` — Code (nhiều ngôn ngữ)
- `image/svg+xml` — SVG graphics
- `text/html` — HTML pages
- `application/lobe.artifacts.react` — React components
- `text/markdown` — Documents
- `application/lobe.artifacts.mermaid` — Mermaid diagrams

**Tính năng nổi bật:**
- **Model-agnostic**: Hoạt động với mọi LLM (OpenAI, Claude, Gemini, DeepSeek, Ollama, v.v.)
- **Open-source**: Toàn bộ source code có sẵn để fork/customize
- **Plugin architecture**: Artifacts là một dạng "built-in plugin", mở ra paradigm mới cho custom plugins
- **Version tracking**: Dùng `identifier` attribute để track iterations (cùng ID = cùng artifact, tạo version list)
- **Self-hosted**: Deploy riêng, không phụ thuộc vendor

**Hạn chế:**
- Không có AI-powered artifacts (không gọi API từ trong artifact)
- Không có persistent storage
- Không có publish/share link public
- Prompt artifacts khá dài → ảnh hưởng performance với model yếu
- Một số model không tuân thủ tốt format XML → cần thêm hướng dẫn trong system prompt
- Chưa có Python code execution (đang phát triển)

**Lý do chọn XML thay vì Markdown code blocks** (theo maintainer arvinxx):
1. XML có **structured metadata** (id, title, type) → hỗ trợ versioning
2. Giải quyết **ambiguity** — chương trình biết chính xác khi nào mở Portal vs khi nào chỉ render code block
3. **Strong format** → ổn định hơn cho custom rendering plugins

---

### 2.3 Google Gemini Canvas

**Ra mắt**: Tháng 3/2025 (Gemini app), tháng 7/2025 (AI Mode in Search - Labs), tháng 3/2026 (full rollout US)

**Kiến trúc kỹ thuật:**
- Canvas mở bằng explicit action (chọn "Canvas" từ prompt bar hoặc tool menu) — không tự động kích hoạt
- Render HTML/React code với live preview
- Powered by **Gemini 3** cho app generation (từ 11/2025)
- Google AI Pro/Ultra subscribers: 1 triệu token context window

**Các loại output:**
- Documents (writing/editing)
- Code (HTML, React, Python, web apps)
- Web pages
- Infographics
- Quizzes
- Apps/Games (vibe coding)
- Audio Overviews (chuyển document thành podcast-style discussion)

**Tính năng nổi bật:**
- **Inline editing**: Highlight text → yêu cầu Gemini chỉnh sửa trực tiếp (concise, professional, informal)
- **Export to Google Docs**: 1-click export
- **Knowledge Graph integration**: Grounded bởi Google's data → giảm hallucination
- **Deep Research → Canvas**: Chuyển kết quả Deep Research thành web page, infographic, quiz, audio overview
- **Multi-format conversion**: Từ 1 canvas output → nhiều format khác nhau
- **Search integration**: Canvas hoạt động ngay trong AI Mode của Google Search
- **Massive distribution**: Tiếp cận hàng triệu user Google Search
- **Creative Canvas** (testing): Tạo interactive canvas blocks ngay trong chat window (không phải side panel)

**Hạn chế:**
- Closed-source, không self-host được
- Chỉ available cho US users (English) trên Search
- Workspace users không thể share Canvas content
- Không preview app nếu chứa Workspace data
- Model đôi khi stuck trong loop khi iterating (đặc biệt UI changes phức tạp)
- Không có MCP-like integration
- Không có persistent storage cho artifacts

---

## 3. Bảng so sánh tổng hợp

| Tiêu chí | Claude Artifacts | LobeChat Artifacts | Gemini Canvas |
|---|---|---|---|
| **Open-source** | ❌ | ✅ | ❌ |
| **Self-host** | ❌ | ✅ | ❌ |
| **Model-agnostic** | ❌ (Claude only) | ✅ (mọi LLM) | ❌ (Gemini only) |
| **AI-in-artifact** | ✅ (API calls) | ❌ | ❌ |
| **MCP integration** | ✅ | ❌ (có MCP cho chat, chưa cho artifacts) | ❌ |
| **Persistent storage** | ✅ | ❌ | ❌ |
| **Publish/Share** | ✅ (public link) | ❌ | ❌ (limited sharing) |
| **Inline editing** | ❌ | ❌ | ✅ |
| **Export to Docs** | ❌ | ❌ | ✅ (Google Docs) |
| **React support** | ✅ | ✅ | ✅ |
| **HTML/CSS/JS** | ✅ | ✅ | ✅ |
| **SVG** | ✅ | ✅ | Hạn chế |
| **Mermaid** | ✅ | ✅ | ❌ |
| **Audio output** | ❌ | ❌ | ✅ (Audio Overview) |
| **Infographics** | Manual (SVG/HTML) | Manual | ✅ (native) |
| **Version history** | ✅ | ✅ (via identifier) | Hạn chế |
| **Code execution** | ✅ (JS in browser) | ✅ (JS in browser) | ✅ (JS + Python) |
| **Giá** | Free (limited) / Pro $20/mo | Free (self-host) | Free / AI Pro / AI Ultra |

---

## 4. Phân tích cho Pho.Chat

### 4.1 Pho.Chat đang ở đâu?

Pho.Chat là fork của LobeChat (lobe-chat), nên:
- **Đã có sẵn** codebase artifacts từ LobeChat v1.19+
- Kiến trúc: Next.js + React + Zustand + Ant Design
- Đã có plugin system và MCP support
- Target verticals: Medical Research, Academic Research, Education

### 4.2 Chiến lược đề xuất cho Pho.Chat

#### Giai đoạn 1: Kích hoạt & Tùy chỉnh LobeChat Artifacts (Ngay)

**Việc cần làm:**
1. Đảm bảo artifacts feature đã enabled trong Pho.Chat fork
2. Tùy chỉnh system prompt cho 3 verticals:
   - **Medical Research**: Artifact templates cho PRISMA flowcharts (Mermaid), forest plots (React/SVG), evidence tables (HTML)
   - **Academic Research**: Citation maps, methodology diagrams, literature review matrices
   - **Education**: Interactive quizzes, flashcards, concept maps
3. Tạo preset artifact templates cho từng vertical
4. Cập nhật onboarding/marketing để user biết tính năng này tồn tại (vấn đề đã xác định trước đó)

**Files liên quan trong codebase LobeChat cần xem:**
- `src/features/` — Business feature modules
- Plugin system artifacts rendering
- System prompt configuration cho artifacts

#### Giai đoạn 2: Nâng cấp Artifacts (Trung hạn, 1-3 tháng)

**Tính năng cần bổ sung (ưu tiên cao → thấp):**

1. **Research-specific artifact types:**
   - PRISMA 2020 flowchart generator (interactive Mermaid/SVG)
   - Forest plot builder (React component)
   - Risk of Bias assessment tool (interactive HTML)
   - GRADE evidence profile (structured HTML table)
   - CONSORT/STROBE checklist (interactive form)

2. **Export capabilities:**
   - Export artifact → PDF (cho papers)
   - Export artifact → DOCX (cho submissions)
   - Export SVG/PNG (cho figures)

3. **Persistent Storage** (học từ Claude):
   - Implement key-value storage API tương tự Claude
   - Use case: Lưu research progress, saved searches, annotation history

4. **Share/Publish** (học từ Claude):
   - Tạo public link cho artifacts
   - Use case: Chia sẻ interactive evidence tables, PRISMA diagrams với collaborators

#### Giai đoạn 3: AI-powered Artifacts (Dài hạn, 3-6 tháng)

1. **Embed AI trong artifact** (học từ Claude):
   - Artifact có thể gọi LLM API để phân tích data
   - Use case: Interactive systematic review assistant, AI-powered PICO extractor

2. **Multi-model artifacts:**
   - Tận dụng LobeChat model-agnostic advantage
   - Dùng model phù hợp nhất cho từng task trong artifact

3. **MCP integration cho artifacts:**
   - Kết nối artifacts với PubMed, Semantic Scholar, ClinicalTrials.gov
   - Use case: Live search results rendered as interactive evidence table

---

## 5. Kỹ thuật triển khai chi tiết

### 5.1 Cách LobeChat implement Artifacts (để Pho.Chat customize)

**Flow chính:**
```
User prompt → LLM generates <lobeArtifact> XML → 
React Markdown parser → rehype plugin detects XML tags → 
Replaces with React components → Renders in Portal (side panel)
```

**Các component chính:**
1. **System Prompt**: Chứa instructions cho LLM về khi nào/cách tạo artifact
2. **Rehype Plugin**: Parse `<lobeArtifact>` và `<lobeThinking>` tags
3. **Portal Component**: Side panel hiển thị artifact
4. **Renderers**: HTML renderer, SVG renderer, React renderer, Mermaid renderer, Code renderer

**Customization points cho Pho.Chat:**
- System prompt → Thêm research-specific artifact types và examples
- Renderers → Thêm custom renderers (PRISMA, forest plot, RoB)
- Portal UI → Thêm export buttons, version history
- Storage → Implement persistent storage layer

### 5.2 So sánh rendering approach

| Approach | Ưu điểm | Nhược điểm | Dùng bởi |
|---|---|---|---|
| **Sandboxed iframe** | Bảo mật cao, isolated | Nặng, communication phức tạp | Claude AI |
| **Sandpack (CodeSandbox)** | Multi-template, editable | Dependency ngoài, CDN | LibreChat |
| **rehype + React** | Nhẹ, tích hợp tốt | Ít isolated | LobeChat (Pho.Chat) |
| **Native Canvas** | Tối ưu cho ecosystem | Closed-source | Gemini |

### 5.3 Prompt Engineering cho Artifacts

**Cấu trúc system prompt (pattern từ LobeChat):**

```json
{
  "task_description": "Tạo artifacts cho nội dung nghiên cứu y khoa và học thuật",
  "requirements": [
    "Đánh giá nội dung theo tiêu chí artifact",
    "Xác định loại artifact phù hợp",
    "Không wrap <lobeThinking> hoặc <lobeArtifact> trong code block",
    "Giữ 2 dòng trống giữa </lobeThinking> và <lobeArtifact>"
  ],
  "output_format": {
    "lobeThinking": "Đánh giá artifact",
    "lobeArtifact": {
      "attributes": {
        "identifier": "unique-id",
        "type": "application/lobe.artifacts.react | text/html | image/svg+xml | ...",
        "title": "Tiêu đề ngắn"
      }
    }
  }
}
```

---

## 6. Kết luận & Khuyến nghị

### Cho Pho.Chat ngay bây giờ:
1. **Kích hoạt artifacts** nếu chưa enable
2. **Tùy chỉnh system prompt** cho research verticals
3. **Marketing**: Đây là differentiator lớn — interactive research tools ngay trong chat

### Học từ Claude:
- AI-powered artifacts, persistent storage, publish/share
- Mô hình "artifact as mini-app" rất phù hợp cho research tools

### Học từ Gemini:
- Inline editing (highlight → edit) — UX tốt cho writing/editing
- Multi-format export (document → web page → quiz → audio)
- Deep Research → Canvas pipeline = Pho.Chat's Deep Research → Artifact pipeline

### Lợi thế cạnh tranh của Pho.Chat:
- **Open-source + Model-agnostic** (từ LobeChat)
- **Domain-specific artifacts** cho medical/academic research (chưa ai làm)
- **Integrated research tools** (PubMed, PRISMA, GRADE, v.v.) + Artifacts = unique value proposition

---

*Tài liệu nghiên cứu cho Pho.Chat — Tháng 3/2026*
