import { NextRequest, NextResponse } from 'next/server';

/**
 * Semantic Scholar Plugin - Manifest
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
          'Search for academic papers from Semantic Scholar. Returns paper titles, abstracts, authors, publication years, venues, citation counts, and DOI links. Covers all major scientific fields. IMPORTANT: After receiving the search results, you MUST format them as a clean, readable list for the user. For each paper, show: 1) Title (linked to the paper URL or DOI), 2) Authors (first 3, then "et al." if more), 3) Venue/Journal, Year, 4) A brief 1-2 sentence summary from the abstract, 5) Citation count if available. Do NOT show raw JSON to the user. Do NOT show the API parameters or response structure. Present results in a natural, readable format.',
        name: 'searchSemanticScholar',
        parameters: {
          properties: {
            fieldsOfStudy: {
              description:
                'Filter by fields of study. Examples: Computer Science, Medicine, Biology, Physics',
              items: {
                type: 'string',
              },
              type: 'array',
            },
            maxResults: {
              default: 10,
              description: 'Maximum number of results to return (1-50)',
              type: 'number',
            },
            query: {
              description: 'Search query for academic papers',
              type: 'string',
            },
            year: {
              description: 'Filter by publication year (e.g., "2023" or "2020-2023")',
              type: 'string',
            },
          },
          required: ['query'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/semantic-scholar/search`,
      },
    ],
    author: 'Phở Chat',
    homepage: 'https://pho.chat/plugins/semantic-scholar',
    identifier: 'semantic-scholar',
    meta: {
      avatar: '🎓',
      description: 'Search Semantic Scholar for academic papers with citation counts and metadata',
      tags: ['research', 'academic', 'citation', 'papers', 'scholar'],
      title: 'Semantic Scholar',
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
