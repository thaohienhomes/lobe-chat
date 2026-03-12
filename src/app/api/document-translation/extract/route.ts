/**
 * POST /api/document-translation/extract
 *
 * Upload a .docx file and extract all translatable text elements
 * from shapes, textboxes, SmartArt, and paragraphs.
 *
 * Request: multipart/form-data with 'file' field
 * Response: JSON with extracted texts, diagram type, detected language
 */
import { NextRequest, NextResponse } from 'next/server';

import { DocumentTranslationService } from '@/services/document-translation';

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please upload a .docx file.' },
        { status: 400 },
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.docx') && !fileName.endsWith('.doc')) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a .docx or .doc file.' },
        { status: 400 },
      );
    }

    // Validate file size (max 50MB)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB.' }, { status: 400 });
    }

    // Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Extract texts
    const result = await DocumentTranslationService.extract(fileBuffer);

    // Estimate tokens (rough: 1.5 tokens per Chinese character, 1.3 per word)
    const totalChars = result.parseResult.texts.reduce((sum, t) => sum + t.text.length, 0);
    const estimatedTokens = Math.ceil(totalChars * 1.5);

    return NextResponse.json({
      detectedLanguage: result.detectedLanguage,
      diagramType: result.parseResult.diagramType,
      jobId: result.jobId,
      route: result.detection.route,
      routeDetails: result.detection.details,
      stats: {
        estimatedTokens,
        totalElements: result.parseResult.texts.length,
        ...result.parseResult.stats,
      },
      texts: result.parseResult.texts.map((t) => ({
        id: t.id,
        metadata: t.metadata,
        text: t.text,
        type: t.type,
      })),
    });
  } catch (error) {
    console.error('[DocTranslation/extract] Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to extract text from document',
      },
      { status: 500 },
    );
  }
}
