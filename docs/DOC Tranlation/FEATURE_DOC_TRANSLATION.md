# Pho.Chat — Document Translation (Diagram-Aware) Implementation Spec

> **Feature:** Dịch tài liệu giữ nguyên cấu trúc sơ đồ
> **Version:** 1.0 | **Date:** 2026-03-12
> **Approach:** Hybrid C (XML parsing + Vision AI fallback)
> **Priority:** High — unique differentiator, no competitor does this well

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    USER FLOW                             │
│  Upload .docx → Auto-detect → Translate → Download      │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│          API ROUTES (Next.js server-side)                │
│  src/app/api/document-translation/                      │
│  ├── extract/route.ts    POST: upload → extract texts   │
│  ├── translate/route.ts  POST: texts → AI translation   │
│  ├── apply/route.ts      POST: apply → output .docx     │
│  └── preview/route.ts    GET: preview as interactive     │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│          CORE ENGINE (server-side Python/Node)           │
│                                                          │
│  Route A: DOCX XML Parsing (shapes/textbox)             │
│  ┌──────────────────────────────────────────┐           │
│  │ 1. Unzip .docx → access word/*.xml       │           │
│  │ 2. Parse wps:txbx, v:textbox, a:t        │           │
│  │ 3. Extract text + shape metadata          │           │
│  │ 4. AI translate batch                     │           │
│  │ 5. Replace text in XML                    │           │
│  │ 6. Repack .docx → output                 │           │
│  │ Result: 100% layout preserved             │           │
│  └──────────────────────────────────────────┘           │
│                                                          │
│  Route B: Vision AI Fallback (embedded images)          │
│  ┌──────────────────────────────────────────┐           │
│  │ 1. Extract embedded images from .docx     │           │
│  │ 2. Vision AI detect text regions          │           │
│  │ 3. AI translate detected text             │           │
│  │ 4. GenerativeDiagram recreate             │           │
│  │ Result: Recreated diagram (may differ)    │           │
│  └──────────────────────────────────────────┘           │
│                                                          │
│  Auto-routing: check if diagram is shapes vs image      │
└─────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│          FRONTEND (Plugin + Artifact)                    │
│  Plugin: @pho/doc-translator                            │
│  ├── TranslationPreview Artifact                        │
│  ├── DiffView (original vs translated side-by-side)     │
│  └── Download translated .docx                          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Mapping to Existing Codebase

### 2.1 Files to EXTEND (not rewrite)

| Existing File                                     | What to Add                                                        | Why                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `packages/file-loaders/src/loaders/docx/`         | Add `DocxDiagramExtractor` class alongside existing text extractor | Currently only extracts text, need to also extract shapes/textbox content with metadata       |
| `src/services/vision-analysis.ts`                 | Add `analyzeDiagram()` method                                      | Existing vision service handles general images; add specialized diagram text detection prompt |
| `src/store/chat/slices/translate/`                | Add `documentTranslation` action                                   | Currently only message-level; extend to document-level with progress tracking                 |
| `src/components/InteractiveUI/GenerativeDiagram/` | Add `TranslatedDiagram` template type                              | Already has 6 templates; add 7th for translated reconstruction                                |
| `src/libs/unstructured/`                          | Leverage for coordinate-aware chunking                             | Already has document chunking with coordinates                                                |

### 2.2 Files to CREATE (new)

```
# ── Backend: API Routes ──
src/app/api/document-translation/
├── extract/route.ts          # POST: upload .docx → extract translatable texts
├── translate/route.ts        # POST: texts[] → translated texts[] via AI model
├── apply/route.ts            # POST: translations → output .docx download
└── preview/route.ts          # GET: render preview as Artifact

# ── Core Engine ──
src/services/document-translation/
├── index.ts                  # Main orchestrator
├── DocxDiagramParser.ts      # XML-level shape/textbox extraction (Route A)
├── DocxDiagramWriter.ts      # Write translations back to XML (Route A)
├── VisionDiagramAnalyzer.ts  # Vision AI fallback for images (Route B)
├── TranslationBatcher.ts     # Batch text → AI model → translated text
├── DiagramTypeDetector.ts    # Auto-detect: shapes vs embedded image
└── types.ts                  # TypeScript interfaces

# ── Plugin ──
src/plugins/doc-translator/
├── manifest.json             # Plugin registration
├── index.ts                  # Plugin entry point
└── tools.ts                  # Tool definitions for AI model

# ── Artifact Component ──
src/components/InteractiveUI/TranslatedDocument/
├── index.tsx                 # Main Artifact wrapper
├── DiffView.tsx              # Side-by-side original vs translated
├── DiagramPreview.tsx        # Interactive preview of translated diagram
├── ProgressBar.tsx           # Translation progress indicator
└── DownloadButton.tsx        # Download translated .docx
```

---

## 3. Core Engine — Detailed Specs

### 3.1 DocxDiagramParser.ts (Route A — the key differentiator)

```typescript
// src/services/document-translation/DocxDiagramParser.ts
import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';

interface ExtractedText {
  id: string; // Unique ID for mapping back
  text: string; // Original text content
  type: 'shape_textbox' | 'vml_textbox' | 'drawingml' | 'smartart' | 'paragraph';
  xmlPath: string; // Which XML file it came from
  elementPath: string; // XPath-like location within XML
  metadata: {
    fontSize?: number;
    fontFamily?: string;
    bold?: boolean;
    color?: string;
    shapeType?: string; // rectangle, diamond, arrow, etc.
    position?: { x: number; y: number; width: number; height: number };
  };
}

interface ParseResult {
  texts: ExtractedText[];
  diagramType: 'shapes' | 'embedded_image' | 'smartart' | 'mixed';
  fileStructure: JSZip; // Keep in memory for write-back
  stats: {
    totalShapes: number;
    totalTextElements: number;
    embeddedImages: number;
    xmlFiles: string[];
  };
}

export class DocxDiagramParser {
  /**
   * Parse a DOCX file and extract all translatable text from diagrams.
   *
   * Key XML namespaces to search:
   * - wps:txbx (WordprocessingShape textbox) → DrawingML shapes
   * - v:textbox (VML textbox) → Legacy VML shapes
   * - a:t (DrawingML text) → SmartArt, charts, grouped shapes
   * - w:t (WordprocessingML text) → Regular paragraph text
   *
   * The parser preserves the exact XML structure so translations
   * can be written back without disturbing layout.
   */
  async parse(fileBuffer: Buffer): Promise<ParseResult> {
    // 1. Unzip .docx
    // 2. Find all XML files in word/ directory
    // 3. For each XML file, search for text elements in shape namespaces
    // 4. Extract text + metadata (font, size, position)
    // 5. Classify diagram type (shapes vs image vs mixed)
    // 6. Return structured result
  }

  /**
   * Detect if diagrams in the document are native shapes or embedded images.
   * This determines which pipeline (Route A or B) to use.
   */
  detectDiagramType(zip: JSZip): 'shapes' | 'embedded_image' | 'mixed' {
    // Check for:
    // - wp:inline / wp:anchor with wps:wsp children → native shapes
    // - wp:inline with a:blip → embedded image
    // - dgm:relIds → SmartArt (treated as shapes)
  }
}
```

### 3.2 DocxDiagramWriter.ts

```typescript
// src/services/document-translation/DocxDiagramWriter.ts

interface Translation {
  id: string; // Maps to ExtractedText.id
  original: string;
  translated: string;
}

export class DocxDiagramWriter {
  /**
   * Apply translations back to the DOCX XML structure.
   *
   * CRITICAL: Only replace text content, never touch:
   * - Shape geometry (position, size, connectors, arrows)
   * - Formatting (fonts, colors, borders, fill)
   * - Relationships (rId references)
   * - Content types
   *
   * This ensures 100% layout preservation.
   */
  async apply(parseResult: ParseResult, translations: Translation[]): Promise<Buffer> {
    // 1. For each translation, locate the original text element in XML
    // 2. Replace text content only (preserve xml:space="preserve" etc.)
    // 3. Handle CJK → Vietnamese text length differences:
    //    - If translated text is significantly longer, may need to
    //      adjust font size slightly (optional, configurable)
    // 4. Repack into .docx ZIP
    // 5. Return Buffer for download
  }
}
```

### 3.3 TranslationBatcher.ts

```typescript
// src/services/document-translation/TranslationBatcher.ts

/**
 * Batch translate texts using the AI model configured in Pho.Chat.
 * Leverages existing model infrastructure — no new API keys needed.
 *
 * Uses structured output prompt to ensure consistent JSON response.
 */
export class TranslationBatcher {
  /**
   * System prompt optimized for technical diagram translation.
   * Key: translate text labels, not sentences. Keep translations concise
   * to fit in diagram boxes.
   */
  private systemPrompt = `
You are a technical document translator specializing in construction,
engineering, and academic terminology. You translate diagram labels
(short phrases in boxes/shapes) from {sourceLang} to {targetLang}.

RULES:
- Keep translations concise — these are diagram labels, not paragraphs
- Preserve technical terminology accuracy
- If a term has a standard translation in the target field, use it
- Return ONLY valid JSON: {"translations": [{"id": "...", "translated": "..."}]}
- Do not translate proper nouns, abbreviations, or numbers
`;

  async translateBatch(
    texts: ExtractedText[],
    sourceLang: string,
    targetLang: string,
    modelId: string, // Use whatever model user has configured
  ): Promise<Translation[]> {
    // 1. Group texts into batches of ~50 (token limit management)
    // 2. For each batch, call AI model with structured output prompt
    // 3. Parse JSON response
    // 4. Validate all IDs are accounted for
    // 5. Return translations array
  }
}
```

### 3.4 DiagramTypeDetector.ts

```typescript
// src/services/document-translation/DiagramTypeDetector.ts

/**
 * Auto-detect diagram type to route to correct pipeline.
 *
 * Decision tree:
 * 1. Has wps:wsp or v:shape children with text? → Route A (XML parsing)
 * 2. Has dgm:relIds (SmartArt)? → Route A (SmartArt XML in diagrams/ folder)
 * 3. Has only a:blip (image) with no text shapes? → Route B (Vision AI)
 * 4. Mixed? → Route A for shapes + Route B for images
 */
export class DiagramTypeDetector {
  detect(zip: JSZip): {
    route: 'xml_parsing' | 'vision_ai' | 'hybrid';
    confidence: number;
    details: string;
  };
}
```

---

## 4. Plugin Manifest

```json
{
  "artifactTypes": ["TranslatedDocument", "DiagramPreview", "DiffView"],
  "dependencies": ["jszip", "fast-xml-parser"],
  "description": "Dịch tài liệu Word/PDF giữ nguyên 100% cấu trúc sơ đồ, biểu đồ, flowchart",
  "displayName": "Document Translator (Diagram-Aware)",
  "icon": "languages",
  "name": "@pho/doc-translator",
  "requiredModels": ["any — uses user's configured model"],
  "supportedFormats": [".docx", ".doc", ".pdf"],
  "tools": [
    {
      "name": "translate_document_diagram",
      "description": "Translate diagrams/flowcharts in a Word document while preserving exact layout, shapes, arrows, and formatting. Supports Chinese, English, Japanese, Korean → Vietnamese and vice versa.",
      "parameters": {
        "fileId": "string — uploaded file ID",
        "sourceLang": "string — source language code (auto-detect if omitted)",
        "targetLang": "string — target language code (default: vi)",
        "preserveOriginal": "boolean — keep original text as annotation (default: false)",
        "adjustFontSize": "boolean — auto-shrink font if translation is longer (default: true)"
      }
    },
    {
      "name": "extract_diagram_text",
      "description": "Extract all translatable text from diagrams in a Word document without translating. Useful for review before translation.",
      "parameters": {
        "fileId": "string — uploaded file ID"
      }
    },
    {
      "name": "preview_translated_diagram",
      "description": "Generate an interactive preview of the translated diagram in chat.",
      "parameters": {
        "fileId": "string — uploaded file ID",
        "translationId": "string — translation job ID"
      }
    }
  ],
  "version": "1.0.0",
  "verticals": ["education", "construction", "research", "all"]
}
```

---

## 5. API Route Specs

### POST /api/document-translation/extract

```typescript
// Request
{
  fileId: string; // From Pho.Chat file upload system
}

// Response
{
  jobId: string;
  diagramType: 'shapes' | 'embedded_image' | 'mixed';
  texts: Array<{
    id: string;
    text: string;
    type: string;
    metadata: { shapeType; fontSize; position };
  }>;
  stats: {
    totalElements: number;
    estimatedTokens: number;
    estimatedCost: string; // Based on current model pricing
  }
  detectedLanguage: string;
}
```

### POST /api/document-translation/translate

```typescript
// Request
{
  jobId: string;
  targetLang: string;
  modelId?: string;            // Override model, or use default
  glossary?: Record<string, string>;  // Custom term mappings
}

// Response (streamed for progress)
{
  jobId: string;
  status: 'translating' | 'complete' | 'error';
  progress: number;            // 0-100
  translations: Array<{
    id: string;
    original: string;
    translated: string;
    confidence: number;
  }>;
}
```

### POST /api/document-translation/apply

```typescript
// Request
{
  jobId: string;
  translations: Array<{ id: string; translated: string }>; // Allow user edits
  options: {
    adjustFontSize: boolean;
    keepOriginalAsComment: boolean;
  }
}

// Response
{
  fileUrl: string; // Download URL for translated .docx
  fileName: string;
  fileSize: number;
  stats: {
    replacements: number;
    unchanged: number;
    fontAdjustments: number;
  }
}
```

---

## 6. Frontend Artifact Component

### TranslatedDocument Artifact

```tsx
// src/components/InteractiveUI/TranslatedDocument/index.tsx

// This Artifact renders when the AI model calls translate_document_diagram tool.
// It shows:
// 1. Progress bar during translation
// 2. Side-by-side diff view (original Chinese → translated Vietnamese)
// 3. Editable translation cells (user can adjust before applying)
// 4. Preview of translated diagram (interactive, zoomable)
// 5. Download button for final .docx

// Uses existing Pho.Chat patterns:
// - Zustand store for state management
// - Tailwind CSS for styling
// - Existing Icon/Button components from @lobehub/ui
```

---

## 7. Dependencies to Add

```json
// package.json additions
{
  "dependencies": {
    "jszip": "^3.10.1", // Unzip/rezip .docx files
    "fast-xml-parser": "^4.3.0" // Parse/build Word XML (faster than xml2js)
  }
}
```

Note: These are lightweight, no heavy ML dependencies needed on frontend.
All AI processing uses existing Pho.Chat model infrastructure.

---

## 8. Language Support Matrix

| Source → Target      | Route A (XML) | Route B (Vision) | Notes                                |
| -------------------- | ------------- | ---------------- | ------------------------------------ |
| 中文 → Tiếng Việt    | ✅            | ✅               | Primary use case (construction docs) |
| English → Tiếng Việt | ✅            | ✅               | Academic papers                      |
| 日本語 → Tiếng Việt  | ✅            | ✅               | Technical manuals                    |
| Any → Any            | ✅            | ✅               | AI model handles translation         |

Auto-detect source language using first batch of extracted text.

---

## 9. Implementation Priority (for Claude Code agent)

### Sprint 1: Core Engine (Week 1-2)

1. Create `src/services/document-translation/DocxDiagramParser.ts`
2. Create `src/services/document-translation/DocxDiagramWriter.ts`
3. Create `src/services/document-translation/TranslationBatcher.ts`
4. Create `src/services/document-translation/DiagramTypeDetector.ts`
5. Create API routes: extract, translate, apply
6. Add `jszip` and `fast-xml-parser` dependencies
7. Unit tests for XML parsing with sample .docx files

### Sprint 2: Plugin + Artifact (Week 3-4)

8. Create plugin manifest `@pho/doc-translator`
9. Register tools with chat engine
10. Build TranslatedDocument Artifact component
11. Build DiffView component
12. Build ProgressBar component
13. Integration test: end-to-end upload → translate → download

### Sprint 3: Vision AI Fallback + Polish (Week 5-6)

14. Extend `vision-analysis.ts` with `analyzeDiagram()` method
15. Build VisionDiagramAnalyzer.ts (Route B)
16. Add bilingual output option (show both languages)
17. Add custom glossary support
18. Performance optimization (stream translations)
19. Error handling and edge cases

### Future: PDF Support (Week 7-8)

20. Integrate BabelDOC or Docling for PDF pipeline
21. Add PDF → translated PDF route
22. Academic paper translation with formula preservation

---

## 10. Testing Strategy

```
tests/
├── unit/
│   ├── DocxDiagramParser.test.ts     # Parse various DOCX shape types
│   ├── DocxDiagramWriter.test.ts     # Write-back preserves layout
│   ├── DiagramTypeDetector.test.ts   # Correctly classifies diagram types
│   └── TranslationBatcher.test.ts    # Batch logic, error handling
├── integration/
│   ├── extract-translate-apply.test.ts  # Full pipeline
│   └── api-routes.test.ts              # API contract tests
├── fixtures/
│   ├── construction-flowchart.docx     # Sơ đồ giám sát công trình (Chinese)
│   ├── process-diagram-shapes.docx     # Native shapes diagram
│   ├── diagram-as-image.docx           # Embedded image diagram
│   ├── smartart-hierarchy.docx         # SmartArt diagram
│   └── mixed-content.docx             # Text + shapes + images
└── snapshots/
    └── translated-output/              # Expected outputs for regression
```

---

## 11. Success Metrics

| Metric               | Target                                    | How to Measure                           |
| -------------------- | ----------------------------------------- | ---------------------------------------- |
| Layout preservation  | 100% for Route A                          | Visual comparison original vs translated |
| Translation accuracy | >95% for technical terms                  | Human review on 10 sample docs           |
| Processing speed     | <30s for typical 10-page doc              | API response time                        |
| User satisfaction    | >80% find useful                          | In-app survey                            |
| File compatibility   | Opens correctly in Word, WPS, Google Docs | Test on all 3                            |

---

## 12. Competitive Advantage

No existing tool does this:

- Google Translate: Translates text, destroys layout
- DeepL: Same problem
- PDFMathTranslate: PDF only, no DOCX shapes
- BabelDOC: PDF only
- Microsoft Translator: Basic DOCX text, ignores shapes/diagrams

**Pho.Chat would be the first AI tool that translates Word document diagrams
while preserving 100% of the original layout structure.**

This is especially valuable for:

- Vietnamese construction companies receiving Chinese technical docs
- Academic researchers translating papers with diagrams
- Education sector translating foreign textbooks
