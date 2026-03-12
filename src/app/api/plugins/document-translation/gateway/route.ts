import { NextRequest, NextResponse } from 'next/server';

import { DocumentTranslationService } from '@/services/document-translation';

// Allow longer execution for file processing + AI translation
export const maxDuration = 120;

/**
 * Document Translation Plugin — Gateway (One-Shot)
 *
 * Simplified single-action gateway. The AI calls this with:
 * - fileUrl: URL of the uploaded .docx file
 * - targetLang: target language for translation
 *
 * Returns translated text + download instructions.
 * Stateless — no in-memory job storage needed.
 */

interface PluginRequest {
  fileUrl?: string;
  glossary?: Record<string, string>;
  sourceLang?: string;
  targetLang?: string;
}

/**
 * Download a file from URL and return as Buffer.
 */
async function downloadFile(fileUrl: string, request: NextRequest): Promise<Buffer> {
  if (fileUrl.startsWith('data:')) {
    const base64Data = fileUrl.split(',')[1];
    if (!base64Data) throw new Error('Invalid base64 data URL');
    return Buffer.from(base64Data, 'base64');
  }

  const absoluteUrl = fileUrl.startsWith('http')
    ? fileUrl
    : `${request.headers.get('x-forwarded-proto') || 'https'}://${request.headers.get('host')}${fileUrl}`;

  const response = await fetch(absoluteUrl);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PluginRequest;
    const { fileUrl, glossary, sourceLang, targetLang = 'vi' } = body;

    if (!fileUrl) {
      return NextResponse.json(
        { error: 'fileUrl is required. Provide the URL of the uploaded .docx file.' },
        { status: 400 },
      );
    }

    // Step 1: Download the file
    console.log(`[DocTranslation/gateway] Downloading file: ${fileUrl.slice(0, 100)}...`);
    const fileBuffer = await downloadFile(fileUrl, request);

    // Validate file size
    const MAX_SIZE = 50 * 1024 * 1024;
    if (fileBuffer.length > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 50MB.' }, { status: 400 });
    }

    console.log(
      `[DocTranslation/gateway] File downloaded: ${fileBuffer.length} bytes, translating to ${targetLang}...`,
    );

    // Step 2: One-shot translate (extract → translate → apply)
    const result = await DocumentTranslationService.translateFile(fileBuffer, targetLang, {
      glossary,
      sourceLang,
    });

    console.log(
      `[DocTranslation/gateway] Translation complete: ${result.translations.length} items, ${result.stats.replacements} replacements`,
    );

    // Step 3: Return results with base64 file data

    return NextResponse.json({
      downloadInstructions:
        'The translated file has been generated. Ask the user to use the Download button below, or copy the base64 data to create the file.',
      fileBase64: result.buffer.toString('base64'),
      fileName: `translated_${targetLang}.docx`,
      message: `Successfully translated ${result.translations.length} text elements to ${targetLang}. ${result.stats.replacements} replacements applied. Document layout preserved 100%.`,
      sampleTranslations: result.translations.slice(0, 15).map((t) => ({
        original: t.original,
        translated: t.translated,
      })),
      stats: result.stats,
      totalTranslations: result.translations.length,
    });
  } catch (error) {
    console.error('[DocTranslation/gateway] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Document translation failed' },
      { status: 500 },
    );
  }
}
