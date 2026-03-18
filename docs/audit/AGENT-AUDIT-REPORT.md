# Pho.Chat Agent Ecosystem Audit Report

> Generated: 2026-03-12
> Repo: thaohienhomes/lobe-chat
> Auditor: Claude Code CLI

---

## 1. Tổng quan hệ sinh thái

### 1.1 Thống kê tổng hợp

| Hạng mục                              | Số lượng                                                                                                                                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Default Agent (Phở Assistant)**     | 1 (inbox session)                                                                                                                                                                                               |
| **Scientific Agents (Discover page)** | 8 (Drug Discovery, Bioinformatics, Clinical Research, Data Science, Scientific Writer, Protein Engineering, Materials Science, Lab Automation)                                                                  |
| **Bundled Apps (seeded to DB)**       | 6 (Artifact Creator, Code Reviewer, Content Writer, Biomedical Research, Clinical Literature Reviewer, Medical Educator)                                                                                        |
| **API Template Agent**                | 1 (Phở Medical Research — `/api/assistants/medical-research`)                                                                                                                                                   |
| **Built-in Tools**                    | 6 (Artifacts, Slides, DALL-E 3, Web Browsing, Local System, Scientific Skills)                                                                                                                                  |
| **System Prompts chuyên biệt**        | 5 (Interactive UI Base + 3 verticals, Generative Diagram + 2 verticals)                                                                                                                                         |
| **Plugins tự phát triển (Phở Chat)**  | 10 (7 bundled + 3 API-only)                                                                                                                                                                                     |
| **Agents từ marketplace (remote)**    | \~300+ (fetched từ LobeHub agents-index)                                                                                                                                                                        |
| **Built-in Translation Features**     | 2 (inline translateMessage + Document Translation plugin)                                                                                                                                                       |
| **Prompt Chains (system agents)**     | 13 (translate, langDetect, summaryTitle, summaryHistory, summaryAgentName, summaryDescription, summaryTags, summaryGenerationTitle, pickEmoji, rewriteQuery, abstractChunk, answerWithContext, knowledgeBaseQA) |
| **TỔNG CỘNG local agents/apps**       | **16** (1 default + 8 scientific + 6 bundled apps + 1 API template)                                                                                                                                             |

### 1.2 Kiến trúc Agent trong codebase

#### Agent Loading Flow

```
[Remote Index] ──fetch──→ AssistantStore.getAgentIndex()
  URL: https://registry.npmmirror.com/@lobehub/agents-index/v1/files/public
  Format: index.{locale}.json → { agents: [...] }
  Mỗi agent: {identifier}.{locale}.json → { systemRole, meta, config }

[EdgeConfig Filter] ──whitelist/blacklist──→ Filtered agent list

[User selects agent] → agentMap[sessionId] = { systemRole, config }

[Chat] → systemRole injected as system message → LLM call
```

#### Agent Marketplace

- **Source**: `@lobehub/agents-index` npm package, hosted trên npmmirror CDN
- **Format**: Mỗi agent là 1 JSON file với fields: `identifier`, `author`, `meta` (avatar, title, description, tags), `systemRole`, `config` (model, params)
- **Locale support**: Mỗi agent có bản dịch theo locale (en-US, zh-CN, vi-VN, etc.)
- **Custom URL**: Có thể override qua env `AGENTS_INDEX_URL`
- **Access control**: EdgeConfig hỗ trợ whitelist/blacklist agent identifiers

#### Default Agent (Phở Assistant)

Được define tại `src/store/agent/slices/chat/initialState.ts` với custom systemRole cho Phở Chat, bao gồm:

- Artifact/visualization capabilities
- Available sandbox libraries (Tailwind, Ant Design, React Three Fiber, Mafs, etc.)
- Rules cho code generation

---

## 2. Danh sách Agents chi tiết

### 2.1 Built-in Agent: Phở Assistant (Default)

#### Agent: Phở Assistant

| Thuộc tính          | Chi tiết                                    |
| ------------------- | ------------------------------------------- |
| **ID / Slug**       | `inbox` (default session)                   |
| **Tác giả**         | Phở Chat team                               |
| **Nguồn gốc**       | Custom — Phở Chat specific                  |
| **Ngôn ngữ hỗ trợ** | Đa ngôn ngữ (Vietnamese + English primary)  |
| **Lĩnh vực**        | General purpose + Visualization             |
| **Tags**            | general, visualization, 3D, math, artifacts |

**System Prompt (trích dẫn đầy đủ):**

```
You are Phở Assistant (Phở Chat), a helpful AI with powerful visualization capabilities.

# Artifacts & Visualization
When the user asks you to create a UI, component, game, simulation, or visualization, you MUST generate code that triggers the "Preview in Phở Artifact" feature.

## Available Libraries in Artifact Sandbox:
- **UI**: Tailwind CSS, Ant Design, Lucide React icons, Radix UI, Recharts
- **3D Graphics**: React Three Fiber (@react-three/fiber), Drei (@react-three/drei), Three.js
- **Mathematics**: Mafs (interactive math viz), KaTeX (math equations), D3.js (data viz)
- **Animation**: Framer Motion, React Spring

## Rules:
1. Use 'tsx' or 'react' language block for your code
2. Use Tailwind CSS for styling
3. For 3D: Use @react-three/fiber with Canvas component
4. For Math: Use Mafs for interactive graphs, KaTeX for equations
5. DO NOT explain the code, just output the code block unless asked

## Examples:
- "Create 3D DNA structure" → Use React Three Fiber with animated helical geometry
- "Visualize quadratic function" → Use Mafs with Plot.OfX
- "Interactive solar system" → Use React Three Fiber with OrbitControls
```

**Đánh giá tính thực tiễn (1-10):**

- Chất lượng prompt: **7/10** — Rõ ràng, có library list cụ thể, có examples. Thiếu role definition sâu hơn cho non-visualization tasks.
- Khả năng ứng dụng thực tế: **8/10** — Trực tiếp hữu ích cho tạo artifact/visualization.
- Tính chuyên sâu: **6/10** — Tập trung visualization, thiếu guidance cho 3 vertical chính (Y tế, Học thuật, Giáo dục).
- Khả năng mở rộng: **9/10** — Có thể inject thêm vertical-specific instructions.

**Đánh giá cho Pho.Chat:**

- [x] Có thể dùng trực tiếp cho user
- Lý do: Đây là default agent, đã customized cho Phở Chat. Nên bổ sung thêm instructions cho 3 vertical chính.

---

### 2.2 System Prompts chuyên biệt (Local)

#### Prompt: Interactive UI Base

| Thuộc tính    | Chi tiết                                                                              |
| ------------- | ------------------------------------------------------------------------------------- |
| **File**      | `src/prompts/interactive-ui-base.ts`                                                  |
| **Tác giả**   | Phở Chat team                                                                         |
| **Chức năng** | Tạo interactive visual experiences (image analysis, diagrams, comparisons, mini apps) |
| **Biến thể**  | `realEstateVerticalPrompt`, `educationVerticalPrompt`, `medicalVerticalPrompt`        |

**Đánh giá:**

- Chất lượng prompt: **8/10** — Chi tiết, có schema rõ ràng cho interactive image artifacts, có FORMAT DECISION RULES
- Khả năng ứng dụng: **9/10** — Trực tiếp phục vụ core feature của Phở Chat
- Tính chuyên sâu: **8/10** — Có 3 vertical variants (BDS, Education, Medical) với instructions cụ thể
- Medical variant có disclaimer: "This is for educational purposes only, not a diagnosis" ✅

#### Prompt: Generative Diagrams

| Thuộc tính    | Chi tiết                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------ |
| **File**      | `src/prompts/generative-diagram.ts`                                                        |
| **Tác giả**   | Phở Chat team                                                                              |
| **Chức năng** | Tạo 6 loại diagram (structural, process_flow, comparison, timeline, map_based, simulation) |
| **Biến thể**  | `educationDiagramPrompt`, `realEstateDiagramPrompt`                                        |

**Đánh giá:**

- Chất lượng prompt: **9/10** — Schema JSON chi tiết cho từng loại diagram, có ví dụ cụ thể
- Khả năng ứng dụng: **9/10** — Rất hữu ích cho giáo dục (animation steps) và BĐS (comparison, simulation)
- Education variant: bilingual labels, color-coded by function, animation steps ✅
- Real estate variant: VND currency, m² area, phí quản lý ✅

---

### 2.3 Scientific Agents (Discover Page)

**File**: `src/scientific-skills/agents/index.ts`
**Model**: Tất cả dùng `claude-sonnet-4-20250514` + plugin `pho-scientific-skills`

| #   | ID                        | Tên                         | Avatar | Lĩnh vực chính                    | Đánh giá   |
| --- | ------------------------- | --------------------------- | ------ | --------------------------------- | ---------- |
| 1   | `pho-drug-discovery`      | Drug Discovery Assistant    | 💊     | RDKit, ChEMBL, ADMET, DiffDock    | ⭐⭐⭐⭐⭐ |
| 2   | `pho-bioinformatics`      | Bioinformatics Researcher   | 🧬     | Scanpy, BioPython, scRNA-seq      | ⭐⭐⭐⭐⭐ |
| 3   | `pho-clinical-research`   | Clinical Research Assistant | 🏥     | ClinVar, PharmGKB, PICO framework | ⭐⭐⭐⭐⭐ |
| 4   | `pho-data-science`        | Data Science & ML Assistant | 🤖     | scikit-learn, PyTorch, SHAP       | ⭐⭐⭐⭐   |
| 5   | `pho-scientific-writer`   | Scientific Writer           | 📝     | PubMed, Zotero, LaTeX, IMRaD      | ⭐⭐⭐⭐⭐ |
| 6   | `pho-protein-engineering` | Protein Engineer            | 🔬     | AlphaFold, ESM, Adaptyv           | ⭐⭐⭐⭐   |
| 7   | `pho-materials-science`   | Materials Scientist         | ⚗️     | Pymatgen, COBRApy, Astropy        | ⭐⭐⭐⭐   |
| 8   | `pho-lab-automation`      | Lab Automation Specialist   | 🧪     | Opentrons, Benchling, LaminDB     | ⭐⭐⭐⭐   |

**Đánh giá chung Scientific Agents:**

- Chất lượng prompt: **9/10** — Tất cả đều có `<expertise>`, `<workflow>`, `<code_guidelines>` XML tags cấu trúc rõ ràng
- Khả năng ứng dụng: **8/10** — Rất hữu ích cho researchers, nhưng cần Python execution environment (Scientific Skills plugin)
- Tính chuyên sâu: **9/10** — Mỗi agent cover 1 domain cụ thể với tools/databases chi tiết
- An toàn: **Tốt** — pho-clinical-research có PICO framework, evidence levels, VUS flagging
- **Thiếu**: Medical disclaimers cho clinical-research agent ⚠️

---

### 2.4 Bundled Apps (Seeded to Database)

**File**: `scripts/seedBundledApps/index.ts`

| #   | ID                              | Tên                        | Model                         | Category    | Featured | Đánh giá   |
| --- | ------------------------------- | -------------------------- | ----------------------------- | ----------- | -------- | ---------- |
| 1   | `artifact-creator`              | Artifact Creator           | gemini-2.0-flash-exp (Google) | development | ✅       | ⭐⭐⭐     |
| 2   | `code-reviewer`                 | Code Reviewer              | claude-3-5-sonnet (Anthropic) | development | ✅       | ⭐⭐⭐     |
| 3   | `content-writer`                | Content Writer             | gpt-4o (OpenAI)               | creative    | ❌       | ⭐⭐⭐     |
| 4   | `biomedical-research-assistant` | Trợ lý Nghiên cứu Y sinh   | o3-deep-research (OpenAI)     | education   | ✅       | ⭐⭐⭐⭐⭐ |
| 5   | `clinical-literature-reviewer`  | Chuyên gia Phân tích Y văn | claude-3-5-sonnet (Anthropic) | education   | ✅       | ⭐⭐⭐⭐⭐ |
| 6   | `medical-educator`              | Trợ lý Giảng viên Y khoa   | gemini-2.0-flash-exp (Google) | education   | ❌       | ⭐⭐⭐⭐⭐ |

**Phân tích chi tiết 3 agents Y tế/Giáo dục:**

#### App: Trợ lý Nghiên cứu Y sinh (`biomedical-research-assistant`)

- **Medical Disclaimer**: ✅ Có — "NOT a licensed healthcare provider, NOT intended to diagnose..."
- **Plugins tích hợp**: pubmed-search, openalex-search, clinical-trials, drug-interactions, citation-manager, clinical-calc
- **Ngôn ngữ**: Bilingual (Vietnamese + English tự động)
- **Opening Questions**: Tiếng Việt (CRISPR-Cas9, clinical trial Phase II, biomarker, machine learning)
- **Prompt quality**: 9/10 — Có disclaimer, capabilities rõ ràng, citation guidelines, language adaptation

#### App: Chuyên gia Phân tích Y văn (`clinical-literature-reviewer`)

- **Medical Disclaimer**: ✅ Có — "CRITICAL MEDICAL DISCLAIMER" rất rõ ràng
- **Frameworks**: GRADE criteria, PRISMA guidelines, PICO framework, NNT calculation
- **Evidence levels**: I/II/III classification, Grade A/B/C recommendations
- **Prompt quality**: 10/10 — Prompt engineering xuất sắc, structured response format, comprehensive EBM framework

#### App: Trợ lý Giảng viên Y khoa (`medical-educator`)

- **Capabilities**: Lesson plans, MCQ design (Bloom's taxonomy), CBL scenarios, OSCE stations
- **Target audiences**: Pre-clinical → Clinical → Residency → CME
- **MCQ guidelines**: Detailed (4-5 options, no "all of above", explanations for all options)
- **Prompt quality**: 9/10 — Rất chi tiết, có Bloom's taxonomy, có rubric design

---

### 2.5 API Template Agent

#### Agent: Phở Medical Research (`/api/assistants/medical-research`)

| Thuộc tính      | Chi tiết                                                                                            |
| --------------- | --------------------------------------------------------------------------------------------------- |
| **ID**          | `pho-medical-research`                                                                              |
| **Model**       | `google/gemini-2.5-pro`                                                                             |
| **Temperature** | 0.3 (low creativity, high accuracy)                                                                 |
| **Plugins**     | pubmed-search, openalex-search, clinical-trials, drug-interactions, citation-manager, clinical-calc |

**System Prompt highlights:**

- PICO Structure for clinical questions
- GRADE Evidence Quality Assessment (A/B/C/D levels)
- Evidence Summary Format (standardized markdown template)
- IMRAD format for paper summaries
- Vietnamese support with medical terminology mapping
- **Bilingual medical disclaimer** (Vietnamese + English) ✅
- Proactive plugin usage instruction

**Prompt quality**: **10/10** — Đây là prompt chất lượng cao nhất trong toàn bộ codebase. Có:

- Structured frameworks (PICO, GRADE, IMRAD)
- Output format template
- Comparison table guidelines
- Bilingual disclaimer
- Proactive search instructions

---

### 2.6 Built-in Tools

| #   | ID                      | Tên               | Avatar | Mô tả                                                      |
| --- | ----------------------- | ----------------- | ------ | ---------------------------------------------------------- |
| 1   | `lobe-artifacts`        | Artifacts         | 🎨     | Render interactive HTML/CSS/JS content                     |
| 2   | `lobe-slides`           | Slides Creator    | 🎞️     | Create presentations                                       |
| 3   | `lobe-image-designer`   | DALL-E 3          | 🎨     | Generate images (with diversity controls, bias detection)  |
| 4   | `lobe-web-browsing`     | Web Browsing      | 🌐     | Multi-engine search + page crawling                        |
| 5   | `lobe-local-system`     | Local System      | 📁     | File operations (desktop only)                             |
| 6   | `pho-scientific-skills` | Scientific Skills | 🔬     | Python scientific computing (RDKit, Scanpy, PyTorch, etc.) |

---

### 2.7 Agents từ LobeHub Marketplace (Remote)

> **Lưu ý quan trọng**: Remote agents được fetch từ `@lobehub/agents-index` (300+ agents). Đây là agents do cộng đồng LobeHub đóng góp. Phở Chat không kiểm soát nội dung trực tiếp nhưng có thể whitelist/blacklist qua EdgeConfig.

#### Cơ chế lọc hiện có

```typescript
// src/server/modules/AssistantStore/index.ts
// EdgeConfig whitelist/blacklist
if (whitelist?.length > 0) {
  data.agents = data.agents.filter((item) => whitelist.includes(item.identifier));
} else if (blacklist?.length > 0) {
  data.agents = data.agents.filter((item) => !blacklist.includes(item.identifier));
}
```

#### Đánh giá chung Remote Agents

| Tiêu chí               | Đánh giá                                                                      |
| ---------------------- | ----------------------------------------------------------------------------- |
| **Verified authors**   | ❌ Không có cơ chế verify — bất kỳ ai cũng có thể submit agent                |
| **Content review**     | Qua GitHub PR review (lobehub/lobe-chat-agents repo)                          |
| **Prompt quality**     | Biến thiên lớn: từ 2/10 (1 câu ngắn) đến 9/10 (prompt engineering chuyên sâu) |
| **Security risk**      | Thấp-Trung bình — một số agents có external URL references                    |
| **Vietnamese support** | Rất hạn chế — đa số agents chỉ hỗ trợ EN/ZH                                   |

#### Khuyến nghị cho Remote Agents

- **Nên áp dụng WHITELIST mode** — chỉ cho phép agents đã được review thủ công
- **Không nên dùng blacklist mode** — quá nhiều agents, khó kiểm soát hết
- Agents liên quan medical/health CẦN có disclaimer theo AI Law 134/2025 VN

---

## 3. Built-in Translation Features

### 3.1 Inline Message Translation (translateMessage)

**File location**: `src/store/chat/slices/translate/action.ts`

**Cách hoạt động:**

```
User click "Translate" on message
  → chatService.fetchPresetTaskResult(chainLangDetect) // detect source language
  → chatService.fetchPresetTaskResult(chainTranslate)  // translate to target
  → updateMessageTranslate(id, { content, from, to })  // save result
```

**Prompt chains đang dùng:**

1. **Language Detection** (`packages/prompts/src/chains/langDetect.ts`):

```
System: 你是一名精通全世界语言的语言专家，你需要识别用户输入的内容，以国际标准 locale 进行输出
[Few-shot examples: 你好→zh-CN, hello→en-US]
```

2. **Translation** (`packages/prompts/src/chains/translate.ts`):

```
System: 你是一名擅长翻译的助理，你需要将输入的语言翻译为目标语言
User: 请将以下内容 {content}，翻译为 {targetLang}
```

**Đánh giá:**

- Chất lượng prompt: **4/10** — Quá đơn giản, không có domain context, không có formatting instructions, không có few-shot examples cho translation
- Customizable: **Có** — qua `systemAgentSelectors.translation` (model + provider configurable)
- Limitations:
  - Không có glossary support
  - Không có domain detection
  - Không preserve formatting (markdown, code blocks)
  - Prompt bằng tiếng Trung, có thể gây confusion cho non-Chinese models
  - Không có quality control (back-translation, confidence score)

### 3.2 Document Translation Plugin

**File location**: `src/services/document-translation/`

**Pipeline:**

```
Upload .docx → DocxDiagramParser.parse() → DiagramTypeDetector.detect()
  → [Route A: XML extraction] + [Route B: Vision AI OCR for images]
  → TranslationBatcher.translateBatch() (AI-powered)
  → DocxDiagramWriter.apply() → Output .docx (100% layout preserved)
```

**Features:**

- Domain-specific glossaries (Construction: ZH→VI, ZH→EN — \~30 terms mỗi bộ)
- Auto domain detection (construction keywords)
- Vision AI cho embedded images
- Custom glossary upload (CSV/JSON)
- User edit translations trước khi apply

**Đánh giá:**

- Chất lượng: **8/10** — Pipeline hoàn chỉnh, có glossary, có domain detection
- Limitations:
  - Chỉ có built-in glossary cho construction domain
  - Thiếu glossary cho medical, legal, academic domains
  - Chưa có memory/TM (Translation Memory) giữa các jobs

### 3.3 Tất cả System Prompt Chains

| #   | Chain                         | File                                                    | Chức năng                   | Ngôn ngữ prompt |
| --- | ----------------------------- | ------------------------------------------------------- | --------------------------- | --------------- |
| 1   | `chainTranslate`              | `packages/prompts/src/chains/translate.ts`              | Dịch tin nhắn               | ZH              |
| 2   | `chainLangDetect`             | `packages/prompts/src/chains/langDetect.ts`             | Nhận diện ngôn ngữ          | ZH              |
| 3   | `chainSummaryTitle`           | `packages/prompts/src/chains/summaryTitle.ts`           | Tóm tắt tiêu đề topic       | ZH              |
| 4   | `chainSummaryHistory`         | `packages/prompts/src/chains/summaryHistory.ts`         | Nén lịch sử chat            | EN              |
| 5   | `chainSummaryAgentName`       | `packages/prompts/src/chains/summaryAgentName.ts`       | Đặt tên agent từ systemRole | ZH + few-shot   |
| 6   | `chainSummaryDescription`     | `packages/prompts/src/chains/summaryDescription.ts`     | Tóm tắt mô tả agent         | ZH + few-shot   |
| 7   | `chainSummaryTags`            | `packages/prompts/src/chains/summaryTags.ts`            | Trích xuất tags             | ZH + few-shot   |
| 8   | `chainSummaryGenerationTitle` | `packages/prompts/src/chains/summaryGenerationTitle.ts` | Tiêu đề cho AI art          | ZH              |
| 9   | `chainPickEmoji`              | `packages/prompts/src/chains/pickEmoji.ts`              | Chọn emoji avatar           | ZH + few-shot   |
| 10  | `chainRewriteQuery`           | `packages/prompts/src/chains/rewriteQuery.ts`           | Rewrite query cho RAG       | EN              |
| 11  | `chainAbstractChunkText`      | `packages/prompts/src/chains/abstractChunk.ts`          | Tóm tắt chunk               | ZH              |
| 12  | `chainAnswerWithContext`      | `packages/prompts/src/chains/answerWithContext.ts`      | RAG answer                  | EN              |
| 13  | `knowledgeBaseQAPrompts`      | `packages/prompts/src/prompts/knowledgeBaseQA/index.ts` | Knowledge base QA           | EN              |

**Nhận xét chung:**

- 8/13 chains dùng tiếng Trung làm system prompt — thừa hưởng từ LobeChat gốc
- Các chain few-shot (summaryAgentName, summaryDescription, summaryTags, pickEmoji) chất lượng cao, có multi-locale examples
- RAG chains (rewriteQuery, answerWithContext, knowledgeBaseQA) dùng tiếng Anh, chất lượng ổn

---

## 4. Plugin & Skill Ecosystem

### 4.1 Plugins tự phát triển (Phở Chat)

#### 4.1.1 PubMed Search

| Thuộc tính     | Chi tiết                                                            |
| -------------- | ------------------------------------------------------------------- |
| **Identifier** | `pubmed-search`                                                     |
| **API**        | PubMed E-utilities (NCBI) — Free, no auth                           |
| **Tools**      | `searchPubMed` (query, maxResults, page, sortBy)                    |
| **Output**     | Pre-formatted markdown (formattedResults)                           |
| **Đánh giá**   | ⭐⭐⭐⭐ — Production-ready, có pagination, có pre-formatted output |

#### 4.1.2 Clinical Calculator

| Thuộc tính     | Chi tiết                                                                              |
| -------------- | ------------------------------------------------------------------------------------- |
| **Identifier** | `clinical-calculator`                                                                 |
| **API**        | Self-contained (no external API)                                                      |
| **Tools**      | `calculate` (9 formulas: BMI, eGFR, MELD, CrCl, CHA₂DS₂-VASc, etc.), `getFormulaInfo` |
| **Đánh giá**   | ⭐⭐⭐⭐⭐ — Excellent, validated formulas, có references                             |

#### 4.1.3 ArXiv Search

| Thuộc tính     | Chi tiết                                                             |
| -------------- | -------------------------------------------------------------------- |
| **Identifier** | `arxiv`                                                              |
| **API**        | arXiv API — Free, no auth                                            |
| **Tools**      | `searchArxiv` (query, category, maxResults, sortBy), `getArxivPaper` |
| **Đánh giá**   | ⭐⭐⭐⭐ — Solid, có category filter, có paper detail                |

#### 4.1.4 Drug Interactions

| Thuộc tính     | Chi tiết                                                      |
| -------------- | ------------------------------------------------------------- |
| **Identifier** | `drug-interactions`                                           |
| **API**        | FDA openFDA API — Free, no auth                               |
| **Tools**      | `searchDrug`, `checkInteraction`, `getAdverseEvents`          |
| **Đánh giá**   | ⭐⭐⭐⭐⭐ — Comprehensive, 3 tools, có adverse event reports |

#### 4.1.5 Semantic Scholar

| Thuộc tính     | Chi tiết                                                         |
| -------------- | ---------------------------------------------------------------- |
| **Identifier** | `semantic-scholar`                                               |
| **API**        | Semantic Scholar Academic Graph API — Free                       |
| **Tools**      | `searchSemanticScholar` (query, fieldsOfStudy, year, maxResults) |
| **Đánh giá**   | ⭐⭐⭐⭐ — Good, có citation counts, field of study filter       |

#### 4.1.6 DOI Resolver

| Thuộc tính     | Chi tiết                                         |
| -------------- | ------------------------------------------------ |
| **Identifier** | `doi-resolver`                                   |
| **API**        | CrossRef API — Free                              |
| **Tools**      | `resolveDOI` (doi, format: ieee/apa/vancouver)   |
| **Đánh giá**   | ⭐⭐⭐⭐ — Focused, multi-format citation output |

#### 4.1.7 Citation Manager

| Thuộc tính     | Chi tiết                                                                        |
| -------------- | ------------------------------------------------------------------------------- |
| **Identifier** | `citation-manager`                                                              |
| **API**        | PubMed + CrossRef + ArXiv                                                       |
| **Tools**      | `getCitation` (PMID/DOI/ArXiv → APA/BibTeX/Vancouver/RIS), `exportBibliography` |
| **Đánh giá**   | ⭐⭐⭐⭐⭐ — Excellent, multi-source, multi-format, batch export                |

#### 4.1.8 Clinical Trials Search

| Thuộc tính     | Chi tiết                                                          |
| -------------- | ----------------------------------------------------------------- |
| **Identifier** | `clinical-trials`                                                 |
| **API**        | ClinicalTrials.gov v2 — Free, no auth                             |
| **Tools**      | `searchTrials` (condition, intervention, location, phase, status) |
| **Đánh giá**   | ⭐⭐⭐⭐ — Good, có location filter (VN support), phase filter    |

#### 4.1.9 OpenAlex Academic Search

| Thuộc tính     | Chi tiết                                                          |
| -------------- | ----------------------------------------------------------------- |
| **Identifier** | `openalex-search`                                                 |
| **API**        | OpenAlex API — Free                                               |
| **Tools**      | `searchWorks` (query, sortBy, maxResults, page)                   |
| **Đánh giá**   | ⭐⭐⭐⭐ — 250M+ works, có open access PDF links, citation counts |

#### 4.1.10 Document Translation

| Thuộc tính     | Chi tiết                                                                     |
| -------------- | ---------------------------------------------------------------------------- |
| **Identifier** | `document-translation`                                                       |
| **API**        | Self-hosted (JSZip + AI model)                                               |
| **Tools**      | `extractDocumentText`, `translateDocumentText`, `applyDocumentTranslation`   |
| **Đánh giá**   | ⭐⭐⭐⭐ — Innovative 3-step pipeline, glossary support, layout preservation |

### 4.2 Plugin Marketplace (Remote)

- **Source**: `@lobehub/plugins-index` npm package
- **URL**: `https://registry.npmmirror.com/@lobehub/plugins-index/v1/files/public`
- **Custom URL**: Có thể override qua env `PLUGINS_INDEX_URL`
- **Nội dung**: \~50+ community plugins (search, web crawling, weather, etc.)

### 4.3 Tổng hợp External API Integrations

| API                   | Plugin                         | Auth | Rate Limit                        | Free |
| --------------------- | ------------------------------ | ---- | --------------------------------- | ---- |
| PubMed E-utilities    | pubmed-search                  | None | 3/sec (no key), 10/sec (with key) | ✅   |
| arXiv API             | arxiv                          | None | Moderate                          | ✅   |
| Semantic Scholar      | semantic-scholar               | None | 100/5min                          | ✅   |
| OpenAlex              | openalex-search                | None | Generous                          | ✅   |
| CrossRef              | doi-resolver, citation-manager | None | Generous                          | ✅   |
| FDA openFDA           | drug-interactions              | None | 240/min                           | ✅   |
| ClinicalTrials.gov v2 | clinical-trials                | None | Generous                          | ✅   |

**Tất cả plugins đều sử dụng Free APIs — không cần API key** ✅

---

## 5. Đánh giá Nguồn gốc & Uy tín

### 5.1 Ma trận uy tín

| Agent/Plugin                  | Tác giả             | Verified | Chất lượng           | Last Updated | Risk Level                |
| ----------------------------- | ------------------- | -------- | -------------------- | ------------ | ------------------------- |
| Phở Assistant (default)       | Phở Chat            | ✅       | ⭐⭐⭐⭐             | 2026-03      | Low                       |
| 8x Scientific Agents          | Phở Chat            | ✅       | ⭐⭐⭐⭐⭐           | 2025-01      | Low                       |
| Biomedical Research App       | Phở Chat            | ✅       | ⭐⭐⭐⭐⭐           | 2026-02      | Low                       |
| Clinical Literature Reviewer  | Phở Chat            | ✅       | ⭐⭐⭐⭐⭐           | 2026-02      | Low                       |
| Medical Educator App          | Phở Chat            | ✅       | ⭐⭐⭐⭐⭐           | 2026-02      | Low                       |
| Medical Research API Template | Phở Chat            | ✅       | ⭐⭐⭐⭐⭐           | 2026-02      | Low                       |
| Interactive UI Prompts        | Phở Chat            | ✅       | ⭐⭐⭐⭐⭐           | 2026-03      | Low                       |
| Generative Diagram Prompts    | Phở Chat            | ✅       | ⭐⭐⭐⭐⭐           | 2026-03      | Low                       |
| 10x Plugins (PubMed, etc.)    | Phở Chat            | ✅       | ⭐⭐⭐⭐\~⭐⭐⭐⭐⭐ | 2026-02\~03  | Low                       |
| Remote Marketplace Agents     | LobeHub Community   | ❌ Mixed | ⭐⭐\~⭐⭐⭐⭐       | Varies       | Medium                    |
| Translation Chain Prompts     | LobeHub (inherited) | ✅       | ⭐⭐                 | Legacy       | Low (but quality concern) |

### 5.2 Tiêu chí đánh giá uy tín đã dùng

1. **Tác giả xác minh**: Phở Chat plugins = verified (internal team). LobeHub community = mixed.
2. **Code review**: Tất cả Phở Chat plugins đều có source code trong repo, reviewable.
3. **External APIs**: Tất cả đều dùng public, free APIs từ tổ chức uy tín (NIH, FDA, arXiv, Semantic Scholar).
4. **No API key exposure**: Không plugin nào yêu cầu user cung cấp API key.
5. **No external URL injection**: Không phát hiện prompt injection patterns trong local agents.

### 5.3 Agents/Components KHÔNG nên dùng (Red flags)

| Component                              | Vấn đề                                                            | Khuyến nghị            |
| -------------------------------------- | ----------------------------------------------------------------- | ---------------------- |
| Remote marketplace agents (unfiltered) | Chưa review, có thể chứa low-quality prompts hoặc harmful content | Áp dụng whitelist mode |
| `chainTranslate` prompt                | Quá đơn giản (1 câu), prompt bằng ZH, không có quality control    | Cần rewrite            |
| `chainSummaryTitle` prompt             | Prompt bằng ZH, có thể gây issue với non-Chinese models           | Cần localize           |

---

## 6. Khuyến nghị hành động

### 6.1 Components đang hoạt động tốt — Giữ nguyên

1. **10 Phở Chat plugins** — Tất cả production-ready, free APIs, không cần auth
2. **8 Scientific Agents** — Prompt engineering xuất sắc (XML structured, workflow-driven)
3. **3 Medical Bundled Apps** — Biomedical Research, Clinical Literature Reviewer, Medical Educator — tất cả có medical disclaimers, bilingual support
4. **Medical Research API Template** — Prompt chất lượng cao nhất (PICO, GRADE, IMRAD frameworks)
5. **Interactive UI + Generative Diagram prompts** — Chất lượng cao, có vertical variants
6. **Few-shot chain prompts** (pickEmoji, summaryAgentName, summaryDescription, summaryTags) — Pattern tốt, multi-locale

### 6.2 Components cần cải thiện

#### 6.2.1 Translation Chain (Ưu tiên CAO)

**Hiện tại:**

```
System: 你是一名擅长翻译的助理，你需要将输入的语言翻译为目标语言
User: 请将以下内容 {content}，翻译为 {targetLang}
```

**Khuyến nghị rewrite:**

```
System: You are a professional translator. Translate the following content accurately while:
- Preserving the original formatting (markdown, code blocks, lists)
- Maintaining technical terminology
- Keeping proper nouns unchanged
- Using natural, fluent {targetLang} expression
- If the content contains specialized terms, translate them with the original term in parentheses

User: Translate to {targetLang}:
{content}
```

#### 6.2.2 Language Detection Chain

**Hiện tại:** Chỉ có 2 few-shot examples (zh-CN, en-US)

**Khuyến nghị:** Thêm examples cho vi-VN, ja-JP, ko-KR — các ngôn ngữ phổ biến trong target market

#### 6.2.3 Remote Agent Marketplace

**Khuyến nghị:**

- Triển khai EdgeConfig whitelist với danh sách agents đã review
- Tạo internal review checklist cho remote agents
- Ưu tiên whitelist agents thuộc categories: translation, academic, education, medical

### 6.3 Gaps cần build agent/feature mới

| Gap                                   | Mô tả                                                                                          | Ưu tiên |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- | ------- |
| **Translation Agent cho văn bản dài** | Book-length translation với chapter splitting, glossary persistence, TM                        | HIGH    |
| **Medical Glossary**                  | Glossary ZH→VI, EN→VI cho y tế (thuốc, bệnh, thủ thuật)                                        | HIGH    |
| **Legal Glossary**                    | Glossary cho hợp đồng, luật                                                                    | MEDIUM  |
| **Academic Writing Assistant**        | Agent chuyên viết paper cho non-scientific users (đã có pho-scientific-writer cho researchers) | MEDIUM  |
| **Vietnamese Language Agent**         | Agent chuyên ngữ pháp, chính tả tiếng Việt                                                     | MEDIUM  |
| **Medical Disclaimer Agent**          | Auto-inject disclaimer cho medical content (AI Law 134/2025)                                   | HIGH    |
| **Translation Memory (TM)**           | Lưu translations giữa các sessions để reuse                                                    | MEDIUM  |
| **Quality Assurance Agent**           | Back-translation + quality scoring cho translations                                            | LOW     |

### 6.4 Components tái sử dụng (Best Patterns)

#### Pattern 1: Pre-formatted Output (PubMed, Semantic Scholar)

```
"IMPORTANT: The response includes a 'formattedResults' field containing
a pre-formatted markdown summary. You MUST use the formattedResults text
directly in your response to the user."
```

→ Giảm hallucination, đảm bảo output format nhất quán

#### Pattern 2: Multi-step Pipeline (Document Translation)

```
extract → translate (with glossary) → apply
```

→ Tái sử dụng cho bất kỳ document processing pipeline nào

#### Pattern 3: Few-shot Chain với Multi-locale (summaryAgentName, pickEmoji)

```
[ZH example] → [RU example] → [EN example] → [User input + target locale]
```

→ Pattern tốt cho bất kỳ locale-aware generation nào

#### Pattern 4: Vertical Prompt Extension (Interactive UI)

```
const medicalVerticalPrompt = `${basePrompt}\n\nMEDICAL SPECIFIC:\n- ...`
```

→ Composable prompts, dễ thêm vertical mới

#### Pattern 5: Domain Auto-detection (GlossaryManager)

```
const constructionKeywords = ['混凝土', '钢筋', 'concrete', 'rebar', 'bê tông', 'cốt thép'];
if (matches.length >= 2) return 'construction';
```

→ Mở rộng cho medical, legal, academic domains

---

## 7. Phụ lục

### 7.1 Danh sách đầy đủ tất cả components

**A. Agents & Apps (16 local)**

| #   | ID                              | Tên                         | Category                | Author   | Đánh giá   |
| --- | ------------------------------- | --------------------------- | ----------------------- | -------- | ---------- |
| 1   | `inbox` (default)               | Phở Assistant               | General + Viz           | Phở Chat | ⭐⭐⭐⭐   |
| 2   | `pho-drug-discovery`            | Drug Discovery Assistant    | Scientific              | Phở Chat | ⭐⭐⭐⭐⭐ |
| 3   | `pho-bioinformatics`            | Bioinformatics Researcher   | Scientific              | Phở Chat | ⭐⭐⭐⭐⭐ |
| 4   | `pho-clinical-research`         | Clinical Research Assistant | Scientific              | Phở Chat | ⭐⭐⭐⭐⭐ |
| 5   | `pho-data-science`              | Data Science & ML Assistant | Scientific              | Phở Chat | ⭐⭐⭐⭐   |
| 6   | `pho-scientific-writer`         | Scientific Writer           | Scientific              | Phở Chat | ⭐⭐⭐⭐⭐ |
| 7   | `pho-protein-engineering`       | Protein Engineer            | Scientific              | Phở Chat | ⭐⭐⭐⭐   |
| 8   | `pho-materials-science`         | Materials Scientist         | Scientific              | Phở Chat | ⭐⭐⭐⭐   |
| 9   | `pho-lab-automation`            | Lab Automation Specialist   | Scientific              | Phở Chat | ⭐⭐⭐⭐   |
| 10  | `artifact-creator`              | Artifact Creator            | Bundled App             | Phở Chat | ⭐⭐⭐     |
| 11  | `code-reviewer`                 | Code Reviewer               | Bundled App             | Phở Chat | ⭐⭐⭐     |
| 12  | `content-writer`                | Content Writer              | Bundled App             | Phở Chat | ⭐⭐⭐     |
| 13  | `biomedical-research-assistant` | Trợ lý Nghiên cứu Y sinh    | Bundled App - Medical   | Phở Chat | ⭐⭐⭐⭐⭐ |
| 14  | `clinical-literature-reviewer`  | Chuyên gia Phân tích Y văn  | Bundled App - Medical   | Phở Chat | ⭐⭐⭐⭐⭐ |
| 15  | `medical-educator`              | Trợ lý Giảng viên Y khoa    | Bundled App - Education | Phở Chat | ⭐⭐⭐⭐⭐ |
| 16  | `pho-medical-research`          | Phở Medical Research        | API Template            | Phở Chat | ⭐⭐⭐⭐⭐ |

**B. Built-in Tools (6)**

| #   | ID                      | Tên               | Mô tả                                           |
| --- | ----------------------- | ----------------- | ----------------------------------------------- |
| 17  | `lobe-artifacts`        | Artifacts         | Interactive HTML/CSS/JS rendering               |
| 18  | `lobe-slides`           | Slides Creator    | Presentation generation                         |
| 19  | `lobe-image-designer`   | DALL-E 3          | Image generation with diversity controls        |
| 20  | `lobe-web-browsing`     | Web Browsing      | Multi-engine search + crawling                  |
| 21  | `lobe-local-system`     | Local System      | File operations (desktop only)                  |
| 22  | `pho-scientific-skills` | Scientific Skills | Python execution (RDKit, Scanpy, PyTorch, etc.) |

**C. Plugins (10)**

| #   | ID                     | Tên                  | Category    | Đánh giá   |
| --- | ---------------------- | -------------------- | ----------- | ---------- |
| 23  | `pubmed-search`        | PubMed Search        | Medical     | ⭐⭐⭐⭐   |
| 24  | `clinical-calculator`  | Clinical Calculator  | Medical     | ⭐⭐⭐⭐⭐ |
| 25  | `arxiv`                | ArXiv Search         | Academic    | ⭐⭐⭐⭐   |
| 26  | `drug-interactions`    | Drug Interactions    | Medical     | ⭐⭐⭐⭐⭐ |
| 27  | `semantic-scholar`     | Semantic Scholar     | Academic    | ⭐⭐⭐⭐   |
| 28  | `doi-resolver`         | DOI Resolver         | Academic    | ⭐⭐⭐⭐   |
| 29  | `citation-manager`     | Citation Manager     | Academic    | ⭐⭐⭐⭐⭐ |
| 30  | `clinical-trials`      | Clinical Trials      | Medical     | ⭐⭐⭐⭐   |
| 31  | `openalex-search`      | OpenAlex Search      | Academic    | ⭐⭐⭐⭐   |
| 32  | `document-translation` | Document Translation | Translation | ⭐⭐⭐⭐   |

**D. System Prompt Chains (13)**

| #   | Chain                       | Chức năng          | Đánh giá |
| --- | --------------------------- | ------------------ | -------- |
| 33  | chainTranslate              | Dịch tin nhắn      | ⭐⭐     |
| 34  | chainLangDetect             | Nhận diện ngôn ngữ | ⭐⭐⭐   |
| 35  | chainSummaryTitle           | Tóm tắt tiêu đề    | ⭐⭐⭐   |
| 36  | chainSummaryHistory         | Nén lịch sử        | ⭐⭐⭐   |
| 37  | chainSummaryAgentName       | Đặt tên agent      | ⭐⭐⭐⭐ |
| 38  | chainSummaryDescription     | Mô tả agent        | ⭐⭐⭐⭐ |
| 39  | chainSummaryTags            | Trích tags         | ⭐⭐⭐⭐ |
| 40  | chainSummaryGenerationTitle | Tiêu đề AI art     | ⭐⭐⭐   |
| 41  | chainPickEmoji              | Chọn emoji         | ⭐⭐⭐⭐ |
| 42  | chainRewriteQuery           | RAG query rewrite  | ⭐⭐⭐   |
| 43  | chainAbstractChunkText      | Tóm tắt chunk      | ⭐⭐⭐   |
| 44  | chainAnswerWithContext      | RAG answer         | ⭐⭐⭐   |
| 45  | knowledgeBaseQAPrompts      | Knowledge base QA  | ⭐⭐⭐   |

**E. Prompt Templates (5 files, 8 variants)**

| #   | Prompt                           | Đánh giá   |
| --- | -------------------------------- | ---------- |
| 46  | Interactive UI Base              | ⭐⭐⭐⭐⭐ |
| 47  | Interactive UI - Real Estate     | ⭐⭐⭐⭐   |
| 48  | Interactive UI - Education       | ⭐⭐⭐⭐   |
| 49  | Interactive UI - Medical         | ⭐⭐⭐⭐   |
| 50  | Generative Diagram Base          | ⭐⭐⭐⭐⭐ |
| 51  | Generative Diagram - Education   | ⭐⭐⭐⭐   |
| 52  | Generative Diagram - Real Estate | ⭐⭐⭐⭐   |

**F. Remote Marketplace**

| #   | Source                          | Đánh giá                    |
| --- | ------------------------------- | --------------------------- |
| 53  | \~300+ LobeHub Community Agents | ⭐⭐\~⭐⭐⭐⭐ (unverified) |
| 54  | \~50+ LobeHub Community Plugins | ⭐⭐\~⭐⭐⭐⭐ (unverified) |

### 7.2 File paths đã quét

```
# Agents & Apps
src/store/agent/slices/chat/initialState.ts          — Default Phở Assistant prompt
src/scientific-skills/agents/index.ts                 — 8 Scientific Agents definitions
scripts/seedBundledApps/index.ts                      — 6 Bundled Apps definitions
src/app/api/assistants/medical-research/route.ts      — Medical Research API template

# Built-in Tools
src/tools/artifacts/index.ts                          — Artifacts tool
src/tools/slides/index.ts                             — Slides tool
src/tools/dalle/index.ts                              — DALL-E 3 tool
src/tools/web-browsing/index.ts                       — Web browsing tool
src/tools/local-system/index.ts                       — Local system tool (desktop)
src/tools/scientific-skills/index.ts                  — Scientific Skills tool

# System Prompts
src/prompts/interactive-ui-base.ts                    — Interactive UI prompts (4 variants)
src/prompts/generative-diagram.ts                     — Generative diagram prompts (3 variants)

# Translation
src/store/chat/slices/translate/action.ts             — translateMessage flow
src/services/document-translation/                    — Document translation service (8 files)
src/services/document-translation/GlossaryManager.ts  — Domain glossaries
packages/prompts/src/chains/translate.ts              — Translation chain prompt
packages/prompts/src/chains/langDetect.ts             — Language detection chain

# Plugin System
src/config/bundledPlugins.ts                          — 7 bundled plugin definitions
src/app/api/plugins/*/manifest/route.ts               — 10 plugin manifests
src/store/tool/slices/                                — Plugin store management

# Agent Loading
src/server/modules/AssistantStore/index.ts            — Remote agent index fetching
src/server/services/discover/index.ts                 — Discover service (merges local + remote)
src/envs/app.ts                                       — AGENTS_INDEX_URL, PLUGINS_INDEX_URL

# System Agent Config
src/store/user/slices/settings/selectors/systemAgent.ts — System agent config selectors
packages/const/src/settings/systemAgent.ts            — Default system agent config
packages/prompts/src/chains/*.ts                      — All 13 prompt chains
packages/prompts/src/prompts/knowledgeBaseQA/         — Knowledge base QA prompt
```

### 7.3 Methodology

1. **Automated Search**: Grep cho `systemRole`, `agent`, `translate`, `plugin`, `manifest` across toàn bộ codebase
2. **Architecture Analysis**: Trace data flow từ agent definition → store → LLM call
3. **Prompt Quality Scoring**: Đánh giá dựa trên tiêu chí: clarity, specificity, few-shot examples, output format, constraints, error handling
4. **Security Review**: Kiểm tra prompt injection vectors, external URL references, API key exposure
5. **Vertical Alignment**: Đánh giá phù hợp với 3 vertical: Y tế, Học thuật, Giáo dục
6. **Legal Compliance**: Kiểm tra disclaimers, AI Law 134/2025 VN requirements cho medical content

---

_Báo cáo này được tạo tự động bởi Claude Code CLI. Vui lòng reviok ew thủ công trước khi thực hiện khuyến nghị._
