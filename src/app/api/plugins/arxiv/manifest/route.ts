import { NextRequest, NextResponse } from 'next/server';

/**
 * ArXiv Search Plugin - Manifest
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
          'Search for preprint research papers from arXiv.org. Returns paper titles, abstracts, authors, categories, and PDF links. Covers physics, mathematics, computer science, biology, and more.',
        name: 'searchArxiv',
        parameters: {
          properties: {
            category: {
              description:
                'Filter by arXiv category. Examples: cs.AI (AI), cs.LG (Machine Learning), q-bio (Quantitative Biology), physics, math, stat',
              type: 'string',
            },
            maxResults: {
              default: 10,
              description: 'Maximum number of results to return (1-50)',
              type: 'number',
            },
            query: {
              description:
                'Search query for arXiv. Use AND, OR, ANDNOT for boolean search. Prefix with ti: for title, au: for author, abs: for abstract',
              type: 'string',
            },
            sortBy: {
              default: 'relevance',
              description: 'Sort order for results',
              enum: ['relevance', 'lastUpdatedDate', 'submittedDate'],
              type: 'string',
            },
          },
          required: ['query'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/arxiv/search`,
      },
    ],
    author: 'Phở Chat',
    homepage: 'https://pho.chat/plugins/arxiv',
    identifier: 'arxiv',
    meta: {
      avatar: '📚',
      description: 'Search arXiv for preprint research papers in science and technology',
      tags: ['research', 'arxiv', 'preprint', 'science', 'academic'],
      title: 'ArXiv Search',
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
