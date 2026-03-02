'use client';

import { Button, Input, Tag } from '@lobehub/ui';
import { Spin } from 'antd';
import { createStyles } from 'antd-style';
import { ExternalLink, Search } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { type SearchSource, useResearchStore } from '@/store/research';

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
    errorMsg: css`
    padding: 12px 16px;

    font-size: 13px;
    color: ${token.colorError};

    background: ${token.colorErrorBg};
    border: 1px solid ${token.colorErrorBorder};
    border-radius: ${token.borderRadiusLG}px;
  `,
    openAccess: css`
    padding: 1px 6px;

    font-size: 10px;
    font-weight: 600;
    color: ${token.colorSuccess};

    background: ${token.colorSuccessBg};
    border-radius: 4px;
  `,
    picoCard: css`
    padding: 16px;

    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
    picoLabel: css`
    min-width: 80px;
    padding: 2px 8px;

    font-size: 11px;
    font-weight: 600;
    color: ${token.colorPrimary};
    text-transform: uppercase;

    background: ${token.colorPrimaryBg};
    border-radius: 4px;
  `,
    picoValue: css`
    font-size: 13px;
    color: ${token.colorText};
  `,
    resultCard: css`
    cursor: pointer;

    padding: 12px 16px;

    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;

    transition: all 0.2s ease;

    &:hover {
      background: ${token.colorFillTertiary};
      border-color: ${token.colorPrimaryBorder};
    }
  `,
    resultMeta: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
    resultTitle: css`
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    color: ${token.colorText};
  `,
    sectionTitle: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
  `,
}));

const SOURCES: SearchSource[] = ['PubMed', 'OpenAlex', 'ClinicalTrials.gov'];

const DiscoveryPhase = memo(() => {
    const { styles } = useStyles();

    const searchQuery = useResearchStore((s) => s.searchQuery);
    const selectedSources = useResearchStore((s) => s.selectedSources);
    const papers = useResearchStore((s) => s.papers);
    const pico = useResearchStore((s) => s.pico);
    const totalResults = useResearchStore((s) => s.totalResults);
    const isSearching = useResearchStore((s) => s.isSearching);
    const searchError = useResearchStore((s) => s.searchError);

    const setSearchQuery = useResearchStore((s) => s.setSearchQuery);
    const toggleSource = useResearchStore((s) => s.toggleSource);
    const searchPapers = useResearchStore((s) => s.searchPapers);
    const extractPICO = useResearchStore((s) => s.extractPICO);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            extractPICO(searchQuery);
            searchPapers(searchQuery);
        }
    };

    const handlePaperClick = (paper: (typeof papers)[0]) => {
        const url = paper.doiUrl || paper.pubmedUrl;
        if (url) window.open(url, '_blank');
    };

    return (
        <Flexbox className={styles.container} gap={16}>
            {/* Search Input */}
            <Flexbox gap={8}>
                <Input
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onPressEnter={handleSearch}
                    placeholder="Nhập câu hỏi nghiên cứu (VD: metformin diabetes prevention)..."
                    prefix={<Search size={16} />}
                    size="large"
                    value={searchQuery}
                />
                <Flexbox align={'center'} gap={8} horizontal justify={'space-between'}>
                    <Flexbox gap={6} horizontal wrap={'wrap'}>
                        {SOURCES.map((source) => (
                            <Tag
                                color={selectedSources.includes(source) ? 'processing' : undefined}
                                key={source}
                                onClick={() => toggleSource(source)}
                                style={{ cursor: 'pointer' }}
                            >
                                {selectedSources.includes(source) ? '✓ ' : ''}
                                {source}
                            </Tag>
                        ))}
                    </Flexbox>
                    <Button
                        loading={isSearching}
                        onClick={handleSearch}
                        size={'small'}
                        type={'primary'}
                    >
                        Tìm kiếm
                    </Button>
                </Flexbox>
            </Flexbox>

            {/* Loading state */}
            {isSearching && (
                <Flexbox align={'center'} justify={'center'} style={{ padding: 32 }}>
                    <Spin size="large" tip="Đang tìm kiếm từ PubMed, OpenAlex..." />
                </Flexbox>
            )}

            {/* Error state */}
            {searchError && <div className={styles.errorMsg}>⚠️ {searchError}</div>}

            {/* PICO Card */}
            {pico && !isSearching && (
                <Flexbox gap={8}>
                    <span className={styles.sectionTitle}>🎯 PICO Framework Analysis</span>
                    <div className={styles.picoCard}>
                        <Flexbox gap={8}>
                            {[
                                { label: 'Population (P)', value: pico.population },
                                { label: 'Intervention (I)', value: pico.intervention },
                                { label: 'Comparison (C)', value: pico.comparison },
                                { label: 'Outcome (O)', value: pico.outcome },
                            ].map((item) => (
                                <Flexbox align={'center'} gap={12} horizontal key={item.label}>
                                    <span className={styles.picoLabel}>{item.label}</span>
                                    <span className={styles.picoValue}>{item.value}</span>
                                </Flexbox>
                            ))}
                        </Flexbox>
                    </div>
                </Flexbox>
            )}

            {/* Search Results */}
            {papers.length > 0 && !isSearching && (
                <Flexbox gap={8}>
                    <span className={styles.sectionTitle}>
                        📄 Kết quả tìm kiếm ({totalResults} papers)
                    </span>
                    {papers.map((paper) => (
                        <div
                            className={styles.resultCard}
                            key={paper.id}
                            onClick={() => handlePaperClick(paper)}
                        >
                            <Flexbox gap={6}>
                                <Flexbox align={'flex-start'} gap={8} horizontal justify={'space-between'}>
                                    <span className={styles.resultTitle}>{paper.title}</span>
                                    {(paper.doiUrl || paper.pubmedUrl) && (
                                        <ExternalLink size={14} style={{ flexShrink: 0, marginTop: 3, opacity: 0.5 }} />
                                    )}
                                </Flexbox>
                                <span className={styles.resultMeta}>{paper.authors}</span>
                                <Flexbox align={'center'} gap={8} horizontal wrap={'wrap'}>
                                    <Tag
                                        color={paper.source === 'PubMed' ? 'blue' : 'green'}
                                        style={{ fontSize: 11 }}
                                    >
                                        {paper.source}
                                    </Tag>
                                    {paper.isOpenAccess && <span className={styles.openAccess}>Open Access</span>}
                                    {paper.journal && (
                                        <span className={styles.resultMeta}>{paper.journal}</span>
                                    )}
                                    {paper.year > 0 && (
                                        <span className={styles.resultMeta}>· {paper.year}</span>
                                    )}
                                    {paper.citations !== undefined && paper.citations > 0 && (
                                        <span className={styles.resultMeta}>
                                            📝 {paper.citations.toLocaleString()} citations
                                        </span>
                                    )}
                                </Flexbox>
                            </Flexbox>
                        </div>
                    ))}
                </Flexbox>
            )}

            {/* Empty state */}
            {papers.length === 0 && !isSearching && !searchError && (
                <div className={styles.emptyState}>
                    <span style={{ fontSize: 48 }}>🔬</span>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Research Mode</span>
                    <span style={{ fontSize: 13 }}>
                        Nhập câu hỏi nghiên cứu để AI phân tích PICO
                        <br />
                        và tìm kiếm papers từ PubMed, OpenAlex
                    </span>
                </div>
            )}
        </Flexbox>
    );
});

DiscoveryPhase.displayName = 'DiscoveryPhase';

export default DiscoveryPhase;
