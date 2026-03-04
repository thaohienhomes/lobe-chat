import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export const maxDuration = 60;
/**
 * /api/research/pubmed-search
 * Searches PubMed for papers relevant to a clinical question.
 * Uses NCBI E-utilities (free, no API key required but rate-limited).
 *
 * Body: { query: string, maxResults?: number }
 * Returns: { papers: Array<{ pmid, title, authors, journal, year, abstract }> }
 */

interface PubMedPaper {
    abstract: string;
    authors: string;
    journal: string;
    pmid: string;
    title: string;
    year: string;
}

const ESEARCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const EFETCH_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

export async function POST(req: Request) {
    // ── 1. Auth ──
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Parse body ──
    let body: { maxResults?: number; query?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { query, maxResults = 10 } = body;
    if (!query) {
        return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    try {
        // ── 3. Search PubMed for PMIDs ──
        const searchParams = new URLSearchParams({
            db: 'pubmed',
            retmax: String(Math.min(maxResults, 20)),
            retmode: 'json',
            sort: 'relevance',
            term: query,
        });

        console.log(`[pubmed-search] Searching: "${query.slice(0, 80)}..."`);
        const searchRes = await fetch(`${ESEARCH_URL}?${searchParams}`, {
            signal: AbortSignal.timeout(15_000),
        });

        if (!searchRes.ok) {
            throw new Error(`PubMed search failed: ${searchRes.status}`);
        }

        const searchData = await searchRes.json();
        const pmids: string[] = searchData?.esearchresult?.idlist || [];

        if (pmids.length === 0) {
            console.log('[pubmed-search] No results found');
            return NextResponse.json({ papers: [] });
        }

        // ── 4. Fetch paper details ──
        const fetchParams = new URLSearchParams({
            db: 'pubmed',
            id: pmids.join(','),
            retmode: 'xml',
            rettype: 'abstract',
        });

        const fetchRes = await fetch(`${EFETCH_URL}?${fetchParams}`, {
            signal: AbortSignal.timeout(20_000),
        });

        if (!fetchRes.ok) {
            throw new Error(`PubMed fetch failed: ${fetchRes.status}`);
        }

        const xmlText = await fetchRes.text();

        // ── 5. Parse XML response ──
        const papers: PubMedPaper[] = [];

        // Simple XML parsing for PubmedArticle elements
        const articleRegex = /<PubmedArticle>([\S\s]*?)<\/PubmedArticle>/g;
        let match;

        while ((match = articleRegex.exec(xmlText)) !== null) {
            const articleXml = match[1];

            const pmid = extractXmlValue(articleXml, 'PMID') || '';
            const title = extractXmlValue(articleXml, 'ArticleTitle') || 'Untitled';
            const abstractText = extractAbstract(articleXml);
            const journal = extractXmlValue(articleXml, 'Title') || '';
            const year = extractXmlValue(articleXml, 'Year') || '';

            // Extract authors
            const authorRegex = /<Author[\S\s]*?<LastName>(.*?)<\/LastName>[\S\s]*?<Initials>(.*?)<\/Initials>/g;
            const authors: string[] = [];
            let authorMatch;
            while ((authorMatch = authorRegex.exec(articleXml)) !== null) {
                authors.push(`${authorMatch[1]} ${authorMatch[2]}`);
                if (authors.length >= 3) break;
            }
            const authorStr = authors.length > 0
                ? (authors.length >= 3 ? `${authors.join(', ')} et al.` : authors.join(', '))
                : 'Unknown';

            papers.push({
                abstract: abstractText.slice(0, 1500),
                authors: authorStr,
                journal,
                pmid,
                title: cleanXmlText(title),
                year,
            });
        }

        console.log(`[pubmed-search] Found ${papers.length} papers for "${query.slice(0, 50)}"`);
        return NextResponse.json({ papers });

    } catch (e: any) {
        console.error('[pubmed-search] Error:', e?.message);
        return NextResponse.json(
            { error: `PubMed search failed: ${e?.message || 'Unknown error'}` },
            { status: 502 },
        );
    }
}

// ── Helpers ──

function extractXmlValue(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, 's');
    const match = regex.exec(xml);
    return match ? match[1].trim() : null;
}

function extractAbstract(xml: string): string {
    // Try structured abstract first
    const abstractTextRegex = /<AbstractText[^>]*>([\S\s]*?)<\/AbstractText>/g;
    const parts: string[] = [];
    let match;
    while ((match = abstractTextRegex.exec(xml)) !== null) {
        parts.push(cleanXmlText(match[1]));
    }
    if (parts.length > 0) return parts.join(' ');

    // Fall back to simple Abstract tag
    const simple = extractXmlValue(xml, 'Abstract');
    return simple ? cleanXmlText(simple) : 'No abstract available.';
}

function cleanXmlText(text: string): string {
    return text
        .replaceAll(/<[^>]+>/g, '') // Remove XML tags
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&amp;', '&')
        .replaceAll('&quot;', '"')
        .replaceAll(/\s+/g, ' ')
        .trim();
}
