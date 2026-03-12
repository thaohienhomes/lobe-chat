import { NextRequest, NextResponse } from 'next/server';

import { DocumentTranslationService } from '@/services/document-translation';

/**
 * Document Translation Plugin - Gateway
 *
 * Single endpoint that handles all 3 tool actions:
 * - extractDocumentText: Download file → extract text
 * - translateDocumentText: Translate with AI + glossary
 * - applyDocumentTranslation: Write back → return download URL
 *
 * The LobeChat plugin system calls this with the tool name in the request.
 */

interface PluginRequest {
  fileUrl?: string;
  glossary?: Record<string, string>;
  jobId?: string;
  sourceLang?: string;
  targetLang?: string;
  translations?: Array<{ id: string; translated: string }>;
}

// ─── Handler functions (defined before POST to satisfy no-use-before-define) ───

/**
 * Extract text from uploaded .docx file
 */
async function handleExtract(body: PluginRequest, request: NextRequest) {
  const { fileUrl } = body;
  if (!fileUrl) {
    return NextResponse.json({ error: 'fileUrl is required' }, { status: 400 });
  }

  let fileBuffer: Buffer;

  if (fileUrl.startsWith('data:')) {
    // Base64 data URL
    const base64Data = fileUrl.split(',')[1];
    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid base64 data URL' }, { status: 400 });
    }
    fileBuffer = Buffer.from(base64Data, 'base64');
  } else {
    // HTTP URL — download the file
    try {
      const absoluteUrl = fileUrl.startsWith('http')
        ? fileUrl
        : `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}${fileUrl}`;

      const response = await fetch(absoluteUrl);
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to download file: ${response.statusText}` },
          { status: 400 },
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } catch (downloadError) {
      return NextResponse.json(
        { error: `Failed to download file: ${(downloadError as Error).message}` },
        { status: 400 },
      );
    }
  }

  // Validate file size
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  if (fileBuffer.length > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
  }

  const result = await DocumentTranslationService.extract(fileBuffer);

  return NextResponse.json({
    detectedDomain: result.detectedDomain,
    detectedLanguage: result.detectedLanguage,
    diagramType: result.parseResult.diagramType,
    jobId: result.jobId,
    route: result.detection.route,
    routeDetails: result.detection.details,
    stats: {
      estimatedTokens: Math.ceil(
        result.parseResult.texts.reduce((sum, t) => sum + t.text.length, 0) * 1.5,
      ),
      totalElements: result.parseResult.texts.length,
      ...result.parseResult.stats,
    },
    texts: result.parseResult.texts.slice(0, 50).map((t) => ({
      id: t.id,
      text: t.text,
      type: t.type,
    })),
    totalTexts: result.parseResult.texts.length,
  });
}

/**
 * Translate extracted texts
 */
async function handleTranslate(body: PluginRequest) {
  const { glossary, jobId, sourceLang, targetLang } = body;

  if (!jobId || !targetLang) {
    return NextResponse.json({ error: 'jobId and targetLang are required' }, { status: 400 });
  }

  const translations = await DocumentTranslationService.translate(jobId, {
    glossary,
    sourceLang: sourceLang || 'auto',
    targetLang,
  });

  return NextResponse.json({
    jobId,
    sampleTranslations: translations.slice(0, 20).map((t) => ({
      id: t.id,
      original: t.original,
      translated: t.translated,
    })),
    targetLang,
    totalTranslated: translations.length,
  });
}

/**
 * Apply translations and return download info
 */
async function handleApply(body: PluginRequest, request: NextRequest) {
  const { jobId, translations: userTranslations } = body;

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  const result = await DocumentTranslationService.apply(jobId, userTranslations);

  const host = request.headers.get('host') || 'localhost:3010';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const downloadUrl = `${protocol}://${host}/api/document-translation/apply`;

  return NextResponse.json({
    downloadUrl,
    jobId,
    message:
      'Translation applied successfully. The translated document preserves 100% of the original layout.',
    stats: result.stats,
  });
}

// ─── Exported POST handler ──────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PluginRequest;

    // Route to the correct handler based on parameters
    if (body.fileUrl) {
      return handleExtract(body, request);
    } else if (body.jobId && body.targetLang) {
      return handleTranslate(body);
    } else if (body.jobId && !body.targetLang) {
      return handleApply(body, request);
    }

    return NextResponse.json(
      {
        error:
          'Invalid request. Provide either fileUrl (extract), jobId+targetLang (translate), or jobId (apply).',
      },
      { status: 400 },
    );
  } catch (error) {
    console.error('[DocTranslation/gateway] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Document translation failed' },
      { status: 500 },
    );
  }
}
