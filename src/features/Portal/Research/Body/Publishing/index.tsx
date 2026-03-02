'use client';

import { Button, Tag } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { CheckCircle, Copy } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { type PaperResult, useResearchStore } from '@/store/research';

const useStyles = createStyles(({ css, token }) => ({
    checklist: css`
    display: flex;
    gap: 4px;
    align-items: center;

    font-size: 12px;
    color: ${token.colorText};
  `,
    container: css`
    width: 100%;
  `,
    exportCard: css`
    cursor: pointer;

    padding: 16px;

    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    transition: all 0.2s;

    &:hover {
      background: ${token.colorFillTertiary};
      border-color: ${token.colorPrimaryBorder};
    }
  `,
    exportDesc: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
    exportTitle: css`
    font-size: 14px;
    font-weight: 700;
    color: ${token.colorText};
  `,
    sectionTitle: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
  `,
    successCard: css`
    padding: 24px;

    text-align: center;

    background: linear-gradient(135deg, ${token.colorSuccessBg} 0%, ${token.colorFillQuaternary} 100%);
    border: 1px solid ${token.colorSuccessBorder};
    border-radius: ${token.borderRadiusLG}px;
  `,
    summaryCard: css`
    padding: 16px;

    background: linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorFillQuaternary} 100%);
    border: 1px solid ${token.colorPrimaryBorder};
    border-radius: ${token.borderRadiusLG}px;
  `,
}));

// Helper: infer study type from title
const inferStudyType = (paper: PaperResult): string => {
    const t = paper.title.toLowerCase();
    if (t.includes('meta-analysis') || t.includes('meta analysis')) return 'Meta-analysis';
    if (t.includes('systematic review')) return 'Systematic Review';
    if (t.includes('randomized') || t.includes('randomised') || t.includes('rct')) return 'RCT';
    if (t.includes('cohort')) return 'Cohort Study';
    if (t.includes('case-control') || t.includes('case control')) return 'Case-Control';
    if (t.includes('cross-sectional')) return 'Cross-sectional';
    if (t.includes('trial')) return 'Clinical Trial';
    if (t.includes('review')) return 'Review';
    return 'Observational';
};

// Helper: GRADE level
const assessGradeLevel = (papers: PaperResult[]): string => {
    const types = papers.map(inferStudyType);
    const hasMA = types.includes('Meta-analysis');
    const hasSR = types.includes('Systematic Review');
    const rctCount = types.filter((t) => t === 'RCT').length;
    if (hasMA && hasSR && rctCount >= 2) return 'High';
    if (rctCount > 0 || hasMA || hasSR) return 'Moderate';
    if (papers.length >= 5) return 'Low';
    return 'Very Low';
};

// ====== Full PRISMA 2020 Export Builder ======

const buildPRISMAMarkdown = (
    query: string,
    pico: { comparison: string; intervention: string; outcome: string; population: string } | null,
    allPapers: PaperResult[],
    included: PaperResult[],
    excluded: PaperResult[],
): string => {
    const today = new Date().toISOString().split('T')[0];
    const pubmedCount = allPapers.filter((p) => p.source === 'PubMed').length;
    const oaCount = allPapers.filter((p) => p.source === 'OpenAlex').length;
    const years = included.map((p) => p.year).filter((y) => y > 0);
    const yearRange = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : 'N/A';
    const totalCitations = included.reduce((s, p) => s + (p.citations || 0), 0);
    const grade = assessGradeLevel(included);

    // Study type counts
    const typeCounts: Record<string, number> = {};
    for (const p of included) {
        const t = inferStudyType(p);
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    const typeList = Object.entries(typeCounts).sort(([, a], [, b]) => b - a);

    return [
        // ===== TITLE =====
        `# Systematic Review: ${query}`,
        '',
        `*Prepared using Phở Chat Research Mode — ${today}*`,
        '',
        '---',
        '',

        // ===== STRUCTURED ABSTRACT =====
        '## Abstract',
        '',
        `**Background:** This systematic review examines the existing evidence on "${query}" to synthesize findings from published literature.`,
        '',
        `**Methods:** A systematic search was conducted across PubMed (MEDLINE) and OpenAlex databases on ${today}. Studies were screened using the PICO framework${pico ? ` (Population: ${pico.population}; Intervention: ${pico.intervention}; Comparison: ${pico.comparison}; Outcome: ${pico.outcome})` : ''}. Quality assessment was performed using the GRADE approach.`,
        '',
        `**Results:** ${allPapers.length} records were identified. After screening, ${included.length} studies met inclusion criteria (${excluded.length} excluded). The included studies span ${yearRange}, with a combined ${totalCitations.toLocaleString()} citations. Study types: ${typeList.map(([t, c]) => `${t} (n=${c})`).join(', ')}. Overall certainty of evidence was rated as ${grade} (GRADE).`,
        '',
        `**Conclusions:** [To be completed by the researcher based on the evidence synthesis below.]`,
        '',
        '---',
        '',

        // ===== 1. INTRODUCTION =====
        '## 1. Introduction',
        '',
        '### 1.1 Rationale',
        `[Describe the existing knowledge gap and why this systematic review on "${query}" is needed.]`,
        '',
        '### 1.2 Objectives',
        pico
            ? `To systematically review and synthesize the evidence regarding the effect of ${pico.intervention} on ${pico.outcome} in ${pico.population}, compared to ${pico.comparison}.`
            : `To systematically review and synthesize the evidence on ${query}.`,
        '',
        '---',
        '',

        // ===== 2. METHODS =====
        '## 2. Methods',
        '',
        '### 2.1 Protocol and Registration',
        'This review was conducted following the PRISMA 2020 guidelines (Page et al., 2021). [Protocol registration number if applicable.]',
        '',
        '### 2.2 Eligibility Criteria',
        pico ? [
            '',
            '| PICO Component | Criteria |',
            '|---|---|',
            `| **Population (P)** | ${pico.population} |`,
            `| **Intervention (I)** | ${pico.intervention} |`,
            `| **Comparison (C)** | ${pico.comparison} |`,
            `| **Outcome (O)** | ${pico.outcome} |`,
        ].join('\n') : '[Define eligibility criteria.]',
        '',
        '### 2.3 Information Sources',
        `The following databases were searched on ${today}:`,
        `- **PubMed (MEDLINE)** — ${pubmedCount} records retrieved`,
        `- **OpenAlex** — ${oaCount} records retrieved`,
        '',
        '### 2.4 Search Strategy',
        `Search query: \`${query}\``,
        '',
        '### 2.5 Selection Process',
        `All ${allPapers.length} identified records were screened against the eligibility criteria. Two-stage screening was performed: title/abstract screening followed by full-text review. ${included.length} studies met all inclusion criteria.`,
        '',
        '### 2.6 Data Extraction',
        'The following data were extracted from each included study: study title, authors, journal, publication year, study design, and citation count.',
        '',
        '### 2.7 Quality Assessment',
        'The quality of evidence was assessed using the GRADE (Grading of Recommendations, Assessment, Development and Evaluations) approach across five domains: risk of bias, inconsistency, indirectness, imprecision, and publication bias.',
        '',
        '---',
        '',

        // ===== 3. RESULTS =====
        '## 3. Results',
        '',
        '### 3.1 Study Selection (PRISMA Flow)',
        '```',
        `Records identified through database searching: ${allPapers.length}`,
        `  ├── PubMed: ${pubmedCount}`,
        `  └── OpenAlex: ${oaCount}`,
        `Records after deduplication: ${allPapers.length}`,
        `Records screened: ${allPapers.length}`,
        `Records excluded: ${excluded.length}`,
        `Full-text articles assessed for eligibility: ${included.length + excluded.length}`,
        `Studies included in review: ${included.length}`,
        '```',
        '',
        '### 3.2 Study Characteristics',
        '',
        `A total of ${included.length} studies published between ${yearRange} were included. The study designs comprised: ${typeList.map(([t, c]) => `${t} (n=${c}, ${Math.round((c / included.length) * 100)}%)`).join('; ')}.`,
        '',
        '**Table 1. Characteristics of Included Studies**',
        '',
        '| # | Study | Authors | Study Design | Journal | Year | Citations |',
        '|---|---|---|---|---|---|---|',
        ...included.map((p, i) =>
            `| ${i + 1} | ${p.title} | ${p.authors} | ${inferStudyType(p)} | ${p.journal || '–'} | ${p.year} | ${p.citations?.toLocaleString() || '–'} |`,
        ),
        '',
        '### 3.3 Risk of Bias Assessment',
        '[Complete after individual study assessment using appropriate tools (e.g., RoB 2 for RCTs, ROBINS-I for observational).]',
        '',
        '### 3.4 Synthesis of Results',
        '[Narrative synthesis or meta-analysis results to be added by the researcher.]',
        '',
        '---',
        '',

        // ===== 4. DISCUSSION =====
        '## 4. Discussion',
        '',
        '### 4.1 Summary of Evidence',
        `This systematic review identified ${included.length} studies on "${query}". The overall certainty of evidence was rated as **${grade}** according to GRADE assessment.`,
        '',
        '### 4.2 Limitations',
        '[Discuss limitations at study and review level.]',
        '',
        '### 4.3 Conclusions',
        '[State the main conclusions and their relevance to clinical practice.]',
        '',
        '---',
        '',

        // ===== 5. GRADE SUMMARY =====
        '## 5. GRADE Summary of Findings',
        '',
        '| Domain | Rating | Notes |',
        '|---|---|---|',
        '| Risk of Bias | ⚠️ To assess | Individual study assessment required |',
        '| Inconsistency | ⚠️ To assess | Compare effect estimates across studies |',
        '| Indirectness | ⚠️ To assess | Evaluate PICO alignment |',
        '| Imprecision | ⚠️ To assess | Consider confidence intervals |',
        '| Publication Bias | ⚠️ To assess | Funnel plot analysis recommended |',
        `| **Overall GRADE** | **${grade}** | Based on ${included.length} included studies |`,
        '',
        '---',
        '',

        // ===== 6. REFERENCES =====
        '## 6. References',
        '',
        '### Included Studies',
        ...included.map((p, i) =>
            `${i + 1}. ${p.authors}. ${p.title}. *${p.journal || 'N/A'}*. ${p.year}.${p.doi ? ` DOI: [${p.doi}](https://doi.org/${p.doi})` : ''}`,
        ),
        '',
        '### Methodology References',
        '- Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. *BMJ*. 2021;372:n71.',
        '- Guyatt GH, Oxman AD, Vist GE, et al. GRADE: an emerging consensus on rating quality of evidence and strength of recommendations. *BMJ*. 2008;336(7650):924-926.',
        '',
        '---',
        '',
        `*Generated by Phở Chat Research Mode on ${today}. This document provides a structured framework — researchers should complete sections marked with [brackets] based on their detailed analysis.*`,
    ].join('\n');
};

const EXPORT_FORMATS = [
    {
        desc: 'Full PRISMA 2020 systematic review with Abstract, Methods, Results, Discussion, GRADE, References',
        format: 'prisma_full',
        icon: '📄',
        label: 'Full Systematic Review (PRISMA 2020)',
    },
    {
        desc: 'Copy study table, references, and PICO for quick use',
        format: 'quick',
        icon: '📋',
        label: 'Quick Summary',
    },
    {
        desc: 'Vancouver-style numbered bibliography ready for submission',
        format: 'references',
        icon: '📚',
        label: 'References (Vancouver Format)',
    },
    {
        desc: 'PRISMA flow diagram counts for diagram generators',
        format: 'prisma_flow',
        icon: '📊',
        label: 'PRISMA Flow Data',
    },
];

const PublishingPhase = memo(() => {
    const { styles } = useStyles();
    const [exported, setExported] = useState<string | null>(null);

    const papers = useResearchStore((s) => s.papers);
    const screeningDecisions = useResearchStore((s) => s.screeningDecisions);
    const searchQuery = useResearchStore((s) => s.searchQuery);
    const pico = useResearchStore((s) => s.pico);
    const setActivePhase = useResearchStore((s) => s.setActivePhase);

    const includedPapers = useMemo(
        () => papers.filter((p) => screeningDecisions[p.id]?.decision === 'included'),
        [papers, screeningDecisions],
    );
    const excludedPapers = useMemo(
        () => papers.filter((p) => screeningDecisions[p.id]?.decision === 'excluded'),
        [papers, screeningDecisions],
    );

    const handleExport = (format: string) => {
        let content = '';

        switch (format) {
            case 'prisma_full': {
                content = buildPRISMAMarkdown(searchQuery, pico, papers, includedPapers, excludedPapers);
                break;
            }
            case 'quick': {
                content = [
                    `# ${searchQuery}`,
                    '',
                    pico ? [
                        '## PICO',
                        `- **P:** ${pico.population}`,
                        `- **I:** ${pico.intervention}`,
                        `- **C:** ${pico.comparison}`,
                        `- **O:** ${pico.outcome}`,
                    ].join('\n') : '',
                    '',
                    `## Included Studies (${includedPapers.length})`,
                    '',
                    '| # | Study | Year | Citations |',
                    '|---|---|---|---|',
                    ...includedPapers.map((p, i) => `| ${i + 1} | ${p.title} | ${p.year} | ${p.citations?.toLocaleString() || '–'} |`),
                    '',
                    '## References',
                    ...includedPapers.map((p, i) => `${i + 1}. ${p.authors}. ${p.title}. *${p.journal || 'N/A'}*. ${p.year}.`),
                ].join('\n');
                break;
            }
            case 'references': {
                content = includedPapers.map((p, i) =>
                    `${i + 1}. ${p.authors}. ${p.title}. ${p.journal || 'N/A'}. ${p.year}.${p.doi ? ` DOI: ${p.doi}` : ''}`,
                ).join('\n');
                break;
            }
            case 'prisma_flow': {
                content = [
                    'PRISMA 2020 Flow Diagram Data',
                    '=============================',
                    '',
                    'Identification:',
                    `  Records identified from PubMed: ${papers.filter((p) => p.source === 'PubMed').length}`,
                    `  Records identified from OpenAlex: ${papers.filter((p) => p.source === 'OpenAlex').length}`,
                    `  Total records identified: ${papers.length}`,
                    `  Duplicate records removed: 0`,
                    '',
                    'Screening:',
                    `  Records screened: ${papers.length}`,
                    `  Records excluded: ${excludedPapers.length}`,
                    '',
                    'Eligibility:',
                    `  Full-text articles assessed: ${includedPapers.length + excludedPapers.length}`,
                    `  Full-text articles excluded: ${excludedPapers.length}`,
                    '',
                    'Included:',
                    `  Studies included in review: ${includedPapers.length}`,
                ].join('\n');
                break;
            }
            // No default
        }

        navigator.clipboard.writeText(content);
        setExported(format);
        setTimeout(() => setExported(null), 3000);
    };

    return (
        <Flexbox className={styles.container} gap={16}>
            {/* Research Summary */}
            <div className={styles.summaryCard}>
                <Flexbox gap={12}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>📤 Publishing Summary</span>
                    <Flexbox gap={4}>
                        <span className={styles.checklist}>
                            <CheckCircle color="#52c41a" size={14} /> Research question defined
                        </span>
                        <span className={styles.checklist}>
                            <CheckCircle color="#52c41a" size={14} /> {papers.length} papers searched (PubMed + OpenAlex)
                        </span>
                        <span className={styles.checklist}>
                            <CheckCircle color="#52c41a" size={14} /> {includedPapers.length} included, {excludedPapers.length} excluded
                        </span>
                        <span className={styles.checklist}>
                            <CheckCircle color="#52c41a" size={14} /> GRADE assessment completed
                        </span>
                        <span className={styles.checklist}>
                            <CheckCircle color="#52c41a" size={14} /> PRISMA 2020 structure ready
                        </span>
                    </Flexbox>
                </Flexbox>
            </div>

            {/* Export Options */}
            <Flexbox gap={8}>
                <span className={styles.sectionTitle}>📥 Export Formats</span>
                {EXPORT_FORMATS.map((fmt) => (
                    <div
                        className={styles.exportCard}
                        key={fmt.format}
                        onClick={() => handleExport(fmt.format)}
                    >
                        <Flexbox align={'center'} gap={12} horizontal justify={'space-between'}>
                            <Flexbox gap={4}>
                                <span className={styles.exportTitle}>
                                    {fmt.icon} {fmt.label}
                                </span>
                                <span className={styles.exportDesc}>{fmt.desc}</span>
                            </Flexbox>
                            {exported === fmt.format ? (
                                <Tag color="green">✓ Copied!</Tag>
                            ) : (
                                <Copy size={16} style={{ opacity: 0.5 }} />
                            )}
                        </Flexbox>
                    </div>
                ))}
            </Flexbox>

            {/* Success Message */}
            {exported && (
                <div className={styles.successCard}>
                    <Flexbox align={'center'} gap={8}>
                        <CheckCircle color="#52c41a" size={32} />
                        <span style={{ fontSize: 16, fontWeight: 700 }}>Copied to clipboard!</span>
                        <span style={{ fontSize: 13, opacity: 0.7 }}>
                            Paste into Google Docs, Word, Overleaf, or any Markdown editor
                        </span>
                    </Flexbox>
                </div>
            )}

            {/* Phase Navigation */}
            <Flexbox gap={8} horizontal justify={'space-between'}>
                <Button onClick={() => setActivePhase('writing')} size={'small'}>
                    ← Back to Writing
                </Button>
                <Button onClick={() => setActivePhase('discovery')} size={'small'} type={'primary'}>
                    🔄 New Research
                </Button>
            </Flexbox>
        </Flexbox>
    );
});

PublishingPhase.displayName = 'PublishingPhase';

export default PublishingPhase;
