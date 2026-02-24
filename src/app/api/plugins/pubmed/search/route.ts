import { NextRequest, NextResponse } from 'next/server';

/**
 * PubMed Search API v2
 * Uses NCBI E-utilities to search PubMed database
 * https://www.ncbi.nlm.nih.gov/books/NBK25499/
 *
 * v2 Enhancements:
 * - Clickable URLs (PubMed link, DOI link)
 * - Pagination (retstart / retmax)
 * - Total result count from E-search
 * - MeSH term support in query hints
 * - Keywords extraction
 */

interface PubMedArticle {
  abstract?: string;
  authors: string[];
  doi?: string;
  doiUrl?: string;
  journal: string;
  keywords?: string[];
  pmid: string;
  pubDate: string;
  pubmedUrl: string;
  title: string;
}

interface SearchParams {
  maxResults?: number;
  page?: number;
  query: string;
  sortBy?: 'relevance' | 'date';
}

interface SearchResult {
  count: number;
  idlist: string[];
}

const NCBI_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

// Helper to extract tag content from XML
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

// Extract all occurrences of a tag
function extractAllTags(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, 'gi');
  const results: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    if (match[1].trim()) results.push(match[1].trim());
  }
  return results;
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

      // Extract MeSH keywords
      const meshTerms = extractAllTags(articleXml, 'DescriptorName').slice(0, 8);

      // Build clickable URLs
      const pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
      const doiUrl = doi ? `https://doi.org/${doi}` : undefined;

      articles.push({
        abstract: abstract.slice(0, 500) + (abstract.length > 500 ? '...' : ''),
        authors: authors.slice(0, 5),
        doi,
        doiUrl,
        journal,
        keywords: meshTerms.length > 0 ? meshTerms : undefined,
        pmid,
        pubDate,
        pubmedUrl,
        title,
      });
    } catch {
      // Skip malformed articles
      continue;
    }
  }

  return articles;
}

// Search PubMed and get list of PMIDs + total count
async function searchPubMed(
  query: string,
  maxResults: number,
  sortBy: string,
  retstart: number = 0,
): Promise<SearchResult> {
  const sort = sortBy === 'date' ? 'pub+date' : 'relevance';
  const searchUrl = `${NCBI_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retstart=${retstart}&sort=${sort}&retmode=json`;

  const response = await fetch(searchUrl);
  if (!response.ok) {
    throw new Error(`PubMed search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    count: parseInt(data.esearchresult?.count || '0', 10),
    idlist: data.esearchresult?.idlist || [],
  };
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
    const { query, maxResults = 10, sortBy = 'relevance', page = 1 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Limit maxResults to prevent abuse
    const limitedMaxResults = Math.min(Math.max(1, maxResults), 50);
    const retstart = (Math.max(1, page) - 1) * limitedMaxResults;

    // Search PubMed
    const { count, idlist: pmids } = await searchPubMed(
      query,
      limitedMaxResults,
      sortBy,
      retstart,
    );

    if (pmids.length === 0) {
      return NextResponse.json({
        articles: [],
        message: `No results found for "${query}"`,
        pagination: { currentPage: page, perPage: limitedMaxResults, totalPages: 0, totalResults: 0 },
        query,
        searchTips: [
          'Try using MeSH terms: "diabetes mellitus"[MeSH Terms]',
          'Use boolean operators: metformin AND "type 2 diabetes"',
          'Search specific fields: "SGLT2"[Title] AND "heart failure"[Title]',
        ],
        totalResults: 0,
      });
    }

    // Fetch article details
    const articles = await fetchArticleDetails(pmids);

    const totalPages = Math.ceil(count / limitedMaxResults);

    return NextResponse.json({
      articles,
      pagination: {
        currentPage: page,
        hasMore: page < totalPages,
        perPage: limitedMaxResults,
        totalPages,
        totalResults: count,
      },
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

// Support GET for simple testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      {
        error: 'Query parameter is required',
        usage: '/api/plugins/pubmed/search?query=metformin+diabetes&maxResults=5&sortBy=date&page=1',
      },
      { status: 400 },
    );
  }

  const body: SearchParams = {
    maxResults: Number(searchParams.get('maxResults')) || 10,
    page: Number(searchParams.get('page')) || 1,
    query,
    sortBy: (searchParams.get('sortBy') as 'relevance' | 'date') || 'relevance',
  };

  const { count, idlist: pmids } = await searchPubMed(
    body.query,
    body.maxResults ?? 10,
    body.sortBy || 'relevance',
    ((body.page || 1) - 1) * (body.maxResults ?? 10),
  );

  const articles = await fetchArticleDetails(pmids);
  const totalPages = Math.ceil(count / (body.maxResults ?? 10));

  return NextResponse.json({
    articles,
    pagination: {
      currentPage: body.page || 1,
      hasMore: (body.page || 1) < totalPages,
      perPage: body.maxResults,
      totalPages,
      totalResults: count,
    },
    query: body.query,
    totalResults: articles.length,
  });
}
