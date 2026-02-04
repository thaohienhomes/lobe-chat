import { NextRequest, NextResponse } from 'next/server';

/**
 * PubMed Search Plugin - Manifest
 * Returns the plugin manifest for LobeChat plugin system
 */
export async function GET(request: NextRequest) {
  // Get the base URL from request or environment
  const host = request.headers.get('host') || 'localhost:3010';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const baseUrl = `${protocol}://${host}`;

  const manifest = {
    $schema: 'https://chat-plugins.lobehub.com/schema/v1/manifest.json',
    api: [
      {
        description:
          'Search for biomedical and life sciences research articles from PubMed/MEDLINE database. Returns article titles, abstracts, authors, journals, and DOI links. Access over 35 million citations.',
        name: 'searchPubMed',
        parameters: {
          properties: {
            maxResults: {
              default: 10,
              description: 'Maximum number of articles to return (1-50)',
              type: 'number',
            },
            query: {
              description:
                'Search query for PubMed. Supports boolean operators (AND, OR, NOT) and field tags like [Title], [Author], [MeSH Terms]',
              type: 'string',
            },
            sortBy: {
              default: 'relevance',
              description: 'Sort results by relevance or publication date',
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
        'Search PubMed for biomedical research articles, clinical studies, and medical literature',
      tags: ['biomedical', 'research', 'pubmed', 'medical', 'science'],
      title: 'PubMed Search',
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
