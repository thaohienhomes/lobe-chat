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

    const response = await fetch(`${S2_API_URL}?${params.toString()}`);

    if (response.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
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

  const response = await fetch(`${S2_API_URL}?${params.toString()}`);
  const data = await response.json();

  return NextResponse.json({
    papers: data.data || [],
    query,
    totalResults: data.total || 0,
  });
}
