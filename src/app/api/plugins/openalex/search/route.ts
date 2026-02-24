import { NextRequest, NextResponse } from 'next/server';

/**
 * OpenAlex Search API
 * Uses OpenAlex API (free, no auth, polite pool with email)
 * https://docs.openalex.org/api-entities/works
 */

interface OpenAlexWork {
    authors: { hIndex?: number; institution?: string; name: string }[];
    citedByCount: number;
    doi?: string;
    doiUrl?: string;
    firstAuthor: string;
    isOpenAccess: boolean;
    journal?: string;
    openAccessUrl?: string;
    publicationDate: string;
    title: string;
    type: string;
    year: number;
}

const OA_API_BASE = 'https://api.openalex.org/works';
const OA_EMAIL = 'support@pho.chat'; // for polite pool (faster rate limits)

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            query,
            maxResults = 5,
            page = 1,
            sortBy = 'relevance_score',
        } = body;

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'query parameter is required' },
                { status: 400 },
            );
        }

        const perPage = Math.min(Math.max(1, maxResults), 25);

        // Build URL
        const params = new URLSearchParams();
        params.set('search', query);
        params.set('per_page', String(perPage));
        params.set('page', String(Math.max(1, page)));
        params.set('mailto', OA_EMAIL);

        // Sort
        if (sortBy === 'cited_by_count') {
            params.set('sort', 'cited_by_count:desc');
        } else if (sortBy === 'publication_date') {
            params.set('sort', 'publication_date:desc');
        }
        // relevance_score is default

        // Select fields to reduce payload
        params.set('select', [
            'id',
            'title',
            'doi',
            'publication_date',
            'publication_year',
            'type',
            'cited_by_count',
            'open_access',
            'authorships',
            'primary_location',
        ].join(','));

        const url = `${OA_API_BASE}?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`OpenAlex API error: ${response.statusText}`);
        }

        const data = await response.json();
        const works = data.results || [];

        const articles: OpenAlexWork[] = works.map((work: any) => {
            // Authors (top 5)
            const authors = (work.authorships || []).slice(0, 5).map((a: any) => ({
                hIndex: a.author?.summary_stats?.h_index,
                institution: a.institutions?.[0]?.display_name,
                name: a.author?.display_name || 'Unknown',
            }));

            // Open access info
            const oa = work.open_access || {};
            const primaryLoc = work.primary_location || {};

            // DOI
            const doi = work.doi?.replace('https://doi.org/', '') || undefined;

            return {
                authors,
                citedByCount: work.cited_by_count || 0,
                doi,
                doiUrl: doi ? `https://doi.org/${doi}` : undefined,
                firstAuthor: authors[0]?.name || 'Unknown',
                isOpenAccess: oa.is_oa || false,
                journal: primaryLoc.source?.display_name,
                openAccessUrl: oa.oa_url || undefined,
                publicationDate: work.publication_date || '',
                title: work.title || 'Untitled',
                type: work.type || 'article',
                year: work.publication_year || 0,
            };
        });

        const totalResults = data.meta?.count || 0;
        const totalPages = Math.ceil(totalResults / perPage);

        return NextResponse.json({
            articles,
            pagination: {
                currentPage: page,
                hasMore: page < totalPages,
                perPage,
                totalPages,
                totalResults,
            },
            query,
        });
    } catch (error) {
        console.error('OpenAlex search error:', error);
        return NextResponse.json(
            { error: 'Failed to search OpenAlex. Please try again.' },
            { status: 500 },
        );
    }
}

// GET for testing
export async function GET(request: NextRequest) {
    const sp = request.nextUrl.searchParams;
    const query = sp.get('query') || sp.get('q');

    if (!query) {
        return NextResponse.json({
            error: 'query parameter required',
            usage: '/api/plugins/openalex/search?query=metformin+diabetes&maxResults=5&sortBy=cited_by_count',
        }, { status: 400 });
    }

    const body = {
        maxResults: Number(sp.get('maxResults')) || 5,
        page: Number(sp.get('page')) || 1,
        query,
        sortBy: sp.get('sortBy') || 'relevance_score',
    };

    const fakeReq = new Request('http://localhost', {
        body: JSON.stringify(body),
        method: 'POST',
    });
    return POST(fakeReq as unknown as NextRequest);
}
