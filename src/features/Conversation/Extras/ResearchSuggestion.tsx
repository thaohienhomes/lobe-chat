'use client';

import { Button, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import { FlaskConical, Microscope } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';

/* ── Research intent detection patterns ── */
// "Strong" patterns — a single match is enough to trigger
const STRONG_RESEARCH_PATTERNS = [
    /\b(meta-analysis|systematic review|tổng quan hệ thống|phân tích gộp)\b/i,
    /\b(clinical trial|thử nghiệm lâm sàng|randomized controlled)\b/i,
    /\b(pubmed|medline|cochrane|prisma)\b/i,
    /pubmed\.ncbi|scholar\.google|doi\.org|arxiv\.org|semanticscholar\.org/i,
];

// "Weak" patterns — need ≥2 matches to trigger
const WEAK_RESEARCH_PATTERNS = [
    // Medical/Clinical
    /\b(efficacy|hiệu quả|outcome|kết quả)\b/i,
    /\b(rct|cohort|case.control|cross.sectional|observational)\b/i,
    /\b(mortality|morbidity|survival|hazard ratio|odds ratio|relative risk)\b/i,
    /\b(placebo|double.blind|intervention|treatment arm)\b/i,
    /\b(therapy|therapeutic|điều trị|liệu pháp|phác đồ)\b/i,
    /\b(cancer|ung thư|tumor|carcinoma|lymphoma|leukemia)\b/i,
    /\b(bệnh nhân|patient|disease|syndrome|disorder)\b/i,
    // Research / comparison language
    /\b(nghiên cứu|research|study|evidence|bằng chứng|y văn)\b/i,
    /\b(so sánh|compare|comparison|versus|vs\.?)\b/i,
    /\b(hypothesis|methodology|p.value|statistical|significance)\b/i,
    /\b(sample size|population|inclusion criteria|exclusion criteria)\b/i,
    // Drug / treatment names (common patterns)
    /\b(monoclonal antibody|kháng thể|bispecific|car-t|chimeric)\b/i,
    /\b(inhibitor|agonist|antagonist|receptor|pathway)\b/i,
];

/**
 * Check if text has research intent.
 * - 1 strong pattern match → true
 * - 2+ weak pattern matches → true
 */
function hasResearchIntent(text: string): boolean {
    if (!text || text.length < 15) return false;

    // Strong patterns: any single match is enough
    for (const p of STRONG_RESEARCH_PATTERNS) {
        if (p.test(text)) return true;
    }

    // Weak patterns: need ≥2
    let weakCount = 0;
    for (const p of WEAK_RESEARCH_PATTERNS) {
        if (p.test(text)) {
            weakCount++;
            if (weakCount >= 2) return true;
        }
    }
    return false;
}

const useStyles = createStyles(({ css, token }) => ({
    banner: css`
    background: linear-gradient(135deg, rgba(99,226,183,0.08), rgba(59,130,246,0.08));
    border: 1px solid rgba(99,226,183,0.2);
    border-radius: 10px;
    padding: 10px 14px;
    margin-top: 6px;
  `,
    deepBtn: css`
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%) !important;
    border: none !important;
    color: white !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    &:hover {
      opacity: 0.9;
    }
  `,
    researchBtn: css`
    background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
    border: none !important;
    color: white !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    &:hover {
      opacity: 0.9;
    }
  `,
    title: css`
    color: ${token.colorTextSecondary};
    font-size: 12px;
    font-weight: 500;
  `,
}));

interface ResearchSuggestionProps {
    /** The user's original question to pass to the research panel */
    userQuestion: string;
}

const ResearchSuggestion = memo<ResearchSuggestionProps>(({ userQuestion }) => {
    const { styles } = useStyles();
    const [dismissed, setDismissed] = useState(false);
    const openResearchMode = useChatStore((s) => s.openResearchMode);
    const openDeepResearch = useChatStore((s) => s.openDeepResearch);

    const shouldShow = useMemo(() => hasResearchIntent(userQuestion), [userQuestion]);

    if (!shouldShow || dismissed) return null;

    return (
        <div className={styles.banner}>
            <Flexbox gap={8}>
                <Flexbox align={'center'} gap={6} horizontal justify={'space-between'}>
                    <span className={styles.title}>
                        {'🔬 Chủ đề này phù hợp để nghiên cứu chuyên sâu'}
                    </span>
                    <span
                        onClick={() => setDismissed(true)}
                        style={{ color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 14 }}
                    >
                        ✕
                    </span>
                </Flexbox>
                <Flexbox gap={8} horizontal style={{ flexWrap: 'wrap' }}>
                    <Tooltip
                        placement="bottom"
                        title={
                            <div style={{ maxWidth: 260, padding: '4px 0' }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>🧪 Tổng hợp nhanh</div>
                                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                                    AI tìm kiếm PubMed, phân tích và tóm tắt y văn trong <b>1–2 phút</b>. Phù hợp khi cần tổng quan nhanh về một chủ đề.
                                </div>
                            </div>
                        }
                    >
                        <Button
                            className={styles.researchBtn}
                            icon={<FlaskConical size={14} />}
                            onClick={() => openResearchMode(userQuestion)}
                            size="small"
                        >
                            Research Mode
                        </Button>
                    </Tooltip>
                    <Tooltip
                        placement="bottom"
                        title={
                            <div style={{ maxWidth: 280, padding: '4px 0' }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>📊 Nghiên cứu chuyên sâu</div>
                                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                                    Hệ thống multi-agent viết bài tổng quan hệ thống đầy đủ với <b>PRISMA, GRADE, Citation Network</b>, trích dẫn và xuất file. Phù hợp cho nghiên cứu lâm sàng chi tiết <b>(5–10 phút)</b>.
                                </div>
                            </div>
                        }
                    >
                        <Button
                            className={styles.deepBtn}
                            icon={<Microscope size={14} />}
                            onClick={() => openDeepResearch(userQuestion)}
                            size="small"
                        >
                            Deep Research
                        </Button>
                    </Tooltip>
                </Flexbox>
            </Flexbox>
        </div>
    );
});

ResearchSuggestion.displayName = 'ResearchSuggestion';

export default ResearchSuggestion;
