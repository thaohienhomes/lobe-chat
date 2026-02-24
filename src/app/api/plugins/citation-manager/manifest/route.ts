import { NextRequest, NextResponse } from 'next/server';

/**
 * Citation Manager Plugin - Manifest
 * Generates formatted citations from PMID, DOI, or ArXiv ID
 */
export async function GET(request: NextRequest) {
    const host = request.headers.get('host') || 'localhost:3010';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const manifest = {
        $schema: 'https://chat-plugins.lobehub.com/schema/v1/manifest.json',
        api: [
            {
                description:
                    'Generate a formatted citation from a PMID, DOI, or ArXiv ID. Returns citations in multiple formats (APA, BibTeX, Vancouver, RIS) ready to copy-paste. Also returns structured metadata (authors, title, journal, year, volume, pages).',
                name: 'getCitation',
                parameters: {
                    properties: {
                        format: {
                            default: 'all',
                            description: 'Citation format: apa, bibtex, vancouver, ris, or all (returns all formats)',
                            enum: ['apa', 'bibtex', 'vancouver', 'ris', 'all'],
                            type: 'string',
                        },
                        identifier: {
                            description:
                                'Article identifier. Accepts: PMID (e.g. "41504525"), DOI (e.g. "10.1080/13696998.2025.2604454"), or ArXiv ID (e.g. "2401.12345")',
                            type: 'string',
                        },
                    },
                    required: ['identifier'],
                    type: 'object',
                },
                url: `${baseUrl}/api/plugins/citation-manager/cite`,
            },
            {
                description:
                    'Generate a bibliography file (.bib or .ris) from a list of identifiers (PMIDs, DOIs, ArXiv IDs). Returns formatted text ready to save as a bibliography file for use with LaTeX, Zotero, Endnote, or Mendeley.',
                name: 'exportBibliography',
                parameters: {
                    properties: {
                        format: {
                            default: 'bibtex',
                            description: 'Export format: bibtex (.bib file) or ris (.ris file)',
                            enum: ['bibtex', 'ris'],
                            type: 'string',
                        },
                        identifiers: {
                            description: 'Array of identifiers (PMIDs, DOIs, or ArXiv IDs) to include in the bibliography',
                            items: { type: 'string' },
                            type: 'array',
                        },
                    },
                    required: ['identifiers'],
                    type: 'object',
                },
                url: `${baseUrl}/api/plugins/citation-manager/export`,
            },
        ],
        author: 'Phở Chat',
        homepage: 'https://pho.chat/plugins/citation-manager',
        identifier: 'citation-manager',
        meta: {
            avatar: '📋',
            description:
                'Generate formatted citations (APA, BibTeX, Vancouver) from PMID, DOI, or ArXiv ID. Export bibliographies for LaTeX, Zotero, Endnote.',
            tags: ['citation', 'bibliography', 'reference', 'bibtex', 'apa', 'academic'],
            title: 'Citation Manager',
        },
        settings: {
            properties: {},
            type: 'object',
        },
        type: 'default',
        version: '1',
    };

    return NextResponse.json(manifest);
}
