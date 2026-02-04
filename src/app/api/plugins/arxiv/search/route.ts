import { NextRequest, NextResponse } from 'next/server';

/**
 * ArXiv Search API
 * Uses arXiv API to search for preprint papers
 * https://info.arxiv.org/help/api/index.html
 */

interface ArxivPaper {
  abstract: string;
  arxivId: string;
  authors: string[];
  categories: string[];
  pdfUrl: string;
  published: string;
  title: string;
  updated: string;
}

interface SearchParams {
  category?: string;
  maxResults?: number;
  query: string;
  sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
}

const ARXIV_API_URL = 'http://export.arxiv.org/api/query';

// Helper to extract text from XML tag
function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\S\\s]*?)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

// Parse arXiv Atom XML response
function parseArxivResponse(xml: string): ArxivPaper[] {
  const papers: ArxivPaper[] = [];

  // Extract each entry
  const entryMatches = xml.match(/<entry>[\S\s]*?<\/entry>/g) || [];

  for (const entryXml of entryMatches) {
    try {
      // Extract arXiv ID from the id URL
      const idMatch = entryXml.match(/<id>http:\/\/arxiv\.org\/abs\/([^<]+)<\/id>/);
      const arxivId = idMatch ? idMatch[1] : '';

      const title = extractTag(entryXml, 'title').replaceAll(/\s+/g, ' ');
      const abstract = extractTag(entryXml, 'summary').replaceAll(/\s+/g, ' ');
      const published = extractTag(entryXml, 'published');
      const updated = extractTag(entryXml, 'updated');

      // Extract authors
      const authorMatches = entryXml.match(/<author>[\S\s]*?<\/author>/g) || [];
      const authors = authorMatches
        .map((authorXml) => extractTag(authorXml, 'name'))
        .filter(Boolean);

      // Extract categories
      const categoryMatches = entryXml.match(/<category[^>]*term="([^"]+)"[^>]*\/>/g) || [];
      const categories = categoryMatches
        .map((cat) => {
          const termMatch = cat.match(/term="([^"]+)"/);
          return termMatch ? termMatch[1] : '';
        })
        .filter(Boolean);

      // Extract PDF link
      const pdfMatch = entryXml.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"[^>]*\/>/);
      const pdfUrl = pdfMatch ? pdfMatch[1] : `https://arxiv.org/pdf/${arxivId}.pdf`;

      papers.push({
        abstract: abstract.slice(0, 500) + (abstract.length > 500 ? '...' : ''),
        arxivId,
        authors: authors.slice(0, 5),
        categories,
        pdfUrl,
        published: published.split('T')[0],
        title,
        updated: updated.split('T')[0],
      });
    } catch {
      // Skip malformed entries
      continue;
    }
  }

  return papers;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchParams;
    const { query, maxResults = 10, sortBy = 'relevance', category } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Build search query
    let searchQuery = query;
    if (category) {
      searchQuery = `cat:${category} AND (${query})`;
    }

    // Map sortBy to arXiv API parameter
    const sortByMap: Record<string, string> = {
      lastUpdatedDate: 'lastUpdatedDate',
      relevance: 'relevance',
      submittedDate: 'submittedDate',
    };

    // Limit maxResults
    const limitedMaxResults = Math.min(Math.max(1, maxResults), 50);

    // Build API URL
    const params = new URLSearchParams({
      max_results: String(limitedMaxResults),
      search_query: searchQuery,
      sortBy: sortByMap[sortBy] || 'relevance',
      sortOrder: 'descending',
    });

    const response = await fetch(`${ARXIV_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`ArXiv API error: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const papers = parseArxivResponse(xmlText);

    if (papers.length === 0) {
      return NextResponse.json({
        message: `No results found for "${query}"`,
        papers: [],
        query,
        totalResults: 0,
      });
    }

    return NextResponse.json({
      papers,
      query,
      totalResults: papers.length,
    });
  } catch (error) {
    console.error('ArXiv search error:', error);
    return NextResponse.json(
      { error: 'Failed to search arXiv. Please try again later.' },
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
        usage: '/api/plugins/arxiv/search?query=machine+learning',
      },
      { status: 400 },
    );
  }

  const body: SearchParams = {
    category: searchParams.get('category') || undefined,
    maxResults: Number(searchParams.get('maxResults')) || 10,
    query,
    sortBy: (searchParams.get('sortBy') as SearchParams['sortBy']) || 'relevance',
  };

  // Reuse POST logic
  const searchQuery = body.category ? `cat:${body.category} AND (${body.query})` : body.query;
  const params = new URLSearchParams({
    max_results: String(body.maxResults),
    search_query: searchQuery,
    sortBy: body.sortBy || 'relevance',
    sortOrder: 'descending',
  });

  const response = await fetch(`${ARXIV_API_URL}?${params.toString()}`);
  const xmlText = await response.text();
  const papers = parseArxivResponse(xmlText);

  return NextResponse.json({
    papers,
    query: body.query,
    totalResults: papers.length,
  });
}
