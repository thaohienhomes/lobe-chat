'use client';

import { Button, Tag } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { CheckCircle, Copy } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useResearchStore } from '@/store/research';

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

const EXPORT_FORMATS = [
    {
        desc: 'Copy formatted text with sections, references, and GRADE assessment',
        format: 'markdown',
        icon: '📋',
        label: 'Clipboard (Markdown)',
    },
    {
        desc: 'Generate bibliography in APA, Vancouver, or Harvard format',
        format: 'references',
        icon: '📚',
        label: 'References Only',
    },
    {
        desc: 'PRISMA flow diagram data with screening counts',
        format: 'prisma',
        icon: '📊',
        label: 'PRISMA Data',
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
            case 'markdown': {
                content = [
                    `# Systematic Review: ${searchQuery}`,
                    '',
                    '## PICO Framework',
                    pico ? [
                        `- **Population:** ${pico.population}`,
                        `- **Intervention:** ${pico.intervention}`,
                        `- **Comparison:** ${pico.comparison}`,
                        `- **Outcome:** ${pico.outcome}`,
                    ].join('\n') : 'N/A',
                    '',
                    '## Study Selection',
                    `- Total identified: ${papers.length}`,
                    `- Included: ${includedPapers.length}`,
                    `- Excluded: ${excludedPapers.length}`,
                    '',
                    '## Included Studies',
                    '',
                    '| # | Study | Authors | Journal | Year | Source | Citations |',
                    '|---|---|---|---|---|---|---|',
                    ...includedPapers.map((p, i) =>
                        `| ${i + 1} | ${p.title} | ${p.authors} | ${p.journal || '-'} | ${p.year} | ${p.source} | ${p.citations || '-'} |`,
                    ),
                    '',
                    '## References',
                    ...includedPapers.map((p, i) =>
                        `${i + 1}. ${p.authors}. ${p.title}. *${p.journal || 'N/A'}*. ${p.year}.${p.doi ? ` DOI: ${p.doi}` : ''}`,
                    ),
                ].join('\n');

                break;
            }
            case 'references': {
                content = includedPapers.map((p, i) =>
                    `${i + 1}. ${p.authors}. ${p.title}. ${p.journal || 'N/A'}. ${p.year}.${p.doi ? ` DOI: ${p.doi}` : ''}`,
                ).join('\n');

                break;
            }
            case 'prisma': {
                content = [
                    'PRISMA Flow Diagram Data',
                    '========================',
                    `Records identified: ${papers.length}`,
                    `  - PubMed: ${papers.filter((p) => p.source === 'PubMed').length}`,
                    `  - OpenAlex: ${papers.filter((p) => p.source === 'OpenAlex').length}`,
                    `Records screened: ${papers.length}`,
                    `Records excluded: ${excludedPapers.length}`,
                    `Studies included: ${includedPapers.length}`,
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
                            <CheckCircle color="#52c41a" size={14} /> {papers.length} papers searched from PubMed & OpenAlex
                        </span>
                        <span className={styles.checklist}>
                            <CheckCircle color="#52c41a" size={14} /> {includedPapers.length} studies included, {excludedPapers.length} excluded
                        </span>
                        <span className={styles.checklist}>
                            <CheckCircle color="#52c41a" size={14} /> Evidence analyzed with GRADE assessment
                        </span>
                        <span className={styles.checklist}>
                            <CheckCircle color="#52c41a" size={14} /> Manuscript sections prepared
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
                            Paste into your word processor, Google Docs, or Overleaf
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
