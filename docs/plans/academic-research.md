# 🔬 Academic Research Module — Implementation Plan

> **Created**: 2026-02-07 | **Status**: 🟡 Planning\
> **Prerequisite Audit**: [walkthrough.md](file:///C:/Users/HLC_2021/.gemini/antigravity/brain/38ae3c9a-d6d7-4d4f-9847-5a19fb3a6a26/walkthrough.md) — Gap Analysis đã hoàn thành

---

## Mục tiêu

Triển khai module Academic Research cho Phở Chat, tận dụng **\~70%** codebase hiện có. Module cho phép nghiên cứu sinh và nhà nghiên cứu:

- Tìm kiếm bài báo từ ArXiv, PubMed, Semantic Scholar
- Upload & đọc PDF nghiên cứu dài (100+ trang)
- Xem trích dẫn nguồn (footnote) trực tiếp trong chat
- Render công thức toán học/hóa học

> \[!NOTE]
> **Citation Format**: Sử dụng **IEEE** làm định dạng trích dẫn mặc định cho in-text (\[1]) và bibliography, vì nó phù hợp nhất với cộng đồng kỹ thuật/Khoa học máy tính (ArXiv).

## User Review Required

> \[!IMPORTANT]
> **Quyết định thiết kế quan trọng**: Plan này chia thành **4 Phase**, mỗi phase có thể deploy độc lập. Phase 1 và 2 là **core**, Phase 3 và 4 là **enhancement**. Xin xác nhận thứ tự ưu tiên.

> \[!WARNING]\
> **Phase 2 (Semantic Scholar Plugin)** sử dụng [Semantic Scholar API](https://api.semanticscholar.org/) — API miễn phí nhưng giới hạn 100 requests/5 phút. Cần cân nhắc có nên thêm API key management hay không.

---

## Proposed Changes

### Phase 1: Semantic Scholar Plugin & DOI Resolver (3 ngày)

Thêm plugin mới theo **đúng pattern** có sẵn của ArXiv/PubMed.

---

#### \[NEW] [route.ts](file:///e:/Projex25/X-Chat/lobe-chat/src/app/api/plugins/semantic-scholar/search/route.ts)

**Semantic Scholar Search API route** — Clone pattern từ [arxiv/search/route.ts](file:///e:/Projex25/X-Chat/lobe-chat/src/app/api/plugins/arxiv/search/route.ts)

- Sử dụng Semantic Scholar API: `https://api.semanticscholar.org/graph/v1/paper/search`
- Interface `SemanticScholarPaper`: `paperId`, `title`, `abstract`, `authors`, `year`, `citationCount`, `referenceCount`, `doi`, `url`, `venue`, `fieldsOfStudy`
- `POST` handler: nhận `{ query, maxResults, year, fieldsOfStudy }`, gọi API, trả về JSON
- `GET` handler: support testing query string
- Rate limiting: respect 100 req/5min → thêm simple in-memory throttle

#### \[NEW] [route.ts](file:///e:/Projex25/X-Chat/lobe-chat/src/app/api/plugins/semantic-scholar/manifest/route.ts)

**Plugin manifest** — Clone pattern từ [arxiv/manifest/route.ts](file:///e:/Projex25/X-Chat/lobe-chat/src/app/api/plugins/arxiv/manifest/route.ts)

- Manifest với function `searchSemanticScholar`
- Parameters: `query` (required), `maxResults`, `year`, `fieldsOfStudy`
- Meta: avatar `🎓`, title `Semantic Scholar`, tags `['research', 'academic', 'citation', 'papers']`

#### \[NEW] [route.ts](file:///e:/Projex25/X-Chat/lobe-chat/src/app/api/plugins/doi-resolver/resolve/route.ts)

**DOI Resolver API route**

- Sử dụng CrossRef API: `https://api.crossref.org/works/{doi}`
- Interface `ResolvedCitation`: `doi`, `title`, `authors[]`, `journal`, `year`, `volume`, `issue`, `pages`, `publisher`, `url`, `abstract`
- `POST` handler: nhận `{ doi }` hoặc `{ dois: string[] }` (batch), trả về citation metadata
- Format output support: `apa`, `ieee`, `vancouver` → trả thêm `formattedCitation` string

#### \[NEW] [route.ts](file:///e:/Projex25/X-Chat/lobe-chat/src/app/api/plugins/doi-resolver/manifest/route.ts)

**DOI Resolver manifest**

- Function `resolveDOI`: nhận DOI, trả citation metadata + formatted string
- Meta: avatar `🔗`, title `DOI Resolver`

#### \[MODIFY] [bundledPlugins.ts](file:///e:/Projex25/X-Chat/lobe-chat/src/config/bundledPlugins.ts)

Thêm 2 plugin mới vào `BUNDLED_PLUGINS` array (theo đúng interface `BundledPlugin`):

```diff
+  {
+    author: 'Phở Chat',
+    avatar: '🎓',
+    category: PluginCategory.ScienceEducation,
+    createdAt: '2026-02-07',
+    description: 'Search Semantic Scholar for academic papers with citation counts and metadata',
+    homepage: 'https://pho.chat/plugins/semantic-scholar',
+    identifier: 'semantic-scholar',
+    manifest: getManifestUrl('semantic-scholar'),
+    schemaVersion: 1,
+    tags: ['research', 'academic', 'citation', 'papers', 'scholar'],
+    title: 'Semantic Scholar',
+  },
+  {
+    author: 'Phở Chat',
+    avatar: '🔗',
+    category: PluginCategory.ScienceEducation,
+    createdAt: '2026-02-07',
+    description: 'Resolve DOI to full citation metadata and formatted references (APA, IEEE)',
+    homepage: 'https://pho.chat/plugins/doi-resolver',
+    identifier: 'doi-resolver',
+    manifest: getManifestUrl('doi-resolver'),
+    schemaVersion: 1,
+    tags: ['doi', 'citation', 'reference', 'crossref', 'academic'],
+    title: 'DOI Resolver',
+  },
```

#### \[MODIFY] [professions.ts](file:///e:/Projex25/X-Chat/lobe-chat/src/features/Onboarding/professions.ts)

Thêm profession mới + cập nhật `suggestedPlugins`:

```diff
+  {
+    id: 'graduate_researcher',
+    icon: '🎓',
+    label: { en: 'Graduate Student / PhD', vi: 'Nghiên cứu sinh / Tiến sĩ' },
+    color: '#7c3aed',
+    suggestedAgents: ['biomedical-research-assistant'],
+    suggestedPlugins: ['arxiv', 'semantic-scholar', 'doi-resolver'],
+    suggestedModels: ['o3-deep-research', 'claude-3-5-sonnet'],
+    suggestedFeatures: ['deep-research', 'web-search', 'artifacts'],
+  },
```

Update `biomedical_researcher` + `researcher_general` to include `'semantic-scholar', 'doi-resolver'` in `suggestedPlugins`.

#### \[MODIFY] [RecommendationModal.tsx](file:///e:/Projex25/X-Chat/lobe-chat/src/features/Onboarding/RecommendationModal.tsx)

Thêm display names cho plugins mới:

```diff
+  'semantic-scholar': { en: 'Semantic Scholar', vi: 'Semantic Scholar' },
+  'doi-resolver': { en: 'DOI Resolver', vi: 'Phân giải DOI' },
```

---

### Phase 2: Enhanced ArXiv Plugin — PDF Download & Abstract Fetch (1 ngày)

Nâng cấp ArXiv plugin hiện tại.

---

#### \[MODIFY] [route.ts](file:///e:/Projex25/X-Chat/lobe-chat/src/app/api/plugins/arxiv/search/route.ts)

Nâng cấp ArXiv search:

- Thêm function `getArxivPaperById`: nhận `arxivId`, fetch chi tiết single paper
- Thêm vào manifest: function `getArxivPaper` (lookup by ID)
- Mở rộng `abstract` limit từ 500 → 1000 chars
- Thêm field `doi` nếu có trong XML response

#### \[MODIFY] [route.ts](file:///e:/Projex25/X-Chat/lobe-chat/src/app/api/plugins/arxiv/manifest/route.ts)

Thêm function `getArxivPaper` vào manifest API array.

---

### Phase 3: Citation UI — Footnote & Bibliography (3 ngày)

Mở rộng `SearchGrounding` component và thêm academic citation context.

---

#### \[MODIFY] [search.ts](file:///e:/Projex25/X-Chat/lobe-chat/packages/types/src/search.ts)

Mở rộng `CitationItem` interface:

```diff
 export interface CitationItem {
   favicon?: string;
   id?: string;
   title?: string;
   url: string;
+  // Academic citation fields (optional, backward-compatible)
+  doi?: string;
+  authors?: string[];
+  year?: number;
+  journal?: string;
+  citationType?: 'web' | 'academic';
 }
```

> \[!NOTE]
> Thêm optional fields đảm bảo backward-compatible — mọi code hiện tại vẫn hoạt động bình thường.

#### \[NEW] [AcademicCitationCard.tsx](file:///e:/Projex25/X-Chat/lobe-chat/src/features/Conversation/Messages/Assistant/AcademicCitationCard.tsx)

Component hiển thị citation card cho academic papers:

- Props: `CitationItem` (with academic fields)
- Layout: Title (bold) + Authors (gray, truncated) + Journal + Year + DOI link
- Action buttons: "Copy Citation", "View PDF" (nếu có url PDF)
- Style: Sử dụng `antd-style` createStyles, giữ consistent với `SearchGrounding`

#### \[MODIFY] [SearchGrounding.tsx](file:///e:/Projex25/X-Chat/lobe-chat/src/features/Conversation/Messages/Assistant/SearchGrounding.tsx)

Mở rộng để detect & render academic citations:

```typescript
// Phân loại citations
const academicCitations = citations?.filter((c) => c.citationType === 'academic');
const webCitations = citations?.filter((c) => c.citationType !== 'academic');

// Render academic citations với AcademicCitationCard
// Render web citations với SearchResultCards (existing)
```

- Thay đổi title: nếu có academic citations → "📚 Sources ({count})" thay vì "🌐 Sources"
- Giữ nguyên expand/collapse animation

#### \[NEW] [BibliographySection.tsx](file:///e:/Projex25/X-Chat/lobe-chat/src/features/Conversation/Messages/Assistant/BibliographySection.tsx)

Component danh sách tham khảo cuối message:

- Props: `citations: CitationItem[]`
- Render danh sách đánh số: `[1] Author et al. (Year). Title. Journal. DOI: xxx`
- Toggle format: APA / IEEE
- Copy all button
- Chỉ hiện khi có `citationType === 'academic'`

#### \[MODIFY] [index.tsx](file:///e:/Projex25/X-Chat/lobe-chat/src/features/Conversation/Messages/Assistant/index.tsx)

Thêm `BibliographySection` vào Assistant message render:

```diff
 {showSearch && (
   <SearchGrounding citations={search?.citations} searchQueries={search?.searchQueries} />
 )}
+{showAcademicBibliography && (
+  <BibliographySection citations={search?.citations} />
+)}
```

---

### Phase 4: Research Onboarding & Polish (1 ngày)

---

#### \[MODIFY] [changelog.ts](file:///e:/Projex25/X-Chat/lobe-chat/src/const/changelog.ts)

Thêm changelog entry `v1.133.0` theo pattern hiện có:

```typescript
{
  date: '2026-02-XX',
  id: 'v1.133.0',
  image: '/images/changelog/academic-research.png',
  versionRange: ['1.133.0'],
}
```

Plus content entry với `title`, `content`, `titleVi`, `contentVi`.

#### \[NEW] Blog Post

Tạo `src/app/blog/academic-research-module/page.tsx` — Blog giới thiệu tính năng Academic Research (EN + VI).

---

## Verification Plan

### Automated Tests

#### 1. Semantic Scholar Plugin API Test

```bash
# Chạy vitest cho file test mới
npx vitest run src/app/api/plugins/semantic-scholar --reporter=verbose
```

File test mới: `src/app/api/plugins/semantic-scholar/search/__tests__/route.test.ts`

- Test `POST` với query hợp lệ → trả về papers array
- Test `POST` thiếu query → 400 error
- Test `GET` với query param → trả về papers
- Mock `fetch` để tránh gọi API thật

#### 2. DOI Resolver API Test

```bash
npx vitest run src/app/api/plugins/doi-resolver --reporter=verbose
```

File test mới: `src/app/api/plugins/doi-resolver/resolve/__tests__/route.test.ts`

- Test `POST` với DOI hợp lệ → trả về citation metadata
- Test `POST` với DOI không tồn tại → error message
- Test batch resolve → trả về array
- Mock CrossRef API response

#### 3. Citation Type Test

```bash
npx vitest run packages/types --reporter=verbose
```

Verify `CitationItem` extension không break existing tests.

#### 4. Existing Tests Regression

```bash
# Chạy tất cả test hiện có để đảm bảo không regression
npx vitest run --reporter=verbose
```

### Manual Verification

> \[!TIP]
> Các bước manual test cần thực hiện trên staging (Vercel Preview) sau khi deploy.

#### Test 1: Semantic Scholar Plugin hoạt động

1. Mở Phở Chat → vào conversation bất kỳ
2. Vào Agent Settings → Plugin → bật "Semantic Scholar"
3. Gõ: "Tìm bài báo về transformer architecture"
4. **Expected**: Plugin trả về danh sách papers với title, authors, citation count, DOI
5. Kiểm tra link DOI clickable

#### Test 2: DOI Resolver hoạt động

1. Bật plugin "DOI Resolver"
2. Gõ: "Resolve DOI 10.1038/s41586-021-03819-2"
3. **Expected**: Trả về citation đầy đủ (title, authors, journal, year, formatted citation)

#### Test 3: ArXiv search by ID

1. Bật plugin ArXiv
2. Gõ: "Lấy chi tiết paper arXiv 2401.04088"
3. **Expected**: Trả về full paper details

#### Test 4: Onboarding — Graduate Student persona

1. Clear localStorage, mở Phở Chat fresh
2. Chọn profession "Nghiên cứu sinh / Tiến sĩ"
3. **Expected**: Gợi ý ArXiv + Semantic Scholar + DOI Resolver plugins

#### Test 5: LaTeX render (regression)

1. Gõ: "Giải thích công thức Einstein $E = mc^2$ và tích phân $\int\_0^\infty e^{-x^2} dx$"
2. **Expected**: Render math inline + block đúng, không bị lỗi

---

## Effort Summary

| Phase       | Nội dung                                | Effort     | Priority  |
| ----------- | --------------------------------------- | ---------- | --------- |
| **Phase 1** | Semantic Scholar + DOI Resolver plugins | 3 ngày     | 🔴 High   |
| **Phase 2** | ArXiv enhancement                       | 1 ngày     | 🟡 Medium |
| **Phase 3** | Citation UI (Footnote, Bibliography)    | 3 ngày     | 🔴 High   |
| **Phase 4** | Onboarding + Changelog + Blog           | 1 ngày     | 🟢 Low    |
| **Tổng**    |                                         | **8 ngày** |           |
