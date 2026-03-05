import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/pdf/extract
 * Server-side PDF text extraction endpoint.
 * Accepts a PDF file (multipart/form-data) and returns extracted text as JSON.
 *
 * Uses pdf-parse as a reliable server-side fallback.
 * Heavy PDFs are truncated at 50,000 chars to stay within AI context limits.
 */

const MAX_CHARS = 50_000;

// Lazy-import pdf-parse to avoid SSR issues
const parsePdf = async (buffer: Buffer): Promise<string> => {
    try {
        // @ts-ignore — dynamic import for server-only module
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        return data.text?.slice(0, MAX_CHARS) ?? '';
    } catch {
        // Fallback: return empty string so the caller can handle gracefully
        return '';
    }
};

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') ?? '';

        if (contentType.includes('multipart/form-data')) {
            // File upload path
            const formData = await request.formData();
            const file = formData.get('file') as File | null;

            if (!file) {
                return NextResponse.json({ error: 'No file provided' }, { status: 400 });
            }

            if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
                return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
            }

            if (file.size > 20 * 1024 * 1024) {
                return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 413 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const text = await parsePdf(buffer);

            if (!text) {
                return NextResponse.json({
                    charCount: 0,
                    filename: file.name,
                    pageCount: 0,
                    text: '',
                    warning: 'Could not extract text. The PDF may be scanned (image-only) or encrypted.',
                });
            }

            // Basic metadata extraction from text
            const lines = text.split('\n').filter((l) => l.trim().length > 0);
            const firstMeaningfulLine = lines.find((l) => l.trim().length > 10) ?? '';

            return NextResponse.json({
                charCount: text.length,
                filename: file.name,
                preview: text.slice(0, 500),
                text,
                title: firstMeaningfulLine.slice(0, 200),
                truncated: text.length === MAX_CHARS,
                wordCount: text.split(/\s+/).length,
            });
        }

        // URL-based path (fetch PDF from URL)
        if (contentType.includes('application/json')) {
            const { url } = await request.json();
            if (!url) {
                return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
            }

            const response = await fetch(url, {
                headers: { 'User-Agent': 'Pho-Chat-Research/1.0' },
                signal: AbortSignal.timeout(15_000),
            });

            if (!response.ok) {
                return NextResponse.json({ error: `Failed to fetch PDF: ${response.status}` }, { status: 400 });
            }

            const buffer = Buffer.from(await response.arrayBuffer());
            const text = await parsePdf(buffer);

            return NextResponse.json({
                charCount: text.length,
                filename: url.split('/').at(-1) ?? 'document.pdf',
                text: text.slice(0, MAX_CHARS),
                truncated: text.length > MAX_CHARS,
                wordCount: text.split(/\s+/).length,
            });
        }

        return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
    } catch (error: any) {
        console.error('[PDF Extract] Error:', error?.message);
        return NextResponse.json(
            { error: error?.message ?? 'PDF extraction failed' },
            { status: 500 },
        );
    }
}
