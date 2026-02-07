import { NextRequest, NextResponse } from 'next/server';

/**
 * DOI Resolver Plugin - Manifest
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
          'Resolve a Digital Object Identifier (DOI) to full academic citation metadata and formatted reference (IEEE style).',
        name: 'resolveDOI',
        parameters: {
          properties: {
            doi: {
              description:
                'The DOI to resolve (e.g., "10.1038/s41586-021-03819-2" or "https://doi.org/10.1038/s41586-021-03819-2")',
              type: 'string',
            },
            format: {
              default: 'ieee',
              description: 'The desired citation format',
              enum: ['ieee', 'apa', 'vancouver'],
              type: 'string',
            },
          },
          required: ['doi'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/doi-resolver/resolve`,
      },
    ],
    author: 'Phở Chat',
    homepage: 'https://pho.chat/plugins/doi-resolver',
    identifier: 'doi-resolver',
    meta: {
      avatar: '🔗',
      description: 'Resolve DOI to full citation metadata and formatted references (IEEE)',
      tags: ['doi', 'citation', 'reference', 'crossref', 'academic'],
      title: 'DOI Resolver',
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
