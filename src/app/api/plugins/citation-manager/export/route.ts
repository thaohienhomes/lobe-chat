import { NextRequest, NextResponse } from 'next/server';

/**
 * Citation Manager - Export Bibliography
 * Generates a .bib or .ris file from a list of identifiers
 */

// Reuse the citation generation logic
async function fetchCitationForId(identifier: string, format: 'bibtex' | 'ris'): Promise<string> {
    // Determine ID type
    const trimmed = identifier.trim();
    let url: string;

    if (/^\d{5,9}$/.test(trimmed)) {
        // PMID → fetch from PubMed
        url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${trimmed}&retmode=xml`;
    } else if (/^10\.\d{4,}\//.test(trimmed)) {
        // DOI → fetch from CrossRef
        const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(trimmed)}`;
        const res = await fetch(crossrefUrl, {
            headers: { 'User-Agent': 'PhoChatBot/1.0 (mailto:support@pho.chat)' },
        });
        if (!res.ok) return `% Error fetching ${trimmed}\n`;
        const data = await res.json();
        const w = data.message;
        const authors = (w.author || []).map((a: { family?: string; given?: string }) =>
            `${a.given || ''} ${a.family || ''}`.trim()
        );
        const year = w.published?.['date-parts']?.[0]?.[0]?.toString() || '';
        const firstAuthor = (w.author?.[0]?.family || 'Unknown').replace(/\s/g, '');

        if (format === 'bibtex') {
            let bib = `@article{${firstAuthor}${year},\n`;
            bib += `  title   = {${w.title?.[0] || ''}},\n`;
            bib += `  author  = {${authors.join(' and ')}},\n`;
            bib += `  journal = {${w['container-title']?.[0] || ''}},\n`;
            bib += `  year    = {${year}},\n`;
            if (w.volume) bib += `  volume  = {${w.volume}},\n`;
            if (w.issue) bib += `  number  = {${w.issue}},\n`;
            if (w.page) bib += `  pages   = {${w.page}},\n`;
            bib += `  doi     = {${trimmed}},\n`;
            bib += `}\n`;
            return bib;
        } else {
            let ris = 'TY  - JOUR\n';
            authors.forEach((a: string) => ris += `AU  - ${a}\n`);
            ris += `TI  - ${w.title?.[0] || ''}\n`;
            ris += `JO  - ${w['container-title']?.[0] || ''}\n`;
            ris += `PY  - ${year}\n`;
            if (w.volume) ris += `VL  - ${w.volume}\n`;
            if (w.page) ris += `SP  - ${w.page}\n`;
            ris += `DO  - ${trimmed}\n`;
            ris += 'ER  -\n';
            return ris;
        }
    } else {
        return format === 'bibtex'
            ? `% Could not process identifier: ${trimmed}\n`
            : `% Could not process identifier: ${trimmed}\n`;
    }

    // Handle PMID path
    const res = await fetch(url);
    if (!res.ok) return `% Error fetching PMID ${trimmed}\n`;
    const xml = await res.text();

    const extractTag = (tag: string): string => {
        const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i'));
        return match ? match[1].trim() : '';
    };

    const authorMatches = xml.match(/<Author[\S\s]*?<\/Author>/g) || [];
    const authors = authorMatches.map((a) => {
        const last = a.match(/<LastName>([^<]*)<\/LastName>/)?.[1] || '';
        const first = a.match(/<ForeName>([^<]*)<\/ForeName>/)?.[1] || '';
        return `${first} ${last}`.trim();
    }).filter(Boolean);

    const pubDateMatch = xml.match(/<PubDate>([\S\s]*?)<\/PubDate>/);
    const year = pubDateMatch ? (pubDateMatch[1].match(/<Year>(\d+)<\/Year>/)?.[1] || '') : '';
    const doiMatch = xml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
    const doi = doiMatch?.[1] || '';
    const title = extractTag('ArticleTitle');
    const journal = extractTag('Title') || extractTag('ISOAbbreviation');
    const volume = extractTag('Volume');
    const issue = extractTag('Issue');
    const pages = extractTag('MedlinePgn');
    const firstAuthor = (authors[0]?.split(' ').pop() || 'Unknown').replace(/\s/g, '');

    if (format === 'bibtex') {
        let bib = `@article{${firstAuthor}${year},\n`;
        bib += `  title   = {${title}},\n`;
        bib += `  author  = {${authors.join(' and ')}},\n`;
        bib += `  journal = {${journal}},\n`;
        bib += `  year    = {${year}},\n`;
        if (volume) bib += `  volume  = {${volume}},\n`;
        if (issue) bib += `  number  = {${issue}},\n`;
        if (pages) bib += `  pages   = {${pages}},\n`;
        if (doi) bib += `  doi     = {${doi}},\n`;
        bib += `  pmid    = {${trimmed}},\n`;
        bib += `}\n`;
        return bib;
    } else {
        let ris = 'TY  - JOUR\n';
        authors.forEach(a => ris += `AU  - ${a}\n`);
        ris += `TI  - ${title}\n`;
        ris += `JO  - ${journal}\n`;
        ris += `PY  - ${year}\n`;
        if (volume) ris += `VL  - ${volume}\n`;
        if (issue) ris += `IS  - ${issue}\n`;
        if (pages) ris += `SP  - ${pages}\n`;
        if (doi) ris += `DO  - ${doi}\n`;
        ris += `AN  - PMID:${trimmed}\n`;
        ris += 'ER  -\n';
        return ris;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { identifiers, format = 'bibtex' } = body;

        if (!identifiers || !Array.isArray(identifiers) || identifiers.length === 0) {
            return NextResponse.json(
                { error: 'identifiers array is required (list of PMIDs, DOIs, or ArXiv IDs)' },
                { status: 400 },
            );
        }

        if (identifiers.length > 50) {
            return NextResponse.json(
                { error: 'Maximum 50 identifiers per export' },
                { status: 400 },
            );
        }

        const validFormat = format === 'ris' ? 'ris' : 'bibtex';

        // Fetch all citations in parallel (max 5 concurrent)
        const results: string[] = [];
        const batchSize = 5;
        for (let i = 0; i < identifiers.length; i += batchSize) {
            const batch = identifiers.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map((id: string) => fetchCitationForId(id, validFormat)),
            );
            results.push(...batchResults);
        }

        const content = results.join('\n');
        const filename = validFormat === 'bibtex' ? 'bibliography.bib' : 'bibliography.ris';

        return NextResponse.json({
            content,
            filename,
            format: validFormat,
            totalEntries: identifiers.length,
        });
    } catch (error) {
        console.error('Bibliography export error:', error);
        return NextResponse.json(
            { error: 'Failed to export bibliography. Please try again.' },
            { status: 500 },
        );
    }
}
