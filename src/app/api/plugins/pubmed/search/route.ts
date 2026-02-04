import { NextRequest, NextResponse } from 'next/server';

/**
 * PubMed Search API
 * Uses NCBI E-utilities to search PubMed database
 * https://www.ncbi.nlm.nih.gov/books/NBK25499/
 */

interface PubMedArticle {
  abstract?: string;
  authors: string[];
  doi?: string;
  journal: string;
  pmid: string;
  pubDate: string;
  title: string;
}

interface SearchParams {
  maxResults?: number;
  query: string;
  sortBy?: 'relevance' | 'date';
}

const NCBI_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

// Helper to extract tag content from XML
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// Simple XML parsing for PubMed articles
function parseArticlesFromXml(xml: string): PubMedArticle[] {
  const articles: PubMedArticle[] = [];

  // Extract each PubmedArticle
  const articleMatches = xml.match(/<PubmedArticle>[\S\s]*?<\/PubmedArticle>/g) || [];

  for (const articleXml of articleMatches) {
    try {
      const pmid = extractTag(articleXml, 'PMID') || '';
      const title = extractTag(articleXml, 'ArticleTitle') || 'No title';
      const abstract = extractTag(articleXml, 'AbstractText') || '';
      const journal =
        extractTag(articleXml, 'Title') || extractTag(articleXml, 'ISOAbbreviation') || '';

      // Extract authors
      const authorMatches = articleXml.match(/<Author[\S\s]*?<\/Author>/g) || [];
      const authors = authorMatches
        .map((authorXml) => {
          const lastName = extractTag(authorXml, 'LastName') || '';
          const foreName = extractTag(authorXml, 'ForeName') || '';
          return `${lastName} ${foreName}`.trim();
        })
        .filter(Boolean);

      // Extract publication date
      const pubDateMatch = articleXml.match(/<PubDate>([\S\s]*?)<\/PubDate>/);
      let pubDate = '';
      if (pubDateMatch) {
        const year = extractTag(pubDateMatch[1], 'Year') || '';
        const month = extractTag(pubDateMatch[1], 'Month') || '';
        pubDate = `${year} ${month}`.trim();
      }

      // Extract DOI
      const doiMatch = articleXml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
      const doi = doiMatch ? doiMatch[1] : undefined;

      articles.push({
        abstract: abstract.slice(0, 500) + (abstract.length > 500 ? '...' : ''),
        authors: authors.slice(0, 5),
        doi,
        journal,
        pmid,
        pubDate,
        title,
      });
    } catch {
      // Skip malformed articles
      continue;
    }
  }

  return articles;
}

// Search PubMed and get list of PMIDs
async function searchPubMed(query: string, maxResults: number, sortBy: string): Promise<string[]> {
  const sort = sortBy === 'date' ? 'pub+date' : 'relevance';
  const searchUrl = `${NCBI_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&sort=${sort}&retmode=json`;

  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`PubMed search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.esearchresult?.idlist || [];
}

// Fetch article details by PMIDs
async function fetchArticleDetails(pmids: string[]): Promise<PubMedArticle[]> {
  if (pmids.length === 0) return [];

  const fetchUrl = `${NCBI_BASE_URL}/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=xml`;

  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`PubMed fetch failed: ${response.statusText}`);
  }

  const xmlText = await response.text();
  return parseArticlesFromXml(xmlText);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SearchParams;
    const { query, maxResults = 10, sortBy = 'relevance' } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Limit maxResults to prevent abuse
    const limitedMaxResults = Math.min(Math.max(1, maxResults), 50);

    // Search PubMed
    const pmids = await searchPubMed(query, limitedMaxResults, sortBy);

    if (pmids.length === 0) {
      return NextResponse.json({
        articles: [],
        message: `No results found for "${query}"`,
        query,
        totalResults: 0,
      });
    }

    // Fetch article details
    const articles = await fetchArticleDetails(pmids);

    return NextResponse.json({
      articles,
      query,
      totalResults: articles.length,
    });
  } catch (error) {
    console.error('PubMed search error:', error);
    return NextResponse.json(
      { error: 'Failed to search PubMed. Please try again later.' },
      { status: 500 },
    );
  }
}

// Also support GET for simple testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required', usage: '/api/plugins/pubmed/search?query=cancer' },
      { status: 400 },
    );
  }

  // Redirect to POST handler
  const body: SearchParams = {
    maxResults: Number(searchParams.get('maxResults')) || 10,
    query,
    sortBy: (searchParams.get('sortBy') as 'relevance' | 'date') || 'relevance',
  };

  const pmids = await searchPubMed(body.query, body.maxResults ?? 10, body.sortBy || 'relevance');
  const articles = await fetchArticleDetails(pmids);

  return NextResponse.json({
    articles,
    query: body.query,
    totalResults: articles.length,
  });
}
