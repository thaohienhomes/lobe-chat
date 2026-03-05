import { NextResponse } from 'next/server';

/**
 * Semantic Scholar API proxy
 *
 * Searches the Semantic Scholar Academic Graph API (free, no key needed for basic use).
 * Returns papers with title, authors, year, abstract, citation count, and URL.
 *
 * GET /api/research/semantic-scholar?q=...&limit=20
 */

export const runtime = 'edge';

interface S2Paper {
    abstract?: string;
    authors?: { name: string }[];
    citationCount?: number;
    externalIds?: { DOI?: string; PubMed?: string };
    paperId: string;
    title: string;
    url?: string;
    year?: number;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 50);

    if (!query) {
        return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
    }

    try {
        const url = new URL('https://api.semanticscholar.org/graph/v1/paper/search');
        url.searchParams.set('query', query);
        url.searchParams.set('limit', String(limit));
        url.searchParams.set('fields', 'title,authors,year,abstract,citationCount,url,externalIds');

        const res = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'PhoChat-Research/1.0',
            },
            signal: AbortSignal.timeout(15_000),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => 'Unknown error');
            return NextResponse.json(
                { error: `Semantic Scholar API error: ${res.status} ${text}` },
                { status: res.status },
            );
        }

        const data = await res.json() as { data?: S2Paper[]; total?: number };
        const papers = (data.data || []).map((p) => ({
            abstract: p.abstract || '',
            authors: (p.authors || []).map((a) => a.name).join(', '),
            citationCount: p.citationCount || 0,
            doi: p.externalIds?.DOI || '',
            paperId: p.paperId,
            pmid: p.externalIds?.PubMed || '',
            source: 'semantic_scholar' as const,
            title: p.title,
            url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
            year: p.year ? String(p.year) : '',
        }));

        return NextResponse.json({ papers, total: data.total || papers.length });
    } catch (error: any) {
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return NextResponse.json({ error: 'Semantic Scholar API timeout' }, { status: 504 });
        }
        return NextResponse.json(
            { error: `Failed to search: ${error.message}` },
            { status: 500 },
        );
    }
}
