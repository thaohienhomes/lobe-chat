# CLAUDE.md Addendum — Document Translation Feature

> Add this section to the existing CLAUDE.md in thaohienhomes/lobe-chat repo

---

## Feature: Document Translation (Diagram-Aware)

### What

Translate Word documents (.docx) containing diagrams, flowcharts, and shapes
while preserving 100% of the original layout structure. Primary use case:
Chinese construction/technical documents → Vietnamese.

### Architecture Decision: Hybrid Approach C

- **Route A (primary):** Parse DOCX XML directly, extract text from shapes
  (`wps:txbx`, `v:textbox`, `a:t`), translate via AI, write back to XML.
  Result: identical layout, only text changes.
- **Route B (fallback):** For embedded image diagrams, use Vision AI
  (`vision-analysis.ts`) to detect text regions, translate, and recreate
  using `GenerativeDiagram` component.
- **Auto-routing:** `DiagramTypeDetector` checks if diagram contains
  native shapes (→ Route A) or embedded images (→ Route B).

### Key Files to Reference

- `packages/file-loaders/src/loaders/docx/` — existing DocxLoader (extend, don't rewrite)
- `src/services/vision-analysis.ts` — existing Vision AI service (add analyzeDiagram method)
- `src/store/chat/slices/translate/` — existing translation store (extend for document-level)
- `src/components/InteractiveUI/GenerativeDiagram/` — existing diagram renderer (add template)
- `src/libs/unstructured/` — existing document chunking with coordinates

### New Files to Create

```
src/services/document-translation/
├── index.ts                  # Orchestrator
├── DocxDiagramParser.ts      # XML shape/textbox extraction
├── DocxDiagramWriter.ts      # Write translations back
├── VisionDiagramAnalyzer.ts  # Vision AI fallback
├── TranslationBatcher.ts     # Batch AI translation
├── DiagramTypeDetector.ts    # Auto-route decision
└── types.ts

src/app/api/document-translation/
├── extract/route.ts
├── translate/route.ts
├── apply/route.ts
└── preview/route.ts

src/plugins/doc-translator/
├── manifest.json
├── index.ts
└── tools.ts

src/components/InteractiveUI/TranslatedDocument/
├── index.tsx
├── DiffView.tsx
├── DiagramPreview.tsx
├── ProgressBar.tsx
└── DownloadButton.tsx
```

### Dependencies

- `jszip` (unzip/rezip .docx)
- `fast-xml-parser` (parse/build Word XML)

### XML Namespaces to Parse

```
wps: http://schemas.microsoft.com/office/word/2010/wordprocessingShape
v:   urn:schemas-microsoft-com:vml
a:   http://schemas.openxmlformats.org/drawingml/2006/main
w:   http://schemas.openxmlformats.org/wordprocessingml/2006/main
dgm: http://schemas.openxmlformats.org/drawingml/2006/diagram
```

### Implementation Order

1. DocxDiagramParser + DiagramTypeDetector (core extraction)
2. TranslationBatcher (AI translation)
3. DocxDiagramWriter (write back)
4. API routes (extract → translate → apply)
5. Plugin manifest + tools registration
6. TranslatedDocument Artifact component
7. Vision AI fallback (Route B)

### Full spec: See docs/FEATURE_DOC_TRANSLATION.md
