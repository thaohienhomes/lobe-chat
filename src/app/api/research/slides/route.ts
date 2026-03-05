import { NextRequest, NextResponse } from 'next/server';

/**
 * /api/research/slides
 * Generate structured academic presentation slides from research data.
 * Returns a JSON slide deck suitable for rendering or PPTX export.
 */

export interface Slide {
    bullets?: string[];
    content?: string;
    layout: 'title' | 'content' | 'two-column' | 'table' | 'quote';
    notes?: string;
    subtitle?: string;
    tableData?: { headers: string[]; rows: string[][] };
    title: string;
}

export interface SlideDeck {
    generatedAt: string;
    query: string;
    slides: Slide[];
    theme: 'academic' | 'medical' | 'minimal';
}

interface RequestBody {
    includedCount: number;
    papers: Array<{
        authors: string;
        doi?: string;
        journal?: string;
        title: string;
        year: number;
    }>;
    pico?: {
        comparison: string;
        intervention: string;
        outcome: string;
        population: string;
    };
    query: string;
    theme?: 'academic' | 'medical' | 'minimal';
    totalScreened: number;
}

const buildSlideDeck = (body: RequestBody): SlideDeck => {
    const { query, pico, papers, includedCount, totalScreened, theme = 'medical' } = body;
    const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

    const slides: Slide[] = [];

    // Slide 1: Title
    slides.push({
        layout: 'title',
        notes: 'Welcome the audience. State your name, institution, and the purpose of this presentation.',
        subtitle: `Systematic Review Presentation · ${today}`,
        title: `Systematic Review:\n${query}`,
    });

    // Slide 2: Agenda
    slides.push({
        bullets: [
            '1. Background & Rationale',
            '2. Research Question & PICO',
            '3. Methods & Search Strategy',
            '4. Study Selection (PRISMA)',
            '5. Key Findings',
            '6. Quality of Evidence (GRADE)',
            '7. Clinical Implications',
            '8. Conclusions',
        ],
        layout: 'content',
        notes: 'Briefly walk through the agenda. This presentation will cover approximately 15-20 minutes.',
        title: 'Agenda',
    });

    // Slide 3: Background
    slides.push({
        bullets: [
            `Topic: ${query}`,
            'Current clinical/scientific gap this review addresses',
            'Why a systematic review is needed',
            'Who benefits from this evidence synthesis',
        ],
        layout: 'content',
        notes: 'Explain the clinical or scientific gap. Why is this topic important? What is the unmet need?',
        title: 'Background & Rationale',
    });

    // Slide 4: PICO / Research Question
    if (pico) {
        slides.push({
            layout: 'table',
            notes: `The PICO framework defines the boundaries of this systematic review: Population=${pico.population}, Intervention=${pico.intervention}, Comparison=${pico.comparison}, Outcome=${pico.outcome}`,
            tableData: {
                headers: ['Component', 'Definition'],
                rows: [
                    ['Population (P)', pico.population],
                    ['Intervention (I)', pico.intervention],
                    ['Comparison (C)', pico.comparison],
                    ['Outcome (O)', pico.outcome],
                ],
            },
            title: 'Research Question (PICO)',
        });
    } else {
        slides.push({
            bullets: [
                `Research question: ${query}`,
                'Structured to evaluate existing evidence systematically',
                'PRISMA 2020 guidelines followed',
            ],
            layout: 'content',
            notes: 'State the research question clearly and explain why the PRISMA framework was chosen.',
            title: 'Research Question',
        });
    }

    // Slide 5: Methods
    slides.push({
        bullets: [
            'Databases: PubMed (MEDLINE), OpenAlex, ArXiv, ClinicalTrials.gov',
            `Search date: ${today}`,
            `Search terms: "${query}"`,
            'No date restriction applied to capture full evidence base',
            'PRISMA 2020 reporting guidelines followed',
            'Quality assessment: GRADE framework',
        ],
        layout: 'content',
        notes: 'Explain the systematic search methodology. Emphasize the comprehensive multi-database approach and adherence to PRISMA standards.',
        title: 'Methods: Search Strategy',
    });

    // Slide 6: PRISMA flow
    slides.push({
        bullets: [
            `📥 Records identified: ${totalScreened} (across all databases)`,
            `🔍 Records screened: ${totalScreened}`,
            `❌ Records excluded: ${totalScreened - includedCount}`,
            `✅ Studies included in review: ${includedCount}`,
        ],
        layout: 'content',
        notes: `Explain the PRISMA diagram step by step. A total of ${totalScreened} records were identified, and after systematic screening, ${includedCount} met all inclusion criteria.`,
        title: 'Study Selection (PRISMA Flow)',
    });

    // Slide 7: Study Characteristics
    const topPapers = papers.slice(0, 5);
    if (topPapers.length > 0) {
        slides.push({
            layout: 'table',
            notes: 'Walk through the key characteristics of the included studies. Note the range of study designs and publication years.',
            tableData: {
                headers: ['#', 'Study', 'Journal', 'Year'],
                rows: topPapers.map((p, i) => [
                    String(i + 1),
                    p.title.length > 60 ? `${p.title.slice(0, 57)}...` : p.title,
                    p.journal ?? 'N/A',
                    String(p.year),
                ]),
            },
            title: `Key Included Studies (${includedCount} total)`,
        });
    }

    // Slide 8: Key Findings
    slides.push({
        bullets: [
            '[Summarize the primary finding across studies]',
            '[Note the direction and consistency of evidence]',
            '[Quantify effect size or OR/HR/RR if available]',
            '[Note subgroup findings if applicable]',
            '[Mention any conflicting results]',
        ],
        layout: 'content',
        notes: 'This slide requires researcher input. Fill in the actual findings from the included studies. Use specific numbers and effect measures.',
        title: 'Key Findings',
    });

    // Slide 9: GRADE / Evidence Quality
    slides.push({
        layout: 'table',
        notes: 'GRADE assessment helps the audience understand the certainty of the evidence. Explain each domain briefly.',
        tableData: {
            headers: ['Domain', 'Assessment', 'Reason'],
            rows: [
                ['Risk of Bias', '⚠️ To assess', 'RoB 2 / ROBINS-I required'],
                ['Inconsistency', '⚠️ To assess', 'Compare I² across studies'],
                ['Indirectness', '⚠️ To assess', 'PICO population alignment'],
                ['Imprecision', '⚠️ To assess', 'Width of confidence intervals'],
                ['Publication Bias', '⚠️ To assess', 'Funnel plot if ≥10 studies'],
                ['Overall GRADE', '[To be assessed]', `Based on ${includedCount} included studies`],
            ],
        },
        title: 'Quality of Evidence (GRADE)',
    });

    // Slide 10: Limitations
    slides.push({
        bullets: [
            'Geographic/language limitations of included studies',
            'Heterogeneity in study populations and interventions',
            'Risk of publication bias',
            'Gray literature not systematically searched',
            '[Add specific limitations of this review]',
        ],
        layout: 'content',
        notes: 'Be transparent about limitations. This builds credibility and helps the audience contextualize the findings.',
        title: 'Limitations',
    });

    // Slide 11: Clinical Implications
    slides.push({
        bullets: [
            '[Key takeaway for clinical practice]',
            '[Recommendation strength based on GRADE]',
            '[Patient subgroups most likely to benefit]',
            '[Cost-effectiveness considerations]',
            '[Implementation barriers]',
        ],
        layout: 'content',
        notes: 'Connect the evidence to practical clinical or policy decisions. What should change in practice based on this evidence?',
        title: 'Clinical & Policy Implications',
    });

    // Slide 12: Conclusions
    slides.push({
        bullets: [
            `This systematic review of ${includedCount} studies examined: ${query}`,
            '[Main conclusion stated clearly]',
            '[Evidence certainty level]',
            '[Research gaps identified]',
            'Generated with Phở Chat Research Mode',
        ],
        layout: 'content',
        notes: 'Conclude with the key message. What is the single most important takeaway from this systematic review?',
        title: 'Conclusions',
    });

    // Slide 13: References
    const refSlides = papers.slice(0, 8);
    slides.push({
        bullets: refSlides.map((p, i) =>
            `${i + 1}. ${p.authors.split(',')[0]} et al. (${p.year}). ${p.title.slice(0, 80)}... ${p.journal ?? ''}`,
        ),
        layout: 'content',
        notes: 'Full reference list. Ensure all references are complete before the presentation.',
        title: 'References (Selected)',
    });

    // Slide 14: Q&A
    slides.push({
        layout: 'title',
        notes: 'Open the floor for questions. Be prepared to elaborate on methodology, specific findings, or clinical applications.',
        subtitle: 'Thank you for your attention',
        title: 'Questions & Discussion',
    });

    return {
        generatedAt: new Date().toISOString(),
        query,
        slides,
        theme,
    };
};

export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json();

        if (!body.query) {
            return NextResponse.json({ error: 'Research query is required' }, { status: 400 });
        }

        const deck = buildSlideDeck(body);
        return NextResponse.json(deck);
    } catch (error: any) {
        console.error('[Slides] Error:', error?.message);
        return NextResponse.json(
            { error: error?.message ?? 'Slide generation failed' },
            { status: 500 },
        );
    }
}
