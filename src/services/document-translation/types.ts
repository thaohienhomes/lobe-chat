/**
 * Document Translation (Diagram-Aware) — Type Definitions
 *
 * Defines the contract between pipeline stages:
 *   Parse → Detect → Translate → Write
 *
 * Reference: docs/DOC Tranlation/FEATURE_DOC_TRANSLATION.md
 */
import type JSZip from 'jszip';

// ─── Extracted Text ─────────────────────────────────────────────────

/** Type of text element found in the DOCX XML */
export type TextElementType =
  | 'drawingml' // a:t — DrawingML text (SmartArt, charts)
  | 'paragraph' // w:t — Regular paragraph text (not inside shapes)
  | 'shape_textbox' // wps:txbx — WordprocessingShape textbox
  | 'smartart' // dgm — SmartArt text
  | 'vml_textbox'; // v:textbox — Legacy VML textbox

/** A single translatable text element extracted from DOCX XML */
export interface ExtractedText {
  /** XPath-like location within the XML file for precise write-back */
  elementIndex: number;
  /** Unique ID for mapping back during write-back */
  id: string;
  /** Text formatting and position metadata */
  metadata: {
    bold?: boolean;
    color?: string;
    fontFamily?: string;
    fontSize?: number;
    /** Bounding box position in EMU (English Metric Units) */
    position?: { height: number, width: number; x: number; y: number; };
    /** Shape type if inside a shape (rectangle, diamond, arrow, etc.) */
    shapeType?: string;
  };
  /** Original text content */
  text: string;
  /** Type of container element */
  type: TextElementType;
  /** Which XML file this text came from (e.g., "word/document.xml") */
  xmlPath: string;
}

// ─── Diagram Type Detection ─────────────────────────────────────────

/** Classification of diagram content in the DOCX */
export type DiagramContentType = 'shapes' | 'embedded_image' | 'smartart' | 'mixed';

/** Result of diagram type detection */
export interface DiagramDetectionResult {
  /** How confident the detector is (0-1) */
  confidence: number;
  /** Raw content type classification */
  contentType: DiagramContentType;
  /** Human-readable explanation of the decision */
  details: string;
  /** Which pipeline route to use */
  route: 'xml_parsing' | 'vision_ai' | 'hybrid';
}

// ─── Parse Result ───────────────────────────────────────────────────

/** Output of DocxDiagramParser.parse() */
export interface ParseResult {
  /** Detected diagram type */
  diagramType: DiagramContentType;
  /** In-memory ZIP structure for write-back */
  fileStructure: JSZip;
  /** Parsing statistics */
  stats: {
    embeddedImages: number;
    totalShapes: number;
    totalTextElements: number;
    /** XML files that were processed */
    xmlFiles: string[];
  };
  /** All extracted translatable texts */
  texts: ExtractedText[];
}

// ─── Translation ────────────────────────────────────────────────────

/** A single translation mapping */
export interface Translation {
  /** Translation confidence (0-1), from AI model */
  confidence?: number;
  /** Maps to ExtractedText.id */
  id: string;
  /** Original text */
  original: string;
  /** Translated text */
  translated: string;
}

/** Options for the translation batch request */
export interface TranslationOptions {
  /** Custom term glossary overrides */
  glossary?: Record<string, string>;
  /** AI model to use (uses default if omitted) */
  modelId?: string;
  /** Source language code (auto-detect if omitted) */
  sourceLang?: string;
  /** Target language code */
  targetLang: string;
}

// ─── Translation Job ────────────────────────────────────────────────

/** Status of a translation job */
export type JobStatus = 'extracting' | 'translating' | 'applying' | 'complete' | 'error';

/** Full state of a translation job (used by orchestrator) */
export interface TranslationJob {
  /** Detected source language */
  detectedLanguage?: string;
  /** Error message if status is 'error' */
  error?: string;
  /** Unique job ID */
  jobId: string;
  /** Output file buffer (available after apply) */
  outputBuffer?: Buffer;
  /** Parse results (available after extraction) */
  parseResult?: ParseResult;
  /** Progress percentage (0-100) */
  progress: number;
  /** Pipeline route used */
  route?: DiagramDetectionResult['route'];
  /** Current status */
  status: JobStatus;
  /** Translations (available after translation) */
  translations?: Translation[];
}

// ─── API Request/Response Types ─────────────────────────────────────

/** POST /api/document-translation/extract — Request */
export interface ExtractRequest {
  /** Raw file buffer (from multipart upload) */
  fileBuffer: Buffer;
  /** Original filename */
  fileName: string;
}

/** POST /api/document-translation/extract — Response */
export interface ExtractResponse {
  detectedLanguage: string;
  diagramType: DiagramContentType;
  jobId: string;
  route: DiagramDetectionResult['route'];
  stats: {
    estimatedTokens: number;
    totalElements: number;
  };
  texts: Array<{
    id: string;
    metadata: ExtractedText['metadata'];
    text: string;
    type: TextElementType;
  }>;
}

/** POST /api/document-translation/translate — Request */
export interface TranslateRequest {
  glossary?: Record<string, string>;
  jobId: string;
  modelId?: string;
  targetLang: string;
}

/** POST /api/document-translation/translate — Response */
export interface TranslateResponse {
  jobId: string;
  progress: number;
  status: 'translating' | 'complete' | 'error';
  translations: Translation[];
}

/** POST /api/document-translation/apply — Request */
export interface ApplyRequest {
  jobId: string;
  options: {
    adjustFontSize: boolean;
    keepOriginalAsComment: boolean;
  };
  /** Allow user edits before applying */
  translations: Array<{ id: string; translated: string }>;
}

/** POST /api/document-translation/apply — Response */
export interface ApplyResponse {
  fileName: string;
  fileSize: number;
  /** Download URL or base64 of the translated .docx */
  fileUrl: string;
  stats: {
    fontAdjustments: number;
    replacements: number;
    unchanged: number;
  };
}
