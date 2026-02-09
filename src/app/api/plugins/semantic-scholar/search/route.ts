import { NextRequest, NextResponse } from 'next/server';

/**
 * Semantic Scholar Search API
 * Uses Semantic Scholar API to search for academic papers
 * https://api.semanticscholar.org/graph/v1/paper/search
 */

interface Author {
  authorId?: string;
  name: string;
}

interface ExternalIds {
  ArXiv?: string;
  DOI?: string;
}

interface SemanticScholarPaper {
  abstract?: string;
  authors: Author[];
  citationCount?: number;
  externalIds?: ExternalIds;
  fieldsOfStudy?: string[];
  paperId: string;
  referenceCount?: number;
  title: string;
  url?: string;
  venue?: string;
  year?: number;
}

interface SearchParams {
  fieldsOfStudy?: string[];
  maxResults?: number;
  query: string;
  year?: string;
}

const S2_API_URL = 'https://api.semanticscholar.org/graph/v1/paper/search';

// ---------------------------------------------------------------------------
// Retry helper — exponential backoff for Semantic Scholar rate limits (1 req/s)
// Retries up to 3 times with delays: 1s → 2s → 4s
// ---------------------------------------------------------------------------
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1 second — matches S2's 1 req/s limit

async function fetchWithRetry(
  url: string,
  options: { headers?: Record<string, string> },
  retries = MAX_RETRIES,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options);

    if (response.status !== 429 || attempt === retries) {
      return response;
    }

    // Exponential backoff: 1s, 2s, 4s + small jitter to avoid thundering herd
    const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 200;
    console.warn(
      `[Semantic Scholar] Rate limited (429). Retry ${attempt + 1}/${retries} in ${Math.round(delay)}ms`,
    );
    await new Promise<void>((resolve) => {
      setTimeout(() => { resolve(); }, delay);
    });
  }

  // Unreachable, but TypeScript needs it
  throw new Error('fetchWithRetry: exceeded max retries');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchParams;
    const { query, maxResults = 10, year, fieldsOfStudy } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Limit maxResults
    const limit = Math.min(Math.max(1, maxResults), 50);

    // Build URL parameters
    const params = new URLSearchParams({
      fields:
        'title,url,abstract,authors,year,venue,externalIds,citationCount,referenceCount,fieldsOfStudy',
      limit: String(limit),
      query: query,
    });

    if (year) params.append('year', year);
    if (fieldsOfStudy && fieldsOfStudy.length > 0) {
      params.append('fieldsOfStudy', fieldsOfStudy.join(','));
    }

    // Use API key if available (free key from semanticscholar.org/product/api)
    // With key: 1 request/second (~300 req/5min). Without key: 100 req/5min.
    const headers: Record<string, string> = {};
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const response = await fetchWithRetry(`${S2_API_URL}?${params.toString()}`, { headers });

    if (response.status === 429) {
      // Exhausted all retries — let user know gracefully
      return NextResponse.json(
        { error: 'Semantic Scholar is busy. Please wait a moment and try again.' },
        { status: 429 },
      );
    }

    if (!response.ok) {
      throw new Error(`Semantic Scholar API error: ${response.statusText}`);
    }

    const data = await response.json();
    const papers = (data.data || []) as SemanticScholarPaper[];

    if (papers.length === 0) {
      return NextResponse.json({
        message: `No results found for "${query}"`,
        papers: [],
        query,
        totalResults: 0,
      });
    }

    // Map to a cleaner structure if needed, or return as is
    const results = papers.map((paper) => ({
      abstract: paper.abstract
        ? paper.abstract.slice(0, 800) + (paper.abstract.length > 800 ? '...' : '')
        : '',
      authors: paper.authors.map((a) => a.name).slice(0, 5),
      citationCount: paper.citationCount,
      doi: paper.externalIds?.DOI,
      paperId: paper.paperId,
      title: paper.title,
      url:
        paper.url ||
        (paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : undefined),
      venue: paper.venue,
      year: paper.year,
    }));

    return NextResponse.json({
      papers: results,
      query,
      totalResults: data.total || results.length,
    });
  } catch (error) {
    console.error('Semantic Scholar search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Semantic Scholar. Please try again later.' },
      { status: 500 },
    );
  }
}

// Support GET for simple testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      {
        error: 'Query parameter is required',
        usage: '/api/plugins/semantic-scholar/search?query=transformer+architecture',
      },
      { status: 400 },
    );
  }

  const limit = Number(searchParams.get('maxResults')) || 10;
  const year = searchParams.get('year') || undefined;

  const params = new URLSearchParams({
    fields:
      'title,url,abstract,authors,year,venue,externalIds,citationCount,referenceCount,fieldsOfStudy',
    limit: String(limit),
    query: query,
  });
  if (year) params.append('year', year);

  const headers: Record<string, string> = {};
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  const response = await fetchWithRetry(`${S2_API_URL}?${params.toString()}`, { headers });
  const data = await response.json();

  return NextResponse.json({
    papers: data.data || [],
    query,
    totalResults: data.total || 0,
  });
}
