import { NextRequest, NextResponse } from 'next/server';

/**
 * ClinicalTrials.gov Plugin - Manifest
 * Search worldwide clinical studies registry
 * Free API v2, no authentication required
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
                    'Search ClinicalTrials.gov for clinical studies worldwide. Find active, recruiting, or completed trials by condition, intervention, location, phase, and sponsor. Returns trial title, NCT ID, phase, status, eligibility, and locations with links to full details.',
                name: 'searchTrials',
                parameters: {
                    properties: {
                        condition: {
                            description: 'Disease or condition to search (e.g. "type 2 diabetes", "lung cancer", "heart failure")',
                            type: 'string',
                        },
                        intervention: {
                            description: 'Drug, device, or treatment to search (e.g. "metformin", "SGLT2 inhibitor", "immunotherapy")',
                            type: 'string',
                        },
                        location: {
                            description: 'Country or city to filter by (e.g. "Vietnam", "Ho Chi Minh City", "United States")',
                            type: 'string',
                        },
                        maxResults: {
                            default: 5,
                            description: 'Number of trials to return (1-20)',
                            type: 'number',
                        },
                        phase: {
                            description: 'Trial phase filter',
                            enum: ['EARLY_PHASE1', 'PHASE1', 'PHASE2', 'PHASE3', 'PHASE4', 'NA'],
                            type: 'string',
                        },
                        status: {
                            default: 'RECRUITING',
                            description: 'Trial recruitment status',
                            enum: ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'COMPLETED', 'NOT_YET_RECRUITING', 'ANY'],
                            type: 'string',
                        },
                    },
                    required: ['condition'],
                    type: 'object',
                },
                url: `${baseUrl}/api/plugins/clinical-trials/search`,
            },
        ],
        author: 'Phở Chat',
        homepage: 'https://pho.chat/plugins/clinical-trials',
        identifier: 'clinical-trials',
        meta: {
            avatar: '🏥',
            description:
                'Search ClinicalTrials.gov for active and completed clinical studies by condition, drug, location, and phase',
            tags: ['clinical-trials', 'medical', 'research', 'FDA', 'studies'],
            title: 'Clinical Trials Search',
        },
        settings: { properties: {}, type: 'object' },
        type: 'default',
        version: '1',
    };

    return NextResponse.json(manifest);
}
