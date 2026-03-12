/**
 * Document Translation Service — Orchestrator
 *
 * Ties together the full translation pipeline:
 * 1. Parse DOCX → extract texts from shapes/diagrams
 * 2. Detect diagram type → determine route (A: XML, B: Vision AI, or hybrid)
 * 3. Translate texts via AI model
 * 4. Write translations back to DOCX XML → output file
 *
 * Public API — used by API routes.
 */
import { nanoid } from 'nanoid';

import { DiagramTypeDetector } from './DiagramTypeDetector';
import { DocxDiagramParser } from './DocxDiagramParser';
import { DocxDiagramWriter } from './DocxDiagramWriter';
import { GlossaryManager } from './GlossaryManager';
import { TranslationBatcher } from './TranslationBatcher';
import { VisionDiagramAnalyzer } from './VisionDiagramAnalyzer';
import type {
  DiagramDetectionResult,
  ParseResult,
  Translation,
  TranslationJob,
  TranslationOptions,
} from './types';

// ─── In-memory job storage ─────────────────────────────────────────

const jobs = new Map<string, TranslationJob>();

// ─── Public API ─────────────────────────────────────────────────────

export const DocumentTranslationService = {
  /**
   * Step 3: Apply translations and generate output .docx file.
   */
  async apply(
    jobId: string,
    userTranslations?: Array<{ id: string; translated: string }>,
  ): Promise<{
    buffer: Buffer;
    stats: { fontAdjustments: number; replacements: number; unchanged: number };
  }> {
    const job = jobs.get(jobId);
    if (!job || !job.parseResult) {
      throw new Error(`Job ${jobId} not found or extraction not complete`);
    }

    job.status = 'applying';
    job.progress = 85;

    // Merge user edits with AI translations
    let translations: Translation[];
    if (userTranslations && userTranslations.length > 0) {
      // User-edited translations take priority
      const userMap = new Map(userTranslations.map((t) => [t.id, t.translated]));
      translations = (job.translations || []).map((t) => ({
        ...t,
        translated: userMap.get(t.id) ?? t.translated,
      }));
    } else {
      translations = job.translations || [];
    }

    // Write translations back to DOCX
    const writer = new DocxDiagramWriter();
    const buffer = await writer.apply(job.parseResult, translations);

    const stats = DocxDiagramWriter.getStats(translations, translations.length);

    job.outputBuffer = buffer;
    job.status = 'complete';
    job.progress = 100;

    return { buffer, stats };
  },

  /**
   * Clean up job data.
   */
  deleteJob(jobId: string): void {
    jobs.delete(jobId);
  },

  /**
   * Step 1: Extract translatable texts from a DOCX file.
   */
  async extract(fileBuffer: Buffer): Promise<{
    detectedDomain: string | undefined;
    detectedLanguage: string;
    detection: DiagramDetectionResult;
    jobId: string;
    parseResult: ParseResult;
  }> {
    const jobId = nanoid(12);

    // Parse the DOCX
    const parser = new DocxDiagramParser();
    const parseResult = await parser.parse(fileBuffer);

    // Detect diagram type
    const detector = new DiagramTypeDetector();
    const detection = await detector.detect(parseResult.fileStructure);

    // Route B: If embedded images detected, try Vision AI OCR
    if (detection.route === 'vision_ai' || detection.route === 'hybrid') {
      try {
        const visionAnalyzer = new VisionDiagramAnalyzer();
        const images = await visionAnalyzer.extractEmbeddedImages(parseResult.fileStructure);

        for (const image of images) {
          // Skip non-raster images (EMF/WMF are vector formats)
          if (image.mimeType.includes('emf') || image.mimeType.includes('wmf')) continue;

          const visionResult = await visionAnalyzer.analyzeImage(image.base64, image.mimeType);
          if (visionResult.texts.length > 0) {
            parseResult.texts.push(...visionResult.texts);
          }
        }
      } catch (error) {
        console.warn('[DocTranslation] Vision AI fallback failed:', error);
        // Continue with XML-only texts if Vision AI fails
      }
    }

    // Detect source language
    const batcher = new TranslationBatcher();
    const detectedLanguage = batcher.detectSourceLanguage(parseResult.texts);

    // Auto-detect domain for glossary
    const detectedDomain = GlossaryManager.detectDomain(parseResult.texts.map((t) => t.text));

    // Store job state
    jobs.set(jobId, {
      detectedLanguage,
      jobId,
      parseResult,
      progress: 0,
      route: detection.route,
      status: 'extracting',
    });

    return { detectedDomain, detectedLanguage, detection, jobId, parseResult };
  },

  /**
   * Get job status.
   */
  getJob(jobId: string): TranslationJob | undefined {
    return jobs.get(jobId);
  },

  /**
   * Step 2: Translate extracted texts.
   */
  async translate(jobId: string, options: TranslationOptions): Promise<Translation[]> {
    const job = jobs.get(jobId);
    if (!job || !job.parseResult) {
      throw new Error(`Job ${jobId} not found or extraction not complete`);
    }

    job.status = 'translating';
    job.progress = 10;

    // Merge glossary: built-in domain glossary + user custom glossary
    const glossaryManager = new GlossaryManager();
    const detectedDomain = GlossaryManager.detectDomain(job.parseResult.texts.map((t) => t.text));
    const mergedGlossary = glossaryManager.getGlossary(
      detectedDomain,
      job.detectedLanguage || 'zh',
      options.targetLang,
      options.glossary,
    );

    const batcher = new TranslationBatcher();
    const translations = await batcher.translateBatch(job.parseResult.texts, {
      ...options,
      glossary: mergedGlossary,
    });

    job.translations = translations;
    job.status = 'translating';
    job.progress = 80;

    return translations;
  },

  /**
   * One-shot: Extract → Translate → Apply in a single function invocation.
   * Avoids the in-memory storage problem on Vercel serverless.
   */
  async translateFile(
    fileBuffer: Buffer,
    targetLang: string,
    options?: { glossary?: Record<string, string>; sourceLang?: string },
  ): Promise<{
    buffer: Buffer;
    stats: { fontAdjustments: number; replacements: number; unchanged: number };
    translations: Translation[];
  }> {
    // Step 1: Parse DOCX
    const parser = new DocxDiagramParser();
    const parseResult = await parser.parse(fileBuffer);

    // Detect diagram type
    const detector = new DiagramTypeDetector();
    const detection = await detector.detect(parseResult.fileStructure);

    // Vision AI for embedded images (if needed)
    if (detection.route === 'vision_ai' || detection.route === 'hybrid') {
      try {
        const visionAnalyzer = new VisionDiagramAnalyzer();
        const images = await visionAnalyzer.extractEmbeddedImages(parseResult.fileStructure);
        for (const image of images) {
          if (image.mimeType.includes('emf') || image.mimeType.includes('wmf')) continue;
          const visionResult = await visionAnalyzer.analyzeImage(image.base64, image.mimeType);
          if (visionResult.texts.length > 0) {
            parseResult.texts.push(...visionResult.texts);
          }
        }
      } catch (error) {
        console.warn('[DocTranslation] Vision AI fallback failed:', error);
      }
    }

    // Step 2: Translate with glossary
    const batcher = new TranslationBatcher();
    const detectedLanguage = options?.sourceLang || batcher.detectSourceLanguage(parseResult.texts);

    const glossaryManager = new GlossaryManager();
    const detectedDomain = GlossaryManager.detectDomain(parseResult.texts.map((t) => t.text));
    const mergedGlossary = glossaryManager.getGlossary(
      detectedDomain,
      detectedLanguage,
      targetLang,
      options?.glossary,
    );

    const translations = await batcher.translateBatch(parseResult.texts, {
      glossary: mergedGlossary,
      sourceLang: detectedLanguage,
      targetLang,
    });

    // Step 3: Write back to DOCX
    const writer = new DocxDiagramWriter();
    const buffer = await writer.apply(parseResult, translations);
    const stats = DocxDiagramWriter.getStats(translations, translations.length);

    return { buffer, stats, translations };
  },
};

// Re-export types for convenience

export {
  type ExtractedText,
  type ParseResult,
  type Translation,
  type TranslationJob,
  type TranslationOptions,
} from './types';
