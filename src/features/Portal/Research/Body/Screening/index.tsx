'use client';

import { Button, Tag } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { CheckCircle, ChevronLeft, XCircle } from 'lucide-react';
import React, { memo, useMemo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { type ScreeningDecision, useResearchStore } from '@/store/research';

const useStyles = createStyles(({ css, token }) => ({
    actionBtn: css`
    cursor: pointer;

    display: flex;
    gap: 4px;
    align-items: center;

    padding: 4px 10px;

    font-size: 11px;
    font-weight: 600;

    border-radius: 6px;

    transition: all 0.15s ease;
  `,
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
    excludeBtn: css`
    color: ${token.colorError};
    background: ${token.colorErrorBg};

    &:hover {
      background: ${token.colorErrorBgHover};
    }
  `,
    includeBtn: css`
    color: ${token.colorSuccess};
    background: ${token.colorSuccessBg};

    &:hover {
      background: ${token.colorSuccessBgHover};
    }
  `,
    paperCard: css`
    padding: 12px 16px;

    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    transition: all 0.2s ease;
  `,
    paperExcluded: css`
    background: ${token.colorErrorBg};
    border-color: ${token.colorErrorBorder};
  `,
    paperIncluded: css`
    background: ${token.colorSuccessBg};
    border-color: ${token.colorSuccessBorder};
  `,
    paperMeta: css`
    font-size: 11px;
    color: ${token.colorTextSecondary};
  `,
    paperPending: css`
    background: ${token.colorFillQuaternary};
  `,
    paperTitle: css`
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
    color: ${token.colorText};
  `,
    statItem: css`
    display: flex;
    gap: 6px;
    align-items: center;

    font-size: 13px;
    font-weight: 600;
  `,
    statsBar: css`
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;

    padding: 12px 16px;

    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
    tab: css`
    cursor: pointer;

    padding: 6px 14px;

    font-size: 12px;
    font-weight: 500;
    color: ${token.colorTextSecondary};

    border-radius: ${token.borderRadius}px;

    transition: all 0.2s;

    &:hover {
      color: ${token.colorText};
    }
  `,
    tabActive: css`
    font-weight: 600;
    color: ${token.colorText};

    background: ${token.colorBgElevated};
    box-shadow: 0 1px 3px ${token.colorFillSecondary};
  `,
    tabBar: css`
    display: flex;
    gap: 4px;

    padding: 4px;

    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadiusLG}px;
  `,
}));

type ScreeningTab = 'all' | 'excluded' | 'included' | 'pending';

const ScreeningPhase = memo(() => {
    const { styles, cx } = useStyles();
    const [tab, setTab] = useState<ScreeningTab>('all');

    const papers = useResearchStore((s) => s.papers);
    const screeningDecisions = useResearchStore((s) => s.screeningDecisions);
    const screenPaper = useResearchStore((s) => s.screenPaper);
    const getScreeningStats = useResearchStore((s) => s.getScreeningStats);
    const includeAllPapers = useResearchStore((s) => s.includeAllPapers);
    const resetScreening = useResearchStore((s) => s.resetScreening);
    const setActivePhase = useResearchStore((s) => s.setActivePhase);

    const stats = getScreeningStats();

    const filteredPapers = useMemo(() => {
        switch (tab) {
            case 'excluded': {
                return papers.filter((p) => screeningDecisions[p.id]?.decision === 'excluded');
            }
            case 'included': {
                return papers.filter((p) => screeningDecisions[p.id]?.decision === 'included');
            }
            case 'pending': {
                return papers.filter((p) => !screeningDecisions[p.id] || screeningDecisions[p.id]?.decision === 'pending');
            }
            default: {
                return papers;
            }
        }
    }, [papers, screeningDecisions, tab]);

    const getDecision = (paperId: string): ScreeningDecision => {
        return screeningDecisions[paperId]?.decision || 'pending';
    };

    const getCardClass = (paperId: string) => {
        const decision = getDecision(paperId);
        if (decision === 'included') return cx(styles.paperCard, styles.paperIncluded);
        if (decision === 'excluded') return cx(styles.paperCard, styles.paperExcluded);
        return cx(styles.paperCard, styles.paperPending);
    };

    if (papers.length === 0) {
        return (
            <div className={styles.emptyState}>
                <span style={{ fontSize: 48 }}>📋</span>
                <span style={{ fontSize: 16, fontWeight: 600 }}>No papers to screen</span>
                <span style={{ fontSize: 13 }}>
                    Go back to Discovery phase and search for papers first.
                </span>
                <Button onClick={() => setActivePhase('discovery')} size={'small'} type={'primary'}>
                    <ChevronLeft size={14} /> Back to Discovery
                </Button>
            </div>
        );
    }

    return (
        <Flexbox className={styles.container} gap={12}>
            {/* PRISMA Stats Bar */}
            <div className={styles.statsBar}>
                <Flexbox gap={16} horizontal wrap={'wrap'}>
                    <span className={styles.statItem}>
                        📄 Total: <strong>{stats.total}</strong>
                    </span>
                    <span className={styles.statItem} style={{ color: '#52c41a' }}>
                        ✅ Included: <strong>{stats.included}</strong>
                    </span>
                    <span className={styles.statItem} style={{ color: '#ff4d4f' }}>
                        ❌ Excluded: <strong>{stats.excluded}</strong>
                    </span>
                    <span className={styles.statItem} style={{ color: '#faad14' }}>
                        ⏳ Pending: <strong>{stats.pending}</strong>
                    </span>
                </Flexbox>
            </div>

            {/* Quick Actions */}
            <Flexbox gap={8} horizontal wrap={'wrap'}>
                <Button onClick={includeAllPapers} size={'small'}>
                    ✅ Include All
                </Button>
                <Button onClick={resetScreening} size={'small'}>
                    🔄 Reset
                </Button>
                {stats.included > 0 && (
                    <Button onClick={() => setActivePhase('analysis')} size={'small'} type={'primary'}>
                        → Analysis ({stats.included} papers)
                    </Button>
                )}
            </Flexbox>

            {/* Tab Bar */}
            <div className={styles.tabBar}>
                {([
                    { count: papers.length, key: 'all' as const, label: 'All' },
                    { count: stats.pending, key: 'pending' as const, label: 'Pending' },
                    { count: stats.included, key: 'included' as const, label: 'Included' },
                    { count: stats.excluded, key: 'excluded' as const, label: 'Excluded' },
                ]).map((t) => (
                    <span
                        className={cx(styles.tab, tab === t.key && styles.tabActive)}
                        key={t.key}
                        onClick={() => setTab(t.key)}
                    >
                        {t.label} ({t.count})
                    </span>
                ))}
            </div>

            {/* Paper Cards */}
            {filteredPapers.map((paper) => {
                const decision = getDecision(paper.id);
                return (
                    <div className={getCardClass(paper.id)} key={paper.id}>
                        <Flexbox gap={8}>
                            <Flexbox align={'flex-start'} gap={8} horizontal justify={'space-between'}>
                                <span className={styles.paperTitle}>{paper.title}</span>
                                <Flexbox gap={4} horizontal style={{ flexShrink: 0 }}>
                                    <span
                                        className={cx(styles.actionBtn, styles.includeBtn)}
                                        onClick={() => screenPaper(paper.id, decision === 'included' ? 'pending' : 'included')}
                                        style={{ opacity: decision === 'included' ? 1 : 0.6 }}
                                    >
                                        <CheckCircle size={12} />
                                        {decision === 'included' ? '✓' : 'Include'}
                                    </span>
                                    <span
                                        className={cx(styles.actionBtn, styles.excludeBtn)}
                                        onClick={() => screenPaper(paper.id, decision === 'excluded' ? 'pending' : 'excluded')}
                                        style={{ opacity: decision === 'excluded' ? 1 : 0.6 }}
                                    >
                                        <XCircle size={12} />
                                        {decision === 'excluded' ? '✗' : 'Exclude'}
                                    </span>
                                </Flexbox>
                            </Flexbox>
                            <span className={styles.paperMeta}>{paper.authors}</span>
                            <Flexbox align={'center'} gap={6} horizontal wrap={'wrap'}>
                                <Tag
                                    color={paper.source === 'PubMed' ? 'blue' : 'green'}
                                    style={{ fontSize: 10 }}
                                >
                                    {paper.source}
                                </Tag>
                                {paper.journal && <span className={styles.paperMeta}>{paper.journal}</span>}
                                {paper.year > 0 && <span className={styles.paperMeta}>· {paper.year}</span>}
                                {paper.citations !== undefined && paper.citations > 0 && (
                                    <span className={styles.paperMeta}>📝 {paper.citations.toLocaleString()}</span>
                                )}
                                {screeningDecisions[paper.id]?.reason && (
                                    <Tag color="orange" style={{ fontSize: 10 }}>
                                        {screeningDecisions[paper.id].reason}
                                    </Tag>
                                )}
                            </Flexbox>
                        </Flexbox>
                    </div>
                );
            })}
        </Flexbox>
    );
});

ScreeningPhase.displayName = 'ScreeningPhase';

export default ScreeningPhase;
