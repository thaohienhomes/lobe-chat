/**
 * POST /api/document-translation/translate
 *
 * Translate extracted texts using AI model.
 * Must be called after /extract with a valid jobId.
 *
 * Request: JSON { jobId, targetLang, modelId?, glossary? }
 * Response: JSON with translations array
 */
import { NextRequest, NextResponse } from 'next/server';

import { DocumentTranslationService } from '@/services/document-translation';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, targetLang, modelId, glossary } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId. Please call /extract first.' },
        { status: 400 },
      );
    }

    if (!targetLang) {
      return NextResponse.json(
        { error: 'Missing targetLang. Please specify target language (e.g., "vi", "en").' },
        { status: 400 },
      );
    }

    // Check job exists
    const job = DocumentTranslationService.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: `Job ${jobId} not found. It may have expired. Please call /extract again.` },
        { status: 404 },
      );
    }

    // Run translation
    const translations = await DocumentTranslationService.translate(jobId, {
      glossary,
      modelId,
      targetLang,
    });

    return NextResponse.json({
      jobId,
      progress: 100,
      status: 'complete',
      translations: translations.map((t) => ({
        confidence: t.confidence,
        id: t.id,
        original: t.original,
        translated: t.translated,
      })),
    });
  } catch (error) {
    console.error('[DocTranslation/translate] Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to translate document',
      },
      { status: 500 },
    );
  }
}
