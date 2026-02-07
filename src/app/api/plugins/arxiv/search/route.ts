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
  doi?: string;
  pdfUrl: string;
  published: string;
  title: string;
  updated: string;
}

interface SearchParams {
  arxivId?: string; // Optional: lookup by specific ID
  category?: string;
  maxResults?: number;
  query?: string;
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

      // Extract DOI if available
      const doiMatch = entryXml.match(/<arxiv:doi[^>]*>([^<]+)<\/arxiv:doi>/);
      const doi = doiMatch ? doiMatch[1] : undefined;

      // Extract PDF link
      const pdfMatch = entryXml.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"[^>]*\/>/);
      const pdfUrl = pdfMatch ? pdfMatch[1] : `https://arxiv.org/pdf/${arxivId}.pdf`;

      papers.push({
        abstract: abstract.slice(0, 1000) + (abstract.length > 1000 ? '...' : ''),
        arxivId,
        authors: authors.slice(0, 5),
        categories,
        doi,
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
    const { query, maxResults = 10, sortBy = 'relevance', category, arxivId } = body;

    // Build API URL
    const params = new URLSearchParams();

    if (arxivId) {
      // Direct lookup by ID
      params.append('id_list', arxivId);
    } else if (query) {
      // General search
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

      params.append('search_query', searchQuery);
      params.append('sortBy', sortByMap[sortBy] || 'relevance');
      params.append('sortOrder', 'descending');
    } else {
      return NextResponse.json({ error: 'Either query or arxivId is required' }, { status: 400 });
    }

    // Limit maxResults
    const limitedMaxResults = Math.min(Math.max(1, maxResults), 50);
    params.append('max_results', String(limitedMaxResults));

    const response = await fetch(`${ARXIV_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`ArXiv API error: ${response.statusText}`);
    }

    const xmlText = await response.text();
    const papers = parseArxivResponse(xmlText);

    if (papers.length === 0) {
      return NextResponse.json({
        message: arxivId
          ? `Paper with ID "${arxivId}" not found`
          : `No results found for "${query}"`,
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
    console.error('ArXiv plugin error:', error);
    return NextResponse.json(
      { error: 'Failed to access arXiv. Please try again later.' },
      { status: 500 },
    );
  }
}

// Support GET for simple testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const id = searchParams.get('id');

  if (!query && !id) {
    return NextResponse.json(
      {
        error: 'Either query or id parameter is required',
        usage:
          '/api/plugins/arxiv/search?query=machine+learning OR /api/plugins/arxiv/search?id=2401.04088',
      },
      { status: 400 },
    );
  }

  const params = new URLSearchParams();
  if (id) {
    params.append('id_list', id);
  } else if (query) {
    const category = searchParams.get('category');
    const searchQuery = category ? `cat:${category} AND (${query})` : query;
    const sortBy = searchParams.get('sortBy') || 'relevance';

    params.append('search_query', searchQuery);
    params.append('sortBy', sortBy);
    params.append('sortOrder', 'descending');
  }

  const maxResults = Number(searchParams.get('maxResults')) || 10;
  params.append('max_results', String(maxResults));

  try {
    const response = await fetch(`${ARXIV_API_URL}?${params.toString()}`);
    const xmlText = await response.text();
    const papers = parseArxivResponse(xmlText);

    return NextResponse.json({
      papers,
      query: query || id,
      totalResults: papers.length,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
