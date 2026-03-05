import { NextResponse } from 'next/server';

/**
 * Semantic Scholar Paper References API proxy
 *
 * Fetches references for a given paper by its Semantic Scholar paperId.
 * GET /api/research/semantic-scholar/references?paperId=...&limit=10
 */

export const runtime = 'edge';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 20);

    if (!paperId) {
        return NextResponse.json({ error: 'Missing paperId parameter' }, { status: 400 });
    }

    try {
        const url = `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(paperId)}/references?fields=title,authors,year,citationCount,url&limit=${limit}`;

        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'PhoChat-Research/1.0',
            },
            signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) {
            return NextResponse.json({ error: `S2 API error: ${res.status}` }, { status: res.status });
        }

        const data = await res.json() as { data?: { citedPaper: { authors?: { name: string }[]; citationCount?: number; paperId: string; title: string; url?: string; year?: number } }[] };
        const references = (data.data || [])
            .filter((r) => r.citedPaper?.title)
            .map((r) => ({
                authors: (r.citedPaper.authors || []).map((a) => a.name).join(', '),
                citationCount: r.citedPaper.citationCount || 0,
                paperId: r.citedPaper.paperId,
                title: r.citedPaper.title,
                url: r.citedPaper.url || `https://www.semanticscholar.org/paper/${r.citedPaper.paperId}`,
                year: r.citedPaper.year || null,
            }));

        return NextResponse.json({ references });
    } catch (error: any) {
        return NextResponse.json(
            { error: `Failed to fetch references: ${error.message}` },
            { status: 500 },
        );
    }
}
