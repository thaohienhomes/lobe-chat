import { NextRequest, NextResponse } from 'next/server';

/**
 * Citation Manager - Get Citation
 * Accepts PMID, DOI, or ArXiv ID and returns formatted citations
 * Uses CrossRef API (DOI) and NCBI E-utilities (PMID) — both free, no auth
 */

interface ArticleMetadata {
    authors: string[];
    doi?: string;
    issue?: string;
    journal: string;
    pages?: string;
    pmid?: string;
    pubDate: string;
    title: string;
    volume?: string;
    year: string;
}

// ── Identifier Detection ──────────────────────────────────────
function detectIdentifierType(id: string): 'pmid' | 'doi' | 'arxiv' | 'unknown' {
    const trimmed = id.trim();
    if (/^\d{5,9}$/.test(trimmed)) return 'pmid';
    if (/^10\.\d{4,}\//.test(trimmed)) return 'doi';
    if (/^\d{4}\.\d{4,}/.test(trimmed)) return 'arxiv';
    // Also handle full URLs
    if (trimmed.includes('pubmed.ncbi.nlm.nih.gov')) return 'pmid';
    if (trimmed.includes('doi.org/')) return 'doi';
    if (trimmed.includes('arxiv.org')) return 'arxiv';
    return 'unknown';
}

function extractId(id: string, type: 'pmid' | 'doi' | 'arxiv'): string {
    const trimmed = id.trim();
    if (type === 'pmid') {
        const match = trimmed.match(/(\d{5,9})/);
        return match ? match[1] : trimmed;
    }
    if (type === 'doi') {
        const match = trimmed.match(/(10\.\d{4,}\/\S+)/);
        return match ? match[1] : trimmed;
    }
    if (type === 'arxiv') {
        const match = trimmed.match(/(\d{4}\.\d{4,})/);
        return match ? match[1] : trimmed;
    }
    return trimmed;
}

// ── Metadata Fetchers ──────────────────────────────────────────

async function fetchFromPubMed(pmid: string): Promise<ArticleMetadata> {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`PubMed fetch failed: ${res.statusText}`);
    const xml = await res.text();

    const extractTag = (tag: string): string => {
        const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
        return match ? match[1].trim() : '';
    };

    // Authors
    const authorMatches = xml.match(/<Author[\S\s]*?<\/Author>/g) || [];
    const authors = authorMatches.map((a) => {
        const last = a.match(/<LastName>([^<]*)<\/LastName>/)?.[1] || '';
        const first = a.match(/<ForeName>([^<]*)<\/ForeName>/)?.[1] || '';
        const initials = first.split(' ').map(n => n[0]).join('. ');
        return `${last}, ${initials}.`;
    }).filter(a => a.length > 3);

    // Date
    const pubDateMatch = xml.match(/<PubDate>([\S\s]*?)<\/PubDate>/);
    const year = pubDateMatch ? (pubDateMatch[1].match(/<Year>(\d+)<\/Year>/)?.[1] || '') : '';
    const month = pubDateMatch ? (pubDateMatch[1].match(/<Month>([^<]*)<\/Month>/)?.[1] || '') : '';

    // DOI
    const doiMatch = xml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);

    return {
        authors,
        doi: doiMatch?.[1],
        issue: extractTag('Issue') || undefined,
        journal: extractTag('Title') || extractTag('ISOAbbreviation'),
        pages: extractTag('MedlinePgn') || undefined,
        pmid,
        pubDate: `${year} ${month}`.trim(),
        title: extractTag('ArticleTitle'),
        volume: extractTag('Volume') || undefined,
        year: year || new Date().getFullYear().toString(),
    };
}

async function fetchFromCrossRef(doi: string): Promise<ArticleMetadata> {
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'PhoChatBot/1.0 (mailto:support@pho.chat)' },
    });
    if (!res.ok) throw new Error(`CrossRef fetch failed: ${res.statusText}`);
    const data = await res.json();
    const work = data.message;

    const authors = (work.author || []).map((a: { family?: string; given?: string }) => {
        const initials = (a.given || '').split(' ').map((n: string) => n[0]).join('. ');
        return `${a.family || ''}, ${initials}.`;
    });

    const dateParts = work.published?.['date-parts']?.[0] || [];
    const year = dateParts[0]?.toString() || '';

    return {
        authors,
        doi,
        issue: work.issue,
        journal: work['container-title']?.[0] || '',
        pages: work.page,
        pubDate: year,
        title: work.title?.[0] || '',
        volume: work.volume,
        year,
    };
}

async function fetchFromArxiv(arxivId: string): Promise<ArticleMetadata> {
    const url = `https://export.arxiv.org/api/query?id_list=${arxivId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`ArXiv fetch failed: ${res.statusText}`);
    const xml = await res.text();

    const titleMatch = xml.match(/<title>([^<]+)<\/title>/g);
    const title = titleMatch && titleMatch.length > 1
        ? titleMatch[1].replaceAll(/<\/?title>/g, '').trim()
        : '';

    const authorMatches = xml.match(/<name>([^<]+)<\/name>/g) || [];
    const authors = authorMatches.map(a => {
        const name = a.replaceAll(/<\/?name>/g, '').trim();
        const parts = name.split(' ');
        const last = parts.pop() || '';
        const initials = parts.map(p => p[0]).join('. ');
        return `${last}, ${initials}.`;
    });

    const publishedMatch = xml.match(/<published>(\d{4})/);
    const year = publishedMatch?.[1] || '';

    return {
        authors,
        doi: undefined,
        journal: 'arXiv preprint',
        pubDate: year,
        title,
        year,
    };
}

// ── Citation Formatters ──────────────────────────────────────

function formatAPA(m: ArticleMetadata): string {
    const authorStr = m.authors.length > 7
        ? m.authors.slice(0, 6).join(', ') + ', ... ' + m.authors.at(-1)
        : m.authors.join(', ');
    const titleStr = m.title.endsWith('.') ? m.title : m.title + '.';
    let citation = `${authorStr} (${m.year}). ${titleStr} *${m.journal}*`;
    if (m.volume) citation += `, *${m.volume}*`;
    if (m.issue) citation += `(${m.issue})`;
    if (m.pages) citation += `, ${m.pages}`;
    citation += '.';
    if (m.doi) citation += ` https://doi.org/${m.doi}`;
    return citation;
}

function formatVancouver(m: ArticleMetadata): string {
    const authorStr = m.authors.length > 6
        ? m.authors.slice(0, 6).join(', ') + ', et al'
        : m.authors.join(', ');
    let citation = `${authorStr}. ${m.title}. ${m.journal}. ${m.year}`;
    if (m.volume) citation += `;${m.volume}`;
    if (m.issue) citation += `(${m.issue})`;
    if (m.pages) citation += `:${m.pages}`;
    citation += '.';
    if (m.doi) citation += ` doi:${m.doi}`;
    return citation;
}

function formatBibTeX(m: ArticleMetadata): string {
    const firstAuthor = m.authors[0]?.split(',')[0]?.replace(/\s/g, '') || 'Unknown';
    const key = `${firstAuthor}${m.year}`;
    const authorStr = m.authors.map(a => {
        const parts = a.replace(/\.$/, '').split(', ');
        return parts.length === 2 ? `${parts[1]} ${parts[0]}` : a;
    }).join(' and ');

    let bib = `@article{${key},\n`;
    bib += `  title     = {${m.title}},\n`;
    bib += `  author    = {${authorStr}},\n`;
    bib += `  journal   = {${m.journal}},\n`;
    bib += `  year      = {${m.year}},\n`;
    if (m.volume) bib += `  volume    = {${m.volume}},\n`;
    if (m.issue) bib += `  number    = {${m.issue}},\n`;
    if (m.pages) bib += `  pages     = {${m.pages}},\n`;
    if (m.doi) bib += `  doi       = {${m.doi}},\n`;
    if (m.pmid) bib += `  pmid      = {${m.pmid}},\n`;
    bib += `}`;
    return bib;
}

function formatRIS(m: ArticleMetadata): string {
    let ris = 'TY  - JOUR\n';
    for (const author of m.authors) {
        ris += `AU  - ${author}\n`;
    }
    ris += `TI  - ${m.title}\n`;
    ris += `JO  - ${m.journal}\n`;
    ris += `PY  - ${m.year}\n`;
    if (m.volume) ris += `VL  - ${m.volume}\n`;
    if (m.issue) ris += `IS  - ${m.issue}\n`;
    if (m.pages) ris += `SP  - ${m.pages}\n`;
    if (m.doi) ris += `DO  - ${m.doi}\n`;
    if (m.pmid) ris += `AN  - ${m.pmid}\n`;
    ris += 'ER  -\n';
    return ris;
}

// ── Route Handler ──────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { identifier, format = 'all' } = body;

        if (!identifier || typeof identifier !== 'string') {
            return NextResponse.json({ error: 'identifier is required (PMID, DOI, or ArXiv ID)' }, { status: 400 });
        }

        const idType = detectIdentifierType(identifier);
        const cleanId = extractId(identifier, idType as 'pmid' | 'doi' | 'arxiv');

        let metadata: ArticleMetadata;

        switch (idType) {
            case 'pmid': {
                metadata = await fetchFromPubMed(cleanId);
                break;
            }
            case 'doi': {
                metadata = await fetchFromCrossRef(cleanId);
                break;
            }
            case 'arxiv': {
                metadata = await fetchFromArxiv(cleanId);
                break;
            }
            default: {
                return NextResponse.json({
                    error: `Could not detect identifier type for "${identifier}". Please provide a valid PMID (e.g. 41504525), DOI (e.g. 10.1080/13696998.2025.2604454), or ArXiv ID (e.g. 2401.12345).`,
                    suggestions: [
                        'PMID: a 5-9 digit number (e.g. 41504525)',
                        'DOI: starts with 10.xxxx/ (e.g. 10.1080/13696998.2025.2604454)',
                        'ArXiv: format YYMM.NNNNN (e.g. 2401.12345)',
                    ],
                }, { status: 400 });
            }
        }

        // Generate citations
        const citations: Record<string, string> = {};
        if (format === 'all' || format === 'apa') citations.apa = formatAPA(metadata);
        if (format === 'all' || format === 'bibtex') citations.bibtex = formatBibTeX(metadata);
        if (format === 'all' || format === 'vancouver') citations.vancouver = formatVancouver(metadata);
        if (format === 'all' || format === 'ris') citations.ris = formatRIS(metadata);

        return NextResponse.json({
            citations,
            identifierType: idType,
            metadata: {
                authors: metadata.authors,
                doi: metadata.doi,
                doiUrl: metadata.doi ? `https://doi.org/${metadata.doi}` : undefined,
                journal: metadata.journal,
                pmid: metadata.pmid,
                pubmedUrl: metadata.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${metadata.pmid}/` : undefined,
                title: metadata.title,
                year: metadata.year,
            },
        });
    } catch (error) {
        console.error('Citation Manager error:', error);
        return NextResponse.json(
            { error: 'Failed to generate citation. The identifier may be invalid or the source is temporarily unavailable.' },
            { status: 500 },
        );
    }
}

// GET for testing
export async function GET(request: NextRequest) {
    const identifier = request.nextUrl.searchParams.get('id');
    const format = request.nextUrl.searchParams.get('format') || 'all';

    if (!identifier) {
        return NextResponse.json({
            error: 'id parameter required',
            usage: '/api/plugins/citation-manager/cite?id=41504525&format=apa',
        }, { status: 400 });
    }

    const idType = detectIdentifierType(identifier);
    const cleanId = extractId(identifier, idType as 'pmid' | 'doi' | 'arxiv');

    try {
        let metadata: ArticleMetadata;

        switch (idType) {
            case 'pmid': {
                metadata = await fetchFromPubMed(cleanId);
                break;
            }
            case 'doi': {
                metadata = await fetchFromCrossRef(cleanId);
                break;
            }
            case 'arxiv': {
                metadata = await fetchFromArxiv(cleanId);
                break;
            }
            default: {
                return NextResponse.json({
                    error: `Could not detect identifier type for "${identifier}".`,
                    suggestions: ['PMID: 41504525', 'DOI: 10.1080/...', 'ArXiv: 2401.12345'],
                }, { status: 400 });
            }
        }

        const citations: Record<string, string> = {};
        if (format === 'all' || format === 'apa') citations.apa = formatAPA(metadata);
        if (format === 'all' || format === 'bibtex') citations.bibtex = formatBibTeX(metadata);
        if (format === 'all' || format === 'vancouver') citations.vancouver = formatVancouver(metadata);
        if (format === 'all' || format === 'ris') citations.ris = formatRIS(metadata);

        return NextResponse.json({
            citations,
            identifierType: idType,
            metadata: {
                authors: metadata.authors,
                doi: metadata.doi,
                doiUrl: metadata.doi ? `https://doi.org/${metadata.doi}` : undefined,
                journal: metadata.journal,
                pmid: metadata.pmid,
                pubmedUrl: metadata.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${metadata.pmid}/` : undefined,
                title: metadata.title,
                year: metadata.year,
            },
        });
    } catch (error) {
        console.error('Citation Manager GET error:', error);
        return NextResponse.json(
            { error: 'Failed to generate citation. The identifier may be invalid or unavailable.' },
            { status: 500 },
        );
    }
}

