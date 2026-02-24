import { NextRequest, NextResponse } from 'next/server';

/**
 * ClinicalTrials.gov Search API
 * Uses ClinicalTrials.gov API v2 (free, no auth)
 * https://clinicaltrials.gov/data-api/about-api/study-data-structure
 */

interface TrialResult {
    conditions: string[];
    eligibility: string;
    enrollmentCount?: number;
    interventions: string[];
    lastUpdated: string;
    locations: string[];
    nctId: string;
    phase: string;
    sponsor: string;
    startDate: string;
    status: string;
    title: string;
    url: string;
}

const CT_API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            condition,
            intervention,
            location,
            phase,
            status = 'RECRUITING',
            maxResults = 5,
        } = body;

        if (!condition && !intervention) {
            return NextResponse.json(
                { error: 'At least one of "condition" or "intervention" is required' },
                { status: 400 },
            );
        }

        // Build query parameters
        const params = new URLSearchParams();
        params.set('format', 'json');
        params.set('pageSize', String(Math.min(Math.max(1, maxResults), 20)));

        // Build condition/intervention queries
        if (condition) params.set('query.cond', condition);
        if (intervention) params.set('query.intr', intervention);
        if (location) params.set('query.locn', location);

        // Status filter
        if (status && status !== 'ANY') {
            params.set('filter.overallStatus', status);
        }

        // Phase filter
        if (phase) {
            params.set('filter.phase', phase);
        }

        // Fields to return
        params.set('fields', [
            'NCTId',
            'BriefTitle',
            'OverallStatus',
            'Phase',
            'StartDate',
            'LastUpdatePostDate',
            'LeadSponsorName',
            'EnrollmentCount',
            'Condition',
            'InterventionName',
            'EligibilityCriteria',
            'LocationCity',
            'LocationCountry',
            'LocationFacility',
        ].join('|'));

        const url = `${CT_API_BASE}?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`ClinicalTrials.gov API error: ${response.statusText}`);
        }

        const data = await response.json();
        const studies = data.studies || [];

        const trials: TrialResult[] = studies.map((study: any) => {
            const proto = study.protocolSection || {};
            const id = proto.identificationModule || {};
            const status = proto.statusModule || {};
            const sponsor = proto.sponsorCollaboratorsModule || {};
            const design = proto.designModule || {};
            const eligibility = proto.eligibilityModule || {};
            const conditions = proto.conditionsModule || {};
            const interventions = proto.armsInterventionsModule || {};
            const locations = proto.contactsLocationsModule || {};

            const nctId = id.nctId || '';

            // Extract locations
            const locationList: string[] = [];
            const locs = locations.locations || [];
            for (const loc of locs.slice(0, 3)) {
                const parts = [loc.facility, loc.city, loc.country].filter(Boolean);
                if (parts.length > 0) locationList.push(parts.join(', '));
            }

            // Extract eligibility summary (first 300 chars)
            const eligibilityText = eligibility.eligibilityCriteria || '';
            const eligibilitySummary = eligibilityText.slice(0, 300) + (eligibilityText.length > 300 ? '...' : '');

            return {
                conditions: conditions.conditions || [],
                eligibility: eligibilitySummary,
                enrollmentCount: design.enrollmentInfo?.count,
                interventions: (interventions.interventions || []).map((i: any) => i.name).filter(Boolean),
                lastUpdated: status.lastUpdatePostDateStruct?.date || '',
                locations: locationList,
                nctId,
                phase: (status.phases || design.phases || []).join(', ') || 'N/A',
                sponsor: sponsor.leadSponsor?.name || '',
                startDate: status.startDateStruct?.date || '',
                status: status.overallStatus || '',
                title: id.briefTitle || id.officialTitle || '',
                url: `https://clinicaltrials.gov/study/${nctId}`,
            };
        });

        return NextResponse.json({
            query: { condition, intervention, location, phase, status },
            totalFound: data.totalCount || trials.length,
            trials,
        });
    } catch (error) {
        console.error('ClinicalTrials.gov search error:', error);
        return NextResponse.json(
            { error: 'Failed to search ClinicalTrials.gov. Please try again.' },
            { status: 500 },
        );
    }
}

// GET for testing
export async function GET(request: NextRequest) {
    const sp = request.nextUrl.searchParams;
    const condition = sp.get('condition') || sp.get('cond');
    const intervention = sp.get('intervention') || sp.get('intr');

    if (!condition && !intervention) {
        return NextResponse.json({
            error: 'condition or intervention parameter required',
            usage: '/api/plugins/clinical-trials/search?condition=diabetes&intervention=metformin&status=RECRUITING',
        }, { status: 400 });
    }

    const body = {
        condition: condition || undefined,
        intervention: intervention || undefined,
        location: sp.get('location') || undefined,
        maxResults: Number(sp.get('maxResults')) || 5,
        phase: sp.get('phase') || undefined,
        status: sp.get('status') || 'RECRUITING',
    };

    // Reuse POST logic
    const fakeReq = new Request('http://localhost', {
        body: JSON.stringify(body),
        method: 'POST',
    });
    return POST(fakeReq as unknown as NextRequest);
}
