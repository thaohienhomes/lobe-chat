import { NextRequest, NextResponse } from 'next/server';

/**
 * PubMed Search Plugin v2 - Manifest
 * Returns the plugin manifest for LobeChat plugin system
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
          'Search PubMed for biomedical research articles. Returns articles with clickable PubMed links, DOI links, abstracts, authors, journals, MeSH keywords, and pagination. Supports boolean operators (AND, OR, NOT), MeSH terms, and field tags. IMPORTANT: Always include pubmedUrl and doiUrl links in your response so users can click to read the full paper.',
        name: 'searchPubMed',
        parameters: {
          properties: {
            maxResults: {
              default: 5,
              description: 'Number of articles per page (1-50)',
              type: 'number',
            },
            page: {
              default: 1,
              description: 'Page number for pagination (starts at 1). Use this to load more results.',
              type: 'number',
            },
            query: {
              description:
                'PubMed search query. Supports: boolean operators (AND, OR, NOT), MeSH terms like "diabetes mellitus"[MeSH Terms], field tags like "metformin"[Title], date filters like "2024"[Date - Publication]',
              type: 'string',
            },
            sortBy: {
              default: 'relevance',
              description: 'Sort by relevance or publication date',
              enum: ['relevance', 'date'],
              type: 'string',
            },
          },
          required: ['query'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/pubmed/search`,
      },
    ],
    author: 'Phở Chat',
    homepage: 'https://pho.chat/plugins/pubmed',
    identifier: 'pubmed-search',
    meta: {
      avatar: '🔬',
      description:
        'Search PubMed for biomedical research articles with clickable links, pagination, and citation export',
      tags: ['biomedical', 'research', 'pubmed', 'medical', 'science', 'literature'],
      title: 'PubMed Search',
    },
    settings: {
      properties: {},
      type: 'object',
    },
    type: 'default',
    version: '2',
  };

  return NextResponse.json(manifest);
}
