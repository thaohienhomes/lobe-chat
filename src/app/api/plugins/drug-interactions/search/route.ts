import { NextRequest, NextResponse } from 'next/server';

/**
 * Drug Search API
 * Uses OpenFDA API to search drug information
 * https://open.fda.gov/apis/drug/
 */

interface DrugInfo {
  activeIngredients: string[];
  boxedWarning: string;
  brandName: string;
  contraindications: string;
  dosageForm: string;
  drugInteractions: string;
  fdaUrl: string;
  genericName: string;
  indications: string;
  manufacturer: string;
  route: string[];
  warnings: string;
}

const OPENFDA_BASE_URL = 'https://api.fda.gov/drug';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 5 } = body as { limit?: number; query: string };

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const limitedLimit = Math.min(Math.max(1, limit), 10);

    // Search drug labels from OpenFDA
    const searchUrl = `${OPENFDA_BASE_URL}/label.json?search=(openfda.brand_name:"${encodeURIComponent(query)}"+OR+openfda.generic_name:"${encodeURIComponent(query)}")&limit=${limitedLimit}`;

    const response = await fetch(searchUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          drugs: [],
          message: `No drugs found matching "${query}"`,
          query,
          totalResults: 0,
        });
      }
      throw new Error(`OpenFDA API error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || [];

    const drugs: DrugInfo[] = results.map((result: Record<string, unknown>) => {
      const openfda = (result.openfda || {}) as Record<string, string[]>;
      const brandName = (openfda.brand_name || ['Unknown'])[0];

      return {
        activeIngredients: (openfda.substance_name || []).slice(0, 5),
        boxedWarning: ((result.boxed_warning as string[]) || [''])[0]?.slice(0, 500) || '',
        brandName,
        contraindications: ((result.contraindications as string[]) || [''])[0]?.slice(0, 400) || '',
        dosageForm:
          ((result.dosage_and_administration as string[]) || [''])[0]?.slice(0, 200) || '',
        drugInteractions: ((result.drug_interactions as string[]) || [''])[0]?.slice(0, 500) || '',
        fdaUrl: `https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=${(openfda.application_number || [''])[0]?.replace(/\D/g, '')}`,
        genericName: (openfda.generic_name || ['Unknown'])[0],
        indications: ((result.indications_and_usage as string[]) || [''])[0]?.slice(0, 300) || '',
        manufacturer: (openfda.manufacturer_name || ['Unknown'])[0],
        route: openfda.route || [],
        warnings: ((result.warnings as string[]) || [''])[0]?.slice(0, 500) || '',
      };
    });

    return NextResponse.json({
      drugs,
      query,
      totalResults: drugs.length,
    });
  } catch (error) {
    console.error('Drug search error:', error);
    return NextResponse.json(
      { error: 'Failed to search drugs. Please try again later.' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json(
      {
        error: 'Query parameter is required',
        usage: '/api/plugins/drug-interactions/search?query=aspirin',
      },
      { status: 400 },
    );
  }

  // Create mock request for POST handler
  const mockRequest = {
    json: async () => ({
      limit: Number(searchParams.get('limit')) || 5,
      query,
    }),
  } as NextRequest;

  return POST(mockRequest);
}
