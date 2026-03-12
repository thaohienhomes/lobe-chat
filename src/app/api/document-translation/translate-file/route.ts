/**
 * POST /api/document-translation/translate-file
 *
 * One-shot endpoint: Extract → Translate → Apply in a single call.
 * Accepts multipart form data with 'file' + 'targetLang' fields.
 * Returns the translated .docx file as download.
 *
 * Query params:
 * - format=json → returns base64 data + translation summary (for artifacts)
 * - format=file → returns the .docx file directly (default)
 */
import { NextRequest, NextResponse } from 'next/server';

import { DocumentTranslationService } from '@/services/document-translation';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let fileBuffer: Buffer;
    let targetLang = 'vi';
    let sourceLang: string | undefined;
    let returnFormat = 'file';

    if (contentType.includes('multipart/form-data')) {
      // Multipart form upload
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided. Upload a .docx file with field name "file".' },
          { status: 400 },
        );
      }

      targetLang = (formData.get('targetLang') as string) || 'vi';
      sourceLang = (formData.get('sourceLang') as string) || undefined;
      returnFormat = (formData.get('format') as string) || 'file';

      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      // JSON body with base64 file
      const body = await request.json();
      if (!body.fileBase64) {
        return NextResponse.json(
          { error: 'Provide either multipart form with "file" or JSON with "fileBase64".' },
          { status: 400 },
        );
      }
      fileBuffer = Buffer.from(body.fileBase64, 'base64');
      targetLang = body.targetLang || 'vi';
      sourceLang = body.sourceLang;
      returnFormat = body.format || 'json';
    }

    // Validate file size (50MB max)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (fileBuffer.length > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 50MB.' }, { status: 400 });
    }

    console.log(
      `[DocTranslation] translate-file: ${fileBuffer.length} bytes, target=${targetLang}`,
    );

    // One-shot translate
    const result = await DocumentTranslationService.translateFile(fileBuffer, targetLang, {
      sourceLang,
    });

    console.log(
      `[DocTranslation] Done: ${result.translations.length} translations, ${result.stats.replacements} replacements`,
    );

    if (returnFormat === 'json') {
      // Return JSON with base64 file + translation summary (for artifacts)
      return NextResponse.json({
        fileBase64: result.buffer.toString('base64'),
        stats: result.stats,
        totalTranslations: result.translations.length,
        translations: result.translations.slice(0, 100).map((t) => ({
          id: t.id,
          original: t.original,
          translated: t.translated,
        })),
      });
    }

    // Return .docx file directly
    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        'Content-Disposition': `attachment; filename="translated_${targetLang}.docx"`,
        'Content-Length': String(result.buffer.length),
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    });
  } catch (error) {
    console.error('[DocTranslation/translate-file] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Translation failed',
      },
      { status: 500 },
    );
  }
}
