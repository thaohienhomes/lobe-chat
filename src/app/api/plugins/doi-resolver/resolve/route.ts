import { NextRequest, NextResponse } from 'next/server';

/**
 * DOI Resolver API
 * Uses CrossRef API to resolve DOI to full citation metadata
 * https://api.crossref.org/swagger-ui/index.html
 */

interface CrossRefAuthor {
  family: string;
  given?: string;
}

interface CrossRefWork {
  DOI: string;
  URL: string;
  author?: CrossRefAuthor[];
  container_title?: string[];
  issue?: string;
  issued?: {
    'date-parts': number[][];
  };
  page?: string;
  publisher?: string;
  short_container_title?: string[];
  title: string[];
  volume?: string;
}

interface ResolveParams {
  doi: string;
}

const CROSSREF_API_URL = 'https://api.crossref.org/works/';

function formatIEEE(work: CrossRefWork): string {
  const authors = (work.author || [])
    .map((a) => `${a.given ? `${a.given[0]}. ` : ''}${a.family}`)
    .join(', ');
  const title = work.title[0] || 'No title';
  const journal = (work.container_title || [])[0] || '';
  const year = work.issued?.['date-parts']?.[0]?.[0] || '';
  const volume = work.volume ? `vol. ${work.volume}` : '';
  const issue = work.issue ? `no. ${work.issue}` : '';
  const pages = work.page ? `pp. ${work.page}` : '';

  let citation = `${authors ? `${authors}, ` : ''}"${title}," `;
  if (journal) citation += `*${journal}*, `;
  if (volume) citation += `${volume}, `;
  if (issue) citation += `${issue}, `;
  if (pages) citation += `${pages}, `;
  if (year) citation += `${year}. `;
  citation += `DOI: ${work.DOI}`;

  return citation;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResolveParams;
    const { doi } = body;

    if (!doi || typeof doi !== 'string') {
      return NextResponse.json({ error: 'DOI is required' }, { status: 400 });
    }

    // Clean DOI
    const cleanedDoi = doi.replace(/^https?:\/\/doi\.org\//, '').trim();

    const response = await fetch(`${CROSSREF_API_URL}${encodeURIComponent(cleanedDoi)}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PhoChat/1.0 (https://pho.chat; mailto:contact@pho.chat)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'DOI not found' }, { status: 404 });
      }
      throw new Error(`CrossRef API error: ${response.statusText}`);
    }

    const data = await response.json();
    const work = data.message as CrossRefWork;

    const result = {
      authors: (work.author || []).map((a) => `${a.given || ''} ${a.family}`.trim()),
      doi: work.DOI,
      formattedCitation: formatIEEE(work), // Default to IEEE as per plan
      journal: (work.container_title || [])[0],
      publisher: work.publisher,
      title: work.title[0],
      url: work.URL || `https://doi.org/${work.DOI}`,
      year: work.issued?.['date-parts']?.[0]?.[0],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('DOI resolve error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve DOI. Please try again later.' },
      { status: 500 },
    );
  }
}

// Support GET for simple testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const doi = searchParams.get('doi');

  if (!doi) {
    return NextResponse.json(
      {
        error: 'DOI is required',
        usage: '/api/plugins/doi-resolver/resolve?doi=10.1038/s41586-021-03819-2',
      },
      { status: 400 },
    );
  }

  const response = await fetch(`${CROSSREF_API_URL}${encodeURIComponent(doi)}`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) return NextResponse.json({ error: 'DOI not found' }, { status: 404 });

  const data = await response.json();
  const work = data.message as CrossRefWork;

  return NextResponse.json({
    authors: (work.author || []).map((a) => `${a.given || ''} ${a.family}`.trim()),
    doi: work.DOI,
    formattedCitation: formatIEEE(work),
    title: work.title[0],
  });
}
