/**
 * DocxDiagramParser — Route A Core Engine
 *
 * Parses a DOCX file (ZIP containing XML) and extracts all translatable text
 * from shapes, textboxes, SmartArt, and regular paragraphs.
 *
 * Ported from the Python prototype: docs/DOC Tranlation/translate_word_diagram.py
 *
 * Key XML namespaces:
 * - wps:txbx  → WordprocessingShape textbox (modern DOCX shapes)
 * - v:textbox → VML textbox (legacy shapes from .doc era)
 * - a:t       → DrawingML text (SmartArt, charts, grouped shapes)
 * - w:t       → WordprocessingML text (regular paragraphs)
 */
import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';

import type { DiagramContentType, ExtractedText, ParseResult } from './types';

// XML namespace URIs documented in header comment above.
// Element names use prefixes (wps:, v:, a:, w:) directly.

// ─── Parser Options ─────────────────────────────────────────────────

const XML_PARSER_OPTIONS = {
  attributeNamePrefix: '@_',
  ignoreAttributes: false,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isArray: (_name: string, _jpath: string) => {
    // Force certain elements to always be arrays for consistent traversal
    return false;
  },

  // Preserve namespace prefixes so we can search by them
  removeNSPrefix: false,
};

// ─── Helper: Recursive node walker ──────────────────────────────────

function walkNodes(
  obj: any,
  callback: (key: string, value: any, path: string) => void,
  path = '',
): void {
  if (!obj || typeof obj !== 'object') return;

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const currentPath = path ? `${path}/${key}` : key;

    callback(key, value, currentPath);

    if (Array.isArray(value)) {
      for (const [i, element] of value.entries()) {
        walkNodes(element, callback, `${currentPath}[${i}]`);
      }
    } else if (typeof value === 'object' && value !== null) {
      walkNodes(value, callback, currentPath);
    }
  }
}

// ─── DocxDiagramParser ──────────────────────────────────────────────

export class DocxDiagramParser {
  private parser: XMLParser;

  constructor() {
    this.parser = new XMLParser(XML_PARSER_OPTIONS);
  }

  /**
   * Parse a DOCX file buffer and extract all translatable text elements.
   */
  async parse(fileBuffer: Buffer): Promise<ParseResult> {
    // 1. Unzip .docx
    const zip = await JSZip.loadAsync(fileBuffer);

    // 2. Find all XML files in word/ directory (and diagrams/, charts/)
    const xmlFiles = Object.keys(zip.files).filter(
      (name) => name.endsWith('.xml') && !name.startsWith('_rels/'),
    );

    const texts: ExtractedText[] = [];
    let totalShapes = 0;
    let embeddedImages = 0;
    let textElementCounter = 0;

    // 3. Parse each XML file and extract text elements
    for (const xmlPath of xmlFiles) {
      const xmlContent = await zip.file(xmlPath)?.async('string');
      if (!xmlContent) continue;

      let parsed: any;
      try {
        parsed = this.parser.parse(xmlContent);
      } catch {
        // Skip invalid XML
        continue;
      }

      // Track shapes and images for diagram type detection
      const shapeCount = this.countElements(parsed, [
        'wps:wsp',
        'wps:txbx',
        'v:shape',
        'v:textbox',
      ]);
      const imageCount = this.countElements(parsed, ['a:blip']);
      totalShapes += shapeCount;
      embeddedImages += imageCount;

      // 3a. Extract from wps:txbx (DrawingML shapes)
      this.extractFromShapeTextboxes(parsed, xmlPath, texts, textElementCounter);
      textElementCounter = texts.length;

      // 3b. Extract from v:textbox (VML textboxes)
      this.extractFromVmlTextboxes(parsed, xmlPath, texts, textElementCounter);
      textElementCounter = texts.length;

      // 3c. Extract from a:t (DrawingML text — SmartArt, charts)
      // Only from diagram/chart XML files, not from within shapes (already captured)
      if (xmlPath.startsWith('word/diagrams/') || xmlPath.startsWith('word/charts/')) {
        this.extractFromDrawingMLText(parsed, xmlPath, texts, textElementCounter);
        textElementCounter = texts.length;
      }

      // 3d. Extract regular paragraph text (w:t not inside shapes)
      if (xmlPath === 'word/document.xml') {
        this.extractParagraphText(parsed, xmlPath, texts, textElementCounter);
        textElementCounter = texts.length;
      }
    }

    // 4. Deduplicate texts (same text content in overlapping namespaces)
    const deduped = this.deduplicateTexts(texts);

    // 5. Classify diagram type
    const diagramType = this.classifyDiagramType(totalShapes, embeddedImages, deduped);

    return {
      diagramType,
      fileStructure: zip,
      stats: {
        embeddedImages,
        totalShapes,
        totalTextElements: deduped.length,
        xmlFiles,
      },
      texts: deduped,
    };
  }

  // ─── Private extraction methods ─────────────────────────────────

  /**
   * Extract text from wps:txbx elements (modern Word shapes).
   * These contain w:t elements nested inside wps:txbx > w:txbxContent > w:p > w:r > w:t
   */
  private extractFromShapeTextboxes(
    parsed: any,
    xmlPath: string,
    texts: ExtractedText[],
    startIndex: number,
  ): void {
    const found: Array<{ path: string; text: string }> = [];

    walkNodes(parsed, (key, value, path) => {
      if (key === 'wps:txbx' || key === 'wps:txBody') {
        // Find all w:t inside this textbox
        this.collectTextElements(value, 'w:t', found, path);
        // Also collect a:t for shape text body
        this.collectTextElements(value, 'a:t', found, path);
      }
    });

    for (const [i, element] of found.entries()) {
      texts.push({
        elementIndex: startIndex + i,
        id: `shape-${startIndex + i}`,
        metadata: {},
        text: element.text,
        type: 'shape_textbox',
        xmlPath,
      });
    }
  }

  /**
   * Extract text from v:textbox elements (legacy VML shapes).
   * Structure: v:textbox > w:txbxContent > w:p > w:r > w:t
   */
  private extractFromVmlTextboxes(
    parsed: any,
    xmlPath: string,
    texts: ExtractedText[],
    startIndex: number,
  ): void {
    const found: Array<{ path: string; text: string }> = [];

    walkNodes(parsed, (key, value, path) => {
      if (key === 'v:textbox') {
        this.collectTextElements(value, 'w:t', found, path);
      }
    });

    for (const [i, element] of found.entries()) {
      texts.push({
        elementIndex: startIndex + i,
        id: `vml-${startIndex + i}`,
        metadata: {},
        text: element.text,
        type: 'vml_textbox',
        xmlPath,
      });
    }
  }

  /**
   * Extract text from a:t elements in diagram/chart XML files.
   */
  private extractFromDrawingMLText(
    parsed: any,
    xmlPath: string,
    texts: ExtractedText[],
    startIndex: number,
  ): void {
    const found: Array<{ path: string; text: string }> = [];
    this.collectTextElements(parsed, 'a:t', found, '');

    for (const [i, element] of found.entries()) {
      texts.push({
        elementIndex: startIndex + i,
        id: `dml-${startIndex + i}`,
        metadata: {},
        text: element.text,
        type: 'drawingml',
        xmlPath,
      });
    }
  }

  /**
   * Extract regular paragraph text (w:t elements NOT inside shapes).
   * We check by looking at top-level w:body > w:p > w:r > w:t.
   */
  private extractParagraphText(
    parsed: any,
    xmlPath: string,
    texts: ExtractedText[],
    startIndex: number,
  ): void {
    const found: Array<{ path: string; text: string }> = [];

    // Navigate to w:body
    const body = parsed?.['w:document']?.['w:body'];
    if (!body) return;

    // Get paragraphs
    const paragraphs = this.ensureArray(body['w:p']);

    for (const para of paragraphs) {
      if (!para) continue;

      // Skip paragraphs that are inside shapes (they have drawing children)
      if (para['w:r']) {
        const runs = this.ensureArray(para['w:r']);
        for (const run of runs) {
          if (!run) continue;
          // Skip runs that contain drawings (shapes)
          if (run['w:drawing'] || run['mc:AlternateContent']) continue;

          const wt = run['w:t'];
          if (wt) {
            const text = this.getTextContent(wt);
            if (text && text.trim()) {
              found.push({ path: 'w:body/w:p/w:r/w:t', text: text.trim() });
            }
          }
        }
      }
    }

    for (const [i, element] of found.entries()) {
      texts.push({
        elementIndex: startIndex + i,
        id: `para-${startIndex + i}`,
        metadata: {},
        text: element.text,
        type: 'paragraph',
        xmlPath,
      });
    }
  }

  // ─── Utility methods ────────────────────────────────────────────

  /** Recursively collect all text elements of a given tag name */
  private collectTextElements(
    node: any,
    tagName: string,
    result: Array<{ path: string; text: string }>,
    basePath: string,
  ): void {
    if (!node || typeof node !== 'object') return;

    if (Array.isArray(node)) {
      for (const [i, element] of node.entries()) {
        this.collectTextElements(element, tagName, result, `${basePath}[${i}]`);
      }
      return;
    }

    for (const key of Object.keys(node)) {
      if (key === tagName) {
        const text = this.getTextContent(node[key]);
        if (text && text.trim()) {
          result.push({ path: `${basePath}/${key}`, text: text.trim() });
        }
      } else if (typeof node[key] === 'object' && node[key] !== null) {
        this.collectTextElements(node[key], tagName, result, `${basePath}/${key}`);
      }
    }
  }

  /** Get text content from a w:t or a:t element (handles attributes) */
  private getTextContent(node: any): string | null {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (node?.['#text'] !== undefined) return String(node['#text']);
    // Handle array of text runs
    if (Array.isArray(node)) {
      return node
        .map((n) => this.getTextContent(n))
        .filter(Boolean)
        .join('');
    }
    return null;
  }

  /** Count occurrences of specific element names in parsed XML */
  private countElements(parsed: any, elementNames: string[]): number {
    let count = 0;
    walkNodes(parsed, (key) => {
      if (elementNames.includes(key)) count++;
    });
    return count;
  }

  /** Ensure a value is an array */
  private ensureArray<T>(value: T | T[] | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  /** Deduplicate texts with the same content that appear via overlapping extraction paths */
  private deduplicateTexts(texts: ExtractedText[]): ExtractedText[] {
    const seen = new Map<string, ExtractedText>();

    for (const text of texts) {
      // Use xmlPath + text as dedup key
      const key = `${text.xmlPath}::${text.text}::${text.type}`;
      if (!seen.has(key)) {
        seen.set(key, text);
      }
    }

    return Array.from(seen.values());
  }

  /** Classify the diagram type based on element counts */
  private classifyDiagramType(
    shapes: number,
    images: number,
    texts: ExtractedText[],
  ): DiagramContentType {
    const hasShapeTexts = texts.some(
      (t) => t.type === 'shape_textbox' || t.type === 'vml_textbox' || t.type === 'drawingml',
    );

    if (hasShapeTexts && images === 0) return 'shapes';
    if (!hasShapeTexts && images > 0) return 'embedded_image';
    if (hasShapeTexts && images > 0) return 'mixed';

    // If we found SmartArt diagrams
    const hasSmartArt = texts.some((t) => t.type === 'smartart');
    if (hasSmartArt) return 'smartart';

    return 'shapes'; // Default to shapes if we have any text
  }
}
