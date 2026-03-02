'use client';

import { Button, Tag } from '@lobehub/ui';
import { Input } from 'antd';
import { createStyles } from 'antd-style';
import { ChevronLeft, ChevronRight, Copy, FileText, Plus, Trash2 } from 'lucide-react';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useResearchStore } from '@/store/research';

const { TextArea } = Input;

// Standard systematic review sections
const DEFAULT_SECTIONS = [
    { content: '', key: 'title', label: 'Title', placeholder: 'Systematic Review: [Your research question]' },
    { content: '', key: 'abstract', label: 'Abstract', placeholder: 'Background, Methods, Results, Conclusions...' },
    { content: '', key: 'introduction', label: 'Introduction', placeholder: 'Background context, rationale, and objectives...' },
    { content: '', key: 'methods', label: 'Methods', placeholder: 'Search strategy, eligibility criteria, data extraction, quality assessment...' },
    { content: '', key: 'results', label: 'Results', placeholder: 'Study selection (PRISMA), study characteristics, synthesis of results...' },
    { content: '', key: 'discussion', label: 'Discussion', placeholder: 'Summary of evidence, limitations, implications for practice...' },
    { content: '', key: 'conclusion', label: 'Conclusion', placeholder: 'Key findings and recommendations...' },
    { content: '', key: 'references', label: 'References', placeholder: 'Auto-generated from included papers...' },
];

const useStyles = createStyles(({ css, token }) => ({
    container: css`
    width: 100%;
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
    wordCount: css`
    font-size: 11px;
    font-weight: 400;
    color: ${token.colorTextQuaternary};
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
    statItem: css`
    display: flex;
    gap: 6px;
    align-items: center;

    font-size: 13px;
    font-weight: 600;
  `,
    sectionTitle: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
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
}));

const WritingPhase = memo(() => {
    const { styles } = useStyles();

    const papers = useResearchStore((s) => s.papers);
    const screeningDecisions = useResearchStore((s) => s.screeningDecisions);
    const pico = useResearchStore((s) => s.pico);
    const searchQuery = useResearchStore((s) => s.searchQuery);
    const setActivePhase = useResearchStore((s) => s.setActivePhase);

    const includedPapers = papers.filter((p) => screeningDecisions[p.id]?.decision === 'included');

    // Section state
    const [sections, setSections] = useState(() => {
        // Pre-fill some sections with data
        const filled = DEFAULT_SECTIONS.map((s) => ({ ...s }));

        // Auto-fill Title
        if (searchQuery) {
            filled[0].content = `Systematic Review: ${searchQuery}`;
        }

        // Auto-fill Methods
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
                `### Selection Criteria`,
                `- ${includedPapers.length} studies included after screening`,
                `- ${papers.length - includedPapers.length} studies excluded`,
            ].join('\n');
        }

        // Auto-fill References
        const refsIdx = filled.findIndex((s) => s.key === 'references');
        if (refsIdx >= 0) {
            filled[refsIdx].content = includedPapers.map((p, i) =>
                `${i + 1}. ${p.authors}. ${p.title}. ${p.journal || 'N/A'}. ${p.year}. ${p.doi ? `DOI: ${p.doi}` : ''}`,
            ).join('\n');
        }

        return filled;
    });

    const [expandedSection, setExpandedSection] = useState<string | null>('title');

    const updateSection = (key: string, content: string) => {
        setSections((prev) => prev.map((s) => s.key === key ? { ...s, content } : s));
    };

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
                            </span>
                            <span className={styles.wordCount}>
                                {section.content ? section.content.split(/\s+/).filter(Boolean).length : 0} words
                                {expandedSection === section.key ? ' ▲' : ' ▼'}
                            </span>
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
