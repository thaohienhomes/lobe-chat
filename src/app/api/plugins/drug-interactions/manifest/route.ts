import { NextRequest, NextResponse } from 'next/server';

/**
 * Drug Interactions Plugin - Manifest
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
          'Search for drug information from FDA database. Returns drug name, active ingredients, indications, warnings, and manufacturer info.',
        name: 'searchDrug',
        parameters: {
          properties: {
            limit: {
              default: 5,
              description: 'Maximum number of results (1-10)',
              type: 'number',
            },
            query: {
              description: 'Drug name to search for (brand name or generic name)',
              type: 'string',
            },
          },
          required: ['query'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/drug-interactions/search`,
      },
      {
        description:
          'Check potential interactions between two drugs. Returns warnings, contraindications, and severity levels (high/medium/low).',
        name: 'checkInteraction',
        parameters: {
          properties: {
            drug1: {
              description: 'First drug name',
              type: 'string',
            },
            drug2: {
              description: 'Second drug name',
              type: 'string',
            },
          },
          required: ['drug1', 'drug2'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/drug-interactions/check`,
      },
      {
        description: 'Get adverse event reports for a specific drug from FDA FAERS database.',
        name: 'getAdverseEvents',
        parameters: {
          properties: {
            drugName: {
              description: 'Drug name to search adverse events for',
              type: 'string',
            },
            limit: {
              default: 10,
              description: 'Maximum number of events (1-20)',
              type: 'number',
            },
          },
          required: ['drugName'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/drug-interactions/adverse-events`,
      },
    ],
    author: 'Phở Chat',
    homepage: 'https://pho.chat/plugins/drug-interactions',
    identifier: 'drug-interactions',
    meta: {
      avatar: '💊',
      description: 'Check drug interactions and search FDA drug database',
      tags: ['drug', 'interaction', 'pharmacy', 'fda', 'medical'],
      title: 'Drug Interactions',
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
