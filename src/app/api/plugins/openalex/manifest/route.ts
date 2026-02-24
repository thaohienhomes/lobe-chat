import { NextRequest, NextResponse } from 'next/server';

/**
 * OpenAlex Plugin - Manifest
 * Search academic papers with citation counts, OA PDF links, related works
 * Free API, no authentication required
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
                    'Search OpenAlex for academic papers with citation data, open access PDF links, related works, and author h-index. Covers 250M+ works from all disciplines. Advantage over PubMed: shows citation count, open access status, and PDF download links. IMPORTANT: Always include the openAccessUrl link when available so users can read the full paper.',
                name: 'searchWorks',
                parameters: {
                    properties: {
                        maxResults: {
                            default: 5,
                            description: 'Number of papers to return (1-25)',
                            type: 'number',
                        },
                        page: {
                            default: 1,
                            description: 'Page number for pagination',
                            type: 'number',
                        },
                        query: {
                            description: 'Search query for papers (title, abstract, keywords). Use quotes for exact phrases.',
                            type: 'string',
                        },
                        sortBy: {
                            default: 'relevance_score',
                            description: 'Sort order for results',
                            enum: ['relevance_score', 'cited_by_count', 'publication_date'],
                            type: 'string',
                        },
                    },
                    required: ['query'],
                    type: 'object',
                },
                url: `${baseUrl}/api/plugins/openalex/search`,
            },
        ],
        author: 'Phở Chat',
        homepage: 'https://pho.chat/plugins/openalex',
        identifier: 'openalex-search',
        meta: {
            avatar: '📚',
            description:
                'Search 250M+ academic papers with citation counts, open access PDFs, and related works via OpenAlex',
            tags: ['academic', 'papers', 'citations', 'open-access', 'research', 'literature'],
            title: 'OpenAlex Academic Search',
        },
        settings: { properties: {}, type: 'object' },
        type: 'default',
        version: '1',
    };

    return NextResponse.json(manifest);
}
