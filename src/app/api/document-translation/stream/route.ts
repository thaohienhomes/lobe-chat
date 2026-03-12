/**
 * Streaming Translation Support
 *
 * Provides a streaming endpoint for real-time translation feedback.
 * Sends Server-Sent Events (SSE) to the client as each text element
 * is translated, enabling real-time UI updates in the Artifact.
 *
 * Usage: POST /api/document-translation/stream
 */
import { NextRequest } from 'next/server';

import { DocumentTranslationService } from '@/services/document-translation';

// ─── SSE Helpers ────────────────────────────────────────────────────

function sseEvent(event: string, data: any): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// ─── Route Handler ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { jobId, targetLang, glossary } = body;

  if (!jobId || !targetLang) {
    return new Response(JSON.stringify({ error: 'Missing jobId or targetLang' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const job = DocumentTranslationService.getJob(jobId);
  if (!job || !job.parseResult) {
    return new Response(JSON.stringify({ error: `Job ${jobId} not found` }), {
      headers: { 'Content-Type': 'application/json' },
      status: 404,
    });
  }

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial status
        controller.enqueue(
          encoder.encode(
            sseEvent('status', {
              progress: 10,
              status: 'translating',
              total: job.parseResult!.texts.length,
            }),
          ),
        );

        // Translate in batches, streaming progress
        const translations = await DocumentTranslationService.translate(jobId, {
          glossary,
          targetLang,
        });

        // Send each translation as it's available
        for (let i = 0; i < translations.length; i++) {
          controller.enqueue(
            encoder.encode(
              sseEvent('translation', {
                index: i,
                progress: Math.round(((i + 1) / translations.length) * 80) + 10,
                total: translations.length,
                translation: {
                  confidence: translations[i].confidence,
                  id: translations[i].id,
                  original: translations[i].original,
                  translated: translations[i].translated,
                },
              }),
            ),
          );
        }

        // Send completion
        controller.enqueue(
          encoder.encode(
            sseEvent('complete', {
              progress: 100,
              status: 'complete',
              totalTranslations: translations.length,
            }),
          ),
        );
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            sseEvent('error', {
              message: error instanceof Error ? error.message : 'Translation failed',
            }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Content-Type': 'text/event-stream',
    },
  });
}
