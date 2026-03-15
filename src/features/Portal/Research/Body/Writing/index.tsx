'use client';

import { Button, Tag } from '@lobehub/ui';
import { Input, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { Copy, FileText, Loader2, Sparkles } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { type ArticleType, useResearchStore } from '@/store/research';

// ── Article type label map ─────────────────────────────────────────────────
const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
    'meta-analysis': 'Meta-analysis',
    'narrative-review': 'Narrative Review',
    'rapid-review': 'Rapid Review',
    'scoping-review': 'Scoping Review',
    'systematic-review': 'Systematic Review',
    'umbrella-review': 'Umbrella Review',
};

// ── Per-type AI system instructions for each section ──────────────────────
const AI_PROMPTS: Record<ArticleType, Record<string, string>> = {
    'meta-analysis': {
        abstract: 'Write a structured abstract for a meta-analysis with Background, Objectives, Methods (including search strategy, statistical methods for pooling), Results (pooled effect sizes, I², heterogeneity), Conclusions sections. 300 words max.',
        conclusion: 'Write conclusions for a meta-analysis summarizing pooled effect estimates, clinical implications, and recommendations. 150 words.',
        discussion: 'Write a discussion section for a meta-analysis addressing: summary of pooled findings, heterogeneity, comparison with existing meta-analyses, subgroup findings, limitations (publication bias, study quality), clinical implications.',
        introduction: 'Write an introduction for a meta-analysis: background, rationale for quantitative synthesis, and objective to estimate pooled effect size. 3 paragraphs.',
        methods: 'Write a meta-analysis Methods section covering: search strategy, eligibility criteria (PICO), data extraction, statistical methods (random/fixed effects, I², Q-test, sensitivity analysis, publication bias assessment).',
        results: 'Write a meta-analysis Results section: study selection (PRISMA), study characteristics, pooled effect sizes, forest plot findings, heterogeneity (I², Q), sensitivity and subgroup analyses.',
        statistical_analysis: 'Write the Statistical Analysis subsection: specify meta-analytic model (random-effects or fixed-effects), software used, effect measure (OR/RR/MD/SMD), heterogeneity assessment (I², Q-test, τ²), subgroup analysis plan, sensitivity analysis, and publication bias tests (Egger, funnel plot).',
        title: 'Generate 3 alternative academic titles for this meta-analysis. Include the intervention, outcome, and "Meta-Analysis" in each. Format as a numbered list.',
    },
    'narrative-review': {
        abstract: 'Write a narrative review abstract summarizing the topic, scope, key themes discussed, and conclusions. 200 words max.',
        conclusion: 'Write conclusions for a narrative review with key takeaways and future directions. 150 words.',
        discussion: 'Write a thematic discussion synthesizing major points from the literature, identifying agreements, controversies, and knowledge gaps.',
        introduction: 'Write a narrative review introduction: importance of the topic, scope and aim of the review. 2–3 paragraphs.',
        methods: 'Briefly describe the approach: sources consulted, time period covered, and scope of the review. Note that this is not a systematic search.',
        results: 'Organize findings thematically. Present key studies and their contributions to the topic. Use narrative synthesis, not statistical pooling.',
        title: 'Generate 3 alternative titles for this narrative review. Format as a numbered list.',
    },
    'rapid-review': {
        abstract: 'Write a structured abstract for a rapid review with Background, Objectives, Methods (streamlined search), Results, Conclusions. 250 words max.',
        conclusion: 'Write conclusions for a rapid review with key findings and recommendations. Note the streamlined methodology. 150 words.',
        discussion: 'Write a discussion for a rapid review: summary, comparison with full systematic reviews, limitations of the rapid approach, and implications.',
        introduction: 'Write a rapid review introduction: urgency or context requiring rapid synthesis, and objectives. 2 paragraphs.',
        methods: 'Write a rapid review Methods section: streamlined search strategy (limited databases/dates), eligibility criteria, rapid quality appraisal method.',
        results: 'Write a rapid review Results section: study selection, characteristics, and narrative synthesis of key findings.',
        title: 'Generate 3 alternative titles for this rapid review. Include "Rapid Review" in each. Format as a numbered list.',
    },
    'scoping-review': {
        abstract: 'Write a structured abstract for a scoping review with Background, Objectives, Methods (PRISMA-ScR), Results (scope of evidence mapped), Conclusions. 250 words max.',
        charting: 'Present the charted data: map the extent, nature, and distribution of evidence. Use thematic categories. Identify research gaps.',
        conclusion: 'Write conclusions for a scoping review identifying evidence gaps and recommendations for future research. 150 words.',
        discussion: 'Write a discussion for a scoping review: overview of mapped evidence, gaps identified, comparison with existing reviews, implications for future research and policy.',
        introduction: 'Write a scoping review introduction: broad topic context, rationale for scoping (not systematic) approach, research questions. 3 paragraphs.',
        methods: 'Write a scoping review Methods section following PRISMA-ScR: search strategy, eligibility criteria (PCC framework), charting the data process.',
        title: 'Generate 3 alternative titles for this scoping review. Include "Scoping Review" in each. Format as a numbered list.',
    },
    'systematic-review': {
        abstract: 'Write a structured abstract with Background, Objectives, Methods, Results, Conclusions sections. 250 words max.',
        conclusion: 'Write a concise conclusion paragraph summarizing key findings and recommendations for practice. 150 words.',
        discussion: 'Write an academic discussion section addressing: summary of findings, comparison with literature, limitations, and clinical implications.',
        introduction: 'Write an academic introduction with: background context, problem statement, and study objectives. 3 paragraphs.',
        methods: 'Write a systematic review Methods section covering: search strategy, inclusion/exclusion criteria, data extraction, and quality assessment following PRISMA 2020.',
        results: 'Write a systematic review Results section covering: study selection (with numbers), study characteristics, and main findings synthesis.',
        title: 'Generate 3 alternative academic titles for this systematic review. Format as a numbered list.',
    },
    'umbrella-review': {
        abstract: 'Write a structured abstract for an umbrella review with Background, Objectives, Methods (review of reviews), Results (overlap, concordance), Conclusions. 250 words max.',
        conclusion: 'Write conclusions for an umbrella review summarizing concordance across reviews and recommendations. 150 words.',
        discussion: 'Write a discussion for an umbrella review: concordance of findings across reviews, quality of existing reviews, overlap degree, limitations, and implications.',
        introduction: 'Write an umbrella review introduction: explain why a review-of-reviews is needed, describe existing SRs/MAs, and state objectives. 3 paragraphs.',
        methods: 'Write an umbrella review Methods section: search for systematic reviews/meta-analyses, eligibility criteria, AMSTAR-2 quality assessment, overlap analysis (CCA).',
        results: 'Write an umbrella review Results: characteristics of included reviews, quality (AMSTAR-2), overlap assessment, concordance of findings across reviews.',
        title: 'Generate 3 alternative titles for this umbrella review. Include "Umbrella Review" in each. Format as a numbered list.',
    },
};

// ── Per-type section definitions ──────────────────────────────────────────
const getSectionsForType = (articleType: ArticleType): { content: string; key: string; label: string; placeholder: string }[] => {
    const base = [
        { content: '', key: 'title', label: 'Title', placeholder: `${ARTICLE_TYPE_LABELS[articleType]}: [Your research question]` },
        { content: '', key: 'abstract', label: 'Abstract', placeholder: 'Background, Methods, Results, Conclusions...' },
        { content: '', key: 'introduction', label: 'Introduction', placeholder: 'Background context, rationale, and objectives...' },
        { content: '', key: 'methods', label: 'Methods', placeholder: 'Search strategy, eligibility criteria, data extraction, quality assessment...' },
    ];

    // Type-specific middle sections
    if (articleType === 'meta-analysis') {
        base.push(
            { content: '', key: 'results', label: 'Results', placeholder: 'Study selection (PRISMA), study characteristics, pooled effect sizes, forest plot...' },
            { content: '', key: 'statistical_analysis', label: 'Statistical Analysis', placeholder: 'Meta-analytic model, effect measure, heterogeneity assessment, sensitivity analysis...' },
        );
    } else if (articleType === 'scoping-review') {
        base.push(
            { content: '', key: 'results', label: 'Results', placeholder: 'Study selection (PRISMA-ScR), study characteristics...' },
            { content: '', key: 'charting', label: 'Charting the Data', placeholder: 'Map the extent, nature, and distribution of evidence. Identify gaps...' },
        );
    } else {
        base.push(
            { content: '', key: 'results', label: 'Results', placeholder: 'Study selection, study characteristics, synthesis of results...' },
        );
    }

    base.push(
        { content: '', key: 'discussion', label: 'Discussion', placeholder: 'Summary of evidence, limitations, implications for practice...' },
        { content: '', key: 'conclusion', label: 'Conclusion', placeholder: 'Key findings and recommendations...' },
        { content: '', key: 'references', label: 'References', placeholder: 'Auto-generated from included papers...' },
    );

    return base;
};

// ── AI Writing helper ────────────────────────────────────────────────────
const aiWriteSection = async (
    sectionKey: string,
    sectionLabel: string,
    existingContent: string,
    articleType: ArticleType,
    context: {
        pico: { comparison: string; intervention: string; outcome: string; population: string } | null;
        query: string;
        refs: string;
    },
): Promise<string> => {
    const typePrompts = AI_PROMPTS[articleType] ?? AI_PROMPTS['systematic-review'];
    const typeLabel = ARTICLE_TYPE_LABELS[articleType];
    const instruction = typePrompts[sectionKey] ?? `Write the ${sectionLabel} section for a ${typeLabel}.`;

    const picoText = context.pico
        ? `PICO: P=${context.pico.population}, I=${context.pico.intervention}, C=${context.pico.comparison}, O=${context.pico.outcome}`
        : `Research question: ${context.query}`;

    const prompt = [
        `You are writing a ${typeLabel} article.`,
        instruction,
        '',
        picoText,
        existingContent ? `\nExisting draft (improve this):\n${existingContent}` : '',
        context.refs ? `\nKey references:\n${context.refs}` : '',
        '\nRespond in English. Academic register. Use markdown formatting.',
    ].join('\n');

    try {
        const res = await fetch('/api/chat/direct', {
            body: JSON.stringify({
                messages: [{ content: prompt, role: 'user' }],
                model: 'gpt-4o-mini',
                stream: false,
                temperature: 0.6,
            }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
        if (!res.ok) throw new Error('fail');
        const data = await res.json();
        return data?.choices?.[0]?.message?.content ?? data?.content ?? '';
    } catch {
        // Fallback: template scaffold
        const templates: Record<string, string> = {
            abstract: `## Abstract\n\n**Background:** ${context.query}\n\n**Methods:** ${typeLabel} following ${articleType === 'scoping-review' ? 'PRISMA-ScR' : 'PRISMA'} guidelines.\n\n**Results:** [number] studies included.\n\n**Conclusions:** Further research warranted.`,
            charting: `## Charting the Data\n\n### Evidence Map\n[Map the scope and distribution of evidence across key themes.]\n\n### Research Gaps\n[Identify areas with insufficient evidence.]`,
            conclusion: `This ${typeLabel.toLowerCase()} examined ${context.query}. The evidence suggests that [key finding]. Future research should focus on [gap].`,
            discussion: `## Discussion\n\nThis ${typeLabel.toLowerCase()} identified [n] relevant studies. Our findings are consistent with [prior work]. Limitations include [search scope, language bias]. ${articleType === 'meta-analysis' ? 'Clinical implications: [recommendation based on pooled estimates].' : 'Implications: [recommendation].'}`,
            introduction: `## Introduction\n\n${context.query} represents an important area of inquiry.\n\nThe objective of this ${typeLabel.toLowerCase()} was to synthesize available evidence on this topic.`,
            methods: `## Methods\n\n### Search Strategy\nSearched PubMed, OpenAlex, and ClinicalTrials.gov.\n\n### ${picoText}\n\n### Eligibility Criteria\nIncluded: peer-reviewed studies addressing the ${articleType === 'scoping-review' ? 'PCC' : 'PICO'}.`,
            results: `## Results\n\n### Study Selection\n[n] records identified, [m] included after screening.\n\n### Characteristics of Included Studies\n[Describe study designs, sample sizes, populations].`,
            statistical_analysis: `## Statistical Analysis\n\n### Meta-analytic model\n[Random-effects / fixed-effects model using DerSimonian-Laird]\n\n### Heterogeneity\n[I², Q-test, τ²]\n\n### Sensitivity Analysis\n[Leave-one-out, influence analysis]`,
            title: `1. ${context.pico?.intervention ?? '[intervention]'} in ${context.pico?.population ?? '[population]'}: A ${typeLabel}\n2. ${context.query}: A ${typeLabel}\n3. ${context.pico?.intervention ?? '[intervention]'} versus ${context.pico?.comparison ?? '[comparison]'}: A ${typeLabel}`,
        };
        return templates[sectionKey] ?? `[AI-generated ${sectionLabel} section - edit as needed]`;
    }
};

const useStyles = createStyles(({ css, token }) => ({
    container: css`
    width: 100%;
  `,
    emptyState: css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;

    padding: 48px 24px;

    color: ${token.colorTextQuaternary};
    text-align: center;
  `,
    sectionCard: css`
    padding: 12px 16px;

    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    transition: all 0.2s;

    &:hover {
      border-color: ${token.colorPrimaryBorder};
    }
  `,
    sectionHeader: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;

    font-size: 13px;
    font-weight: 700;
    color: ${token.colorText};
  `,
    sectionLabel: css`
    display: flex;
    gap: 8px;
    align-items: center;

    font-size: 13px;
    font-weight: 700;
    color: ${token.colorText};
  `,
    sectionTitle: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
  `,
    statItem: css`
    display: flex;
    gap: 6px;
    align-items: center;

    font-size: 13px;
    font-weight: 600;
  `,
    statsCard: css`
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;

    padding: 12px 16px;

    background: linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorFillQuaternary} 100%);
    border: 1px solid ${token.colorPrimaryBorder};
    border-radius: ${token.borderRadiusLG}px;
  `,
    wordCount: css`
    font-size: 11px;
    font-weight: 400;
    color: ${token.colorTextQuaternary};
  `,
}));

const { TextArea } = Input;

const WritingPhase = memo(() => {
    const { styles } = useStyles();

    const papers = useResearchStore((s) => s.papers);
    const screeningDecisions = useResearchStore((s) => s.screeningDecisions);
    const pico = useResearchStore((s) => s.pico);
    const searchQuery = useResearchStore((s) => s.searchQuery);
    const setActivePhase = useResearchStore((s) => s.setActivePhase);
    const articleType = useResearchStore((s) => s.articleType);
    const typeLabel = ARTICLE_TYPE_LABELS[articleType];

    const includedPapers = papers.filter((p) => screeningDecisions[p.id]?.decision === 'included');

    // Section state — driven by article type
    const [sections, setSections] = useState(() => {
        const filled = getSectionsForType(articleType).map((s) => ({ ...s }));

        if (searchQuery) filled[0].content = `${typeLabel}: ${searchQuery}`;

        const methodsIdx = filled.findIndex((s) => s.key === 'methods');
        if (methodsIdx >= 0 && pico) {
            filled[methodsIdx].content = [
                '## Search Strategy',
                `Research Question: ${searchQuery}`,
                '',
                '### PICO Framework',
                `- **Population:** ${pico.population}`,
                `- **Intervention:** ${pico.intervention}`,
                `- **Comparison:** ${pico.comparison}`,
                `- **Outcome:** ${pico.outcome}`,
                '',
                '### Databases Searched',
                '- PubMed (MEDLINE)',
                '- OpenAlex',
                '',
                '### Selection Criteria',
                `- ${includedPapers.length} studies included after screening`,
                `- ${papers.length - includedPapers.length} studies excluded`,
            ].join('\n');
        }

        const refsIdx = filled.findIndex((s) => s.key === 'references');
        if (refsIdx >= 0) {
            filled[refsIdx].content = includedPapers.map((p, i) =>
                `${i + 1}. ${p.authors}. ${p.title}. ${p.journal || 'N/A'}. ${p.year}. ${p.doi ? `DOI: ${p.doi}` : ''}`,
            ).join('\n');
        }

        return filled;
    });

    const [expandedSection, setExpandedSection] = useState<string | null>('title');
    // Track which sections are AI-generating
    const [aiGenerating, setAiGenerating] = useState<Record<string, boolean>>({});

    const updateSection = (key: string, content: string) => {
        setSections((prev) => prev.map((s) => s.key === key ? { ...s, content } : s));
    };

    // AI write a section — MED-40
    const handleAIWrite = useCallback(async (sectionKey: string, sectionLabel: string, existingContent: string) => {
        setAiGenerating((prev) => ({ ...prev, [sectionKey]: true }));
        setExpandedSection(sectionKey); // open the section
        const refsText = includedPapers.slice(0, 8).map((p) =>
            `- ${p.authors} (${p.year}). ${p.title}`,
        ).join('\n');
        try {
            const result = await aiWriteSection(sectionKey, sectionLabel, existingContent, articleType, {
                pico, query: searchQuery, refs: refsText,
            });
            updateSection(sectionKey, result);
        } finally {
            setAiGenerating((prev) => ({ ...prev, [sectionKey]: false }));
        }
    }, [includedPapers, pico, searchQuery, articleType]);

    const totalWords = sections.reduce((sum, s) => sum + (s.content ? s.content.split(/\s+/).filter(Boolean).length : 0), 0);
    const completedSections = sections.filter((s) => s.content.trim().length > 0).length;

    const handleCopyAll = () => {
        const fullText = sections
            .filter((s) => s.content.trim())
            .map((s) => `# ${s.label}\n\n${s.content}`)
            .join('\n\n---\n\n');
        navigator.clipboard.writeText(fullText);
    };

    return (
        <Flexbox className={styles.container} gap={12}>
            {/* Writing Stats */}
            <div className={styles.statsCard}>
                <Flexbox gap={16} horizontal wrap={'wrap'}>
                    <span className={styles.statItem}>📝 {totalWords} words</span>
                    <span className={styles.statItem}>📄 {completedSections}/{sections.length} sections</span>
                    <span className={styles.statItem}>📚 {includedPapers.length} references</span>
                </Flexbox>
                <Button icon={<Copy size={14} />} onClick={handleCopyAll} size={'small'}>
                    Copy All
                </Button>
            </div>

            {/* Section Cards */}
            <Flexbox gap={8}>
                <span className={styles.sectionTitle}>✍️ Manuscript Sections</span>
                {sections.map((section, idx) => (
                    <div className={styles.sectionCard} key={section.key}>
                        <div
                            className={styles.sectionHeader}
                            onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
                        >
                            <span className={styles.sectionLabel}>
                                <FileText size={14} />
                                {idx + 1}. {section.label}
                                {section.content.trim() && (
                                    <Tag color="green" style={{ fontSize: 10 }}>✓</Tag>
                                )}
                                {aiGenerating[section.key] && (
                                    <Tag color="purple" style={{ fontSize: 9 }}>AI đang viết...</Tag>
                                )}
                            </span>
                            <Flexbox align={'center'} gap={4} horizontal onClick={(e) => e.stopPropagation()}>
                                {/* AI Write Button — MED-40 */}
                                {section.key !== 'references' && (
                                    <Tooltip title={`AI viết ${section.label} dựa trên PICO và paper chọn`}>
                                        <button
                                            disabled={aiGenerating[section.key]}
                                            onClick={() => handleAIWrite(section.key, section.label, section.content)}
                                            style={{
                                                alignItems: 'center',
                                                background: 'linear-gradient(135deg, rgba(114,46,209,0.12), rgba(22,119,255,0.08))',
                                                border: '1px solid rgba(114,46,209,0.3)',
                                                borderRadius: 6,
                                                color: '#722ed1',
                                                cursor: aiGenerating[section.key] ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                gap: 4,
                                                padding: '3px 8px',
                                            }}
                                            type="button"
                                        >
                                            {aiGenerating[section.key]
                                                ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                                                : <Sparkles size={11} />}
                                            AI
                                        </button>
                                    </Tooltip>
                                )}
                                <span className={styles.wordCount}>
                                    {section.content ? section.content.split(/\s+/).filter(Boolean).length : 0} words
                                    {expandedSection === section.key ? ' ▲' : ' ▼'}
                                </span>
                            </Flexbox>
                        </div>
                        {expandedSection === section.key && (
                            <div style={{ marginTop: 8 }}>
                                <TextArea
                                    autoSize={{ maxRows: 20, minRows: 4 }}
                                    onChange={(e) => updateSection(section.key, e.target.value)}
                                    placeholder={section.placeholder}
                                    style={{ fontSize: 13, lineHeight: 1.6 }}
                                    value={section.content}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </Flexbox>

            {/* Phase Navigation */}
            <Flexbox gap={8} horizontal justify={'space-between'}>
                <Button onClick={() => setActivePhase('analysis')} size={'small'}>
                    ← Back to Analysis
                </Button>
                <Button onClick={() => setActivePhase('publishing')} size={'small'} type={'primary'}>
                    → Proceed to Publishing
                </Button>
            </Flexbox>
        </Flexbox>
    );
});

WritingPhase.displayName = 'WritingPhase';

export default WritingPhase;
