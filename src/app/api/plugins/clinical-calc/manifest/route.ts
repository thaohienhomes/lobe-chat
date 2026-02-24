import { NextRequest, NextResponse } from 'next/server';

/**
 * Clinical Calculator Plugin - Manifest
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
          'Calculate common clinical and medical formulas. Supports BMI, eGFR (CKD-EPI), MELD score, Creatinine Clearance (Cockcroft-Gault), CHA₂DS₂-VASc, Corrected Calcium, Anion Gap, and Serum Osmolality.',
        name: 'calculate',
        parameters: {
          properties: {
            formula: {
              description:
                'Formula to calculate: bmi, gfr, meld, creatinine_clearance, chadsvasc, corrected_calcium, anion_gap, osmolality',
              enum: [
                'bmi',
                'gfr',
                'meld',
                'meld_na',
                'creatinine_clearance',
                'chadsvasc',
                'corrected_calcium',
                'anion_gap',
                'osmolality',
                'nnt',
              ],
              type: 'string',
            },
            inputs: {
              description: 'Input values for the formula (varies by formula)',
              type: 'object',
            },
          },
          required: ['formula', 'inputs'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/clinical-calc/calculate`,
      },
      {
        description:
          'Get detailed information about a specific clinical formula including required inputs, normal ranges, and references.',
        name: 'getFormulaInfo',
        parameters: {
          properties: {
            formula: {
              description: 'Formula name to get info for',
              type: 'string',
            },
          },
          required: ['formula'],
          type: 'object',
        },
        url: `${baseUrl}/api/plugins/clinical-calc/info`,
      },
    ],
    author: 'Phở Chat',
    homepage: 'https://pho.chat/plugins/clinical-calc',
    identifier: 'clinical-calculator',
    meta: {
      avatar: '🩺',
      description: 'Calculate BMI, GFR, MELD, Creatinine Clearance, and other clinical formulas',
      tags: ['medical', 'clinical', 'calculator', 'healthcare', 'formulas'],
      title: 'Clinical Calculator',
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
