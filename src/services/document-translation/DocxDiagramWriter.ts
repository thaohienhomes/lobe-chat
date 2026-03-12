/**
 * DocxDiagramWriter — Write translations back into DOCX XML
 *
 * CRITICAL: Only replaces text content. Never touches:
 * - Shape geometry (position, size, connectors, arrows)
 * - Formatting (fonts, colors, borders, fill)
 * - Relationships (rId references)
 * - Content types
 *
 * This ensures 100% layout preservation.
 *
 * Ported from: docs/DOC Tranlation/translate_word_diagram.py (translate_texts_in_docx)
 */
import type { ParseResult, Translation } from './types';

// ─── Text replacement tags ──────────────────────────────────────────

/** XML tag names that contain translatable text */
const TEXT_TAGS = [
  'w:t', // WordprocessingML text
  'a:t', // DrawingML text
] as const;

// ─── DocxDiagramWriter ──────────────────────────────────────────────

export class DocxDiagramWriter {
  /**
   * Apply translations back to the DOCX XML structure.
   *
   * @param parseResult - The original parse result with fileStructure (JSZip)
   * @param translations - Array of {id, original, translated} mappings
   * @returns Buffer containing the translated .docx file
   */
  async apply(parseResult: ParseResult, translations: Translation[]): Promise<Buffer> {
    const { fileStructure: zip, texts: extractedTexts } = parseResult;

    // Build a lookup map: original text → translated text
    const translationMap = new Map<string, string>();

    for (const translation of translations) {
      if (translation.original && translation.translated) {
        translationMap.set(translation.original, translation.translated);
      }
    }

    if (translationMap.size === 0) {
      // No translations to apply — return original file
      const buf = await zip.generateAsync({ type: 'nodebuffer' });
      return Buffer.from(buf);
    }

    // Get the XML files that contain text we extracted
    const xmlFilesWithText = new Set(extractedTexts.map((t) => t.xmlPath));

    // Process each XML file that has translatable text
    for (const xmlPath of xmlFilesWithText) {
      const file = zip.file(xmlPath);
      if (!file) continue;

      const xmlContent = await file.async('string');
      const modified = this.replaceTextInXml(xmlContent, translationMap);

      if (modified.changed) {
        zip.file(xmlPath, modified.xml);
      }
    }

    // Generate the new .docx buffer
    const outputBuffer = await zip.generateAsync({
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
      type: 'nodebuffer',
    });

    return Buffer.from(outputBuffer);
  }

  /**
   * Replace text content in an XML string using the translation map.
   *
   * Uses string-level replacement to avoid XML structure changes.
   * This is the safest approach — we never parse and rebuild the XML,
   * which could introduce formatting changes.
   */
  private replaceTextInXml(
    xmlContent: string,
    translationMap: Map<string, string>,
  ): { changed: boolean; replacements: number; xml: string } {
    let modified = xmlContent;
    let replacements = 0;
    let changed = false;

    // For each translation, do targeted string replacement within text tags
    for (const [original, translated] of translationMap) {
      if (!original || !translated || original === translated) continue;

      // Capture these locally so the callback closure is safe
      const origText = original;
      const transText = translated;

      for (const tag of TEXT_TAGS) {
        // Match the text between opening and closing tags
        // e.g., <w:t>original text</w:t> or <w:t xml:space="preserve">original text</w:t>
        const pattern = new RegExp(
          `(<${tag}(?:\\s[^>]*)?>)` + // Opening tag with optional attributes
            `([^<]*?)` + // Text content (non-greedy)
            `(</${tag}>)`, // Closing tag
          'g',
        );

        // eslint-disable-next-line @typescript-eslint/no-loop-func
        modified = modified.replace(pattern, (match, openTag, textContent, closeTag) => {
          if (textContent.includes(origText)) {
            const newText = textContent.replace(origText, transText);
            if (newText !== textContent) {
              replacements++;
              changed = true;
              return `${openTag}${newText}${closeTag}`;
            }
          }
          return match;
        });
      }
    }

    return { changed, replacements, xml: modified };
  }

  /**
   * Get statistics about what was replaced.
   */
  static getStats(
    translations: Translation[],
    totalReplacements: number,
  ): {
    fontAdjustments: number;
    replacements: number;
    unchanged: number;
  } {
    const applied = translations.filter((t) => t.original !== t.translated);
    return {
      fontAdjustments: 0,
      replacements: totalReplacements,
      unchanged: translations.length - applied.length,
    };
  }
}
