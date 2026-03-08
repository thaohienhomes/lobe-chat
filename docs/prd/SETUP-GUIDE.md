# Hướng dẫn đưa PRD vào Agent Workflow

## Tại sao KHÔNG dùng file DOCX cho agents?

- Agents (Claude Code, Antigravity) đọc **plain text / markdown** — không parse được DOCX
- DOCX phù hợp cho người đọc (PM review, stakeholder share) — đã tạo sẵn ở PRD v1.0 và v1.1
- Markdown phù hợp cho agents — có cấu trúc, code blocks, schema definitions agent đọc trực tiếp

## Cấu trúc thư mục trong repo

Commit các files này vào repo `thaohienhomes/lobe-chat`:

```
thaohienhomes/lobe-chat/
├── CLAUDE.md                                    ← CẬP NHẬT file này (xem bên dưới)
├── docs/
│   └── prd/
│       ├── README.md                            ← index file
│       ├── prd-interactive-generative-ui.md     ← PRD v1.0 (tổng thể 5 phases)
│       └── phase-2.5-content-visualizer.md      ← PRD v1.1 (Phase 2.5 chi tiết)
├── src/
│   ├── services/
│   │   └── content-visualizer/                  ← Agent sẽ tạo folder này
│   └── components/
│       ├── InteractiveUI/                       ← Phase 1-2
│       └── ContentVisualizer/                   ← Phase 2.5
└── ...
```

## Cách setup

### Bước 1: Tạo folder docs/prd/ trong repo

```bash
cd thaohienhomes/lobe-chat
mkdir -p docs/prd
```

### Bước 2: Copy 2 file markdown PRD vào

Copy nội dung từ 2 file markdown đã tạo:

- `prd-interactive-generative-ui.md` → `docs/prd/prd-interactive-generative-ui.md`
- `phase-2.5-content-visualizer.md` → `docs/prd/phase-2.5-content-visualizer.md`

### Bước 3: Tạo docs/prd/README.md

```markdown
# Pho.Chat Product Requirements Documents

## Active PRDs

| Document | Version | Scope |
|----------|---------|-------|
| [PRD: Interactive & Generative UI](./prd-interactive-generative-ui.md) | v1.0 | Phases 1–5 overview |
| [Phase 2.5: Content Visualizer](./phase-2.5-content-visualizer.md) | v1.1 | Multi-agent pipeline detail |

## Implementation Status

- [ ] Phase 1: Interactive Images
- [ ] Phase 2: Generative Diagrams
- [ ] Phase 2.5: Content Visualizer
- [ ] Phase 3: AI Rendering
- [ ] Phase 4: Generative UI Engine
- [ ] Phase 5: Creator Studio
```

### Bước 4: Bổ sung vào CLAUDE.md

Thêm đoạn sau vào file `CLAUDE.md` hiện tại trong repo:

```markdown
## Product Requirements Documents

PRD files nằm tại `docs/prd/`. Agent PHẢI đọc PRD trước khi implement bất kỳ feature nào
thuộc Interactive & Generative UI.

### Danh sách PRD
- `docs/prd/prd-interactive-generative-ui.md` — Tổng quan 5 phases + kiến trúc tích hợp
- `docs/prd/phase-2.5-content-visualizer.md` — Chi tiết 7-agent pipeline, schemas, file structure

### Implementation Priority
Bắt đầu từ Phase 1 (Interactive Images) trừ khi được chỉ định khác.
Đọc section "Implementation Priority" trong mỗi PRD để biết thứ tự triển khai.

### Coding Conventions cho Interactive UI features
- Tất cả components mới đặt trong `src/components/InteractiveUI/` (Phase 1-2)
  hoặc `src/components/ContentVisualizer/` (Phase 2.5)
- Services đặt trong `src/services/content-visualizer/`
- Type definitions đặt trong `src/services/content-visualizer/types/`
- System prompts đặt trong `src/prompts/`
- Dùng Tailwind CSS only trong Artifact components (không custom CSS)
- Tất cả schemas phải match TypeScript interfaces trong PRD
```

### Bước 5: Commit

```bash
git add docs/prd/ CLAUDE.md
git commit -m "docs: add PRD for Interactive & Generative UI (v1.0 + Phase 2.5)"
git push
```

---

## Cách sử dụng với từng Agent

### Claude Code CLI

Claude Code tự động đọc `CLAUDE.md` khi bắt đầu session. Nhờ reference trong CLAUDE.md,
agent sẽ biết tìm PRD ở đâu. Khi yêu cầu implement, nói:

```
Đọc PRD tại docs/prd/prd-interactive-generative-ui.md và implement Phase 1:
Interactive Images. Bắt đầu từ component InteractiveImage theo file structure
trong PRD section 8.2.
```

Hoặc cụ thể hơn:

```
Đọc docs/prd/phase-2.5-content-visualizer.md và implement Step 1-2:
tạo type definitions và ContentIngestion agent với arxiv-parser.
```

### Antigravity Agents

Tùy vào cách Antigravity agents truy cập codebase:

**Nếu agent có quyền đọc repo (GitHub integration):**

- Agent đọc trực tiếp `docs/prd/*.md` từ repo
- Reference trong prompt: "Read docs/prd/prd-interactive-generative-ui.md"

**Nếu agent KHÔNG đọc được repo:**

- Copy-paste nội dung markdown PRD vào prompt/context của agent
- Hoặc upload file .md vào agent's context window
- Ưu tiên paste phần "Implementation Priority" + "File Structure" + relevant phase

### Tips chung cho cả 2 loại agent

1. **Luôn chỉ định Phase cụ thể** — đừng nói "implement PRD", hãy nói "implement Phase 1 Step 3"
2. **Reference file paths** — agent cần biết tạo file ở đâu, PRD đã liệt kê đầy đủ
3. **Verify schemas** — sau khi agent tạo code, check TypeScript interfaces match PRD
4. **Iterative** — implement 1 step → test → tiếp step sau
