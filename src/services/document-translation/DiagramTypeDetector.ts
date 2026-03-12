/**
 * DiagramTypeDetector — Auto-routing decision engine
 *
 * Analyzes a DOCX ZIP to determine which translation pipeline to use:
 * - Route A (xml_parsing): Native shapes with textboxes → parse & replace XML
 * - Route B (vision_ai):   Embedded images only → Vision AI OCR + recreate
 * - Hybrid:                Both shapes and images → use both routes
 */
import type JSZip from 'jszip';

import type { DiagramDetectionResult } from './types';

export class DiagramTypeDetector {
  /**
   * Detect the diagram content type and determine the translation route.
   *
   * Decision tree:
   * 1. Has wps:wsp or v:shape children with text? → Route A (XML parsing)
   * 2. Has dgm:relIds (SmartArt)? → Route A (SmartArt XML in diagrams/ folder)
   * 3. Has only a:blip (image) with no text shapes? → Route B (Vision AI)
   * 4. Mixed? → Hybrid (Route A for shapes + Route B for images)
   */
  async detect(zip: JSZip): Promise<DiagramDetectionResult> {
    let hasShapes = false;
    let hasVmlShapes = false;
    let hasSmartArt = false;
    let hasEmbeddedImages = false;
    let hasTextInShapes = false;

    // Check for SmartArt (diagrams/ folder)
    const diagramFiles = Object.keys(zip.files).filter(
      (name) => name.startsWith('word/diagrams/') && name.endsWith('.xml'),
    );
    hasSmartArt = diagramFiles.length > 0;

    // Analyze word/document.xml for shapes vs images
    const docXml = zip.file('word/document.xml');
    if (docXml) {
      const content = await docXml.async('string');

      // Quick string checks before full parse (performance optimization)
      hasShapes = content.includes('wps:wsp') || content.includes('wps:txbx');
      hasVmlShapes = content.includes('v:shape') || content.includes('v:textbox');
      hasEmbeddedImages = content.includes('a:blip');

      // If shapes found, check if they contain text
      if (hasShapes || hasVmlShapes) {
        hasTextInShapes =
          content.includes('wps:txbx') ||
          content.includes('v:textbox') ||
          (content.includes('wps:txBody') && content.includes('a:t'));
      }
    }

    // Decision logic
    const hasEditableText = hasTextInShapes || hasSmartArt;
    const hasImages = hasEmbeddedImages;

    if (hasEditableText && !hasImages) {
      return {
        confidence: 0.95,
        contentType: hasSmartArt ? 'smartart' : 'shapes',
        details: `Found ${hasSmartArt ? 'SmartArt diagrams' : 'native shapes'} with editable text. XML parsing will preserve 100% layout.`,
        route: 'xml_parsing',
      };
    }

    if (!hasEditableText && hasImages) {
      return {
        confidence: 0.8,
        contentType: 'embedded_image',
        details: 'Diagrams are embedded as images. Vision AI will attempt OCR and text detection.',
        route: 'vision_ai',
      };
    }

    if (hasEditableText && hasImages) {
      return {
        confidence: 0.85,
        contentType: 'mixed',
        details:
          'Document contains both native shapes (XML parseable) and embedded images. Using hybrid approach.',
        route: 'hybrid',
      };
    }

    // No diagrams found — still try XML parsing for regular text
    return {
      confidence: 0.6,
      contentType: 'shapes',
      details:
        'No clear diagram elements detected. Will attempt XML text extraction for regular document content.',
      route: 'xml_parsing',
    };
  }
}
