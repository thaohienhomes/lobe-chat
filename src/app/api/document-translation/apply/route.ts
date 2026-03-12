/**
 * POST /api/document-translation/apply
 *
 * Apply translations back to the DOCX file and return the translated document.
 * Must be called after /translate with a valid jobId.
 *
 * Request: JSON { jobId, translations?, options? }
 * Response: Binary .docx file download
 */
import { NextRequest, NextResponse } from 'next/server';

import { DocumentTranslationService } from '@/services/document-translation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, translations } = body;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId. Please call /extract and /translate first.' },
        { status: 400 },
      );
    }

    // Check job exists
    const job = DocumentTranslationService.getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { error: `Job ${jobId} not found. It may have expired. Please start over.` },
        { status: 404 },
      );
    }

    // Apply translations to DOCX
    const result = await DocumentTranslationService.apply(
      jobId,
      translations, // Optional user edits
    );

    // Return as downloadable .docx file
    const fileName = `translated_${Date.now()}.docx`;

    return new NextResponse(new Uint8Array(result.buffer), {
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(result.buffer.length),
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      status: 200,
    });
  } catch (error) {
    console.error('[DocTranslation/apply] Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to apply translations',
      },
      { status: 500 },
    );
  }
}
