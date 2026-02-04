import { NextRequest, NextResponse } from 'next/server';

/**
 * Adverse Events API
 * Fetches adverse event reports from OpenFDA
 */

interface AdverseEvent {
  eventDate: string;
  patientAge?: number;
  patientSex?: string;
  reactions: string[];
  reportDate: string;
  serious: boolean;
  seriousEvents: string[];
}

const OPENFDA_BASE_URL = 'https://api.fda.gov/drug';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { drugName, limit = 10 } = body as { drugName: string; limit?: number };

    if (!drugName || typeof drugName !== 'string') {
      return NextResponse.json({ error: 'drugName parameter is required' }, { status: 400 });
    }

    const limitedLimit = Math.min(Math.max(1, limit), 20);

    // Search adverse events from OpenFDA
    const searchUrl = `${OPENFDA_BASE_URL}/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(drugName)}"&limit=${limitedLimit}`;

    const response = await fetch(searchUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({
          drugName,
          events: [],
          message: `No adverse events found for "${drugName}"`,
          totalResults: 0,
        });
      }
      throw new Error(`OpenFDA API error: ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || [];

    const events: AdverseEvent[] = results.map((result: Record<string, unknown>) => {
      const patient = (result.patient || {}) as Record<string, unknown>;
      const reactions = ((patient.reaction as Array<{ reactionmeddrapt?: string }>) || [])
        .map((r) => r.reactionmeddrapt || '')
        .filter(Boolean);

      // Check for serious events
      const seriousEvents: string[] = [];
      if (result.seriousnesscongenitalanomali === '1') seriousEvents.push('Congenital Anomaly');
      if (result.seriousnessdeath === '1') seriousEvents.push('Death');
      if (result.seriousnessdisabling === '1') seriousEvents.push('Disabling');
      if (result.seriousnesshospitalization === '1') seriousEvents.push('Hospitalization');
      if (result.seriousnesslifethreatening === '1') seriousEvents.push('Life Threatening');
      if (result.seriousnessother === '1') seriousEvents.push('Other Serious');

      return {
        eventDate: (result.receiptdate as string) || '',
        patientAge: patient.patientonsetage ? Number(patient.patientonsetage) : undefined,
        patientSex:
          patient.patientsex === '1' ? 'Male' : patient.patientsex === '2' ? 'Female' : undefined,
        reactions: reactions.slice(0, 10),
        reportDate: (result.receivedate as string) || '',
        serious: result.serious === '1',
        seriousEvents,
      };
    });

    return NextResponse.json({
      drugName,
      events,
      totalResults: events.length,
    });
  } catch (error) {
    console.error('Adverse events search error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adverse events. Please try again later.' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const drugName = searchParams.get('drugName');

  if (!drugName) {
    return NextResponse.json(
      {
        error: 'drugName parameter is required',
        usage: '/api/plugins/drug-interactions/adverse-events?drugName=aspirin',
      },
      { status: 400 },
    );
  }

  const mockRequest = {
    json: async () => ({
      drugName,
      limit: Number(searchParams.get('limit')) || 10,
    }),
  } as NextRequest;

  return POST(mockRequest);
}
