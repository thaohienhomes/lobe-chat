'use client';

import { Button, Input, Tag } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Search } from 'lucide-react';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

const useStyles = createStyles(({ css, token }) => ({
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
    resultTitle: css`
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    color: ${token.colorText};
  `,
    resultMeta: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
    sectionTitle: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
  `,
    sourceTag: css`
    cursor: pointer;

    padding: 4px 12px;

    font-size: 12px;
    font-weight: 500;

    border-radius: 20px;

    transition: all 0.2s ease;
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

// Mock PICO data for demo
const MOCK_PICO = {
    population: 'Bệnh nhân tiền đái tháo đường',
    intervention: 'Metformin',
    comparison: 'Placebo / Lifestyle modification',
    outcome: 'Tỷ lệ chuyển thành ĐTĐ type 2',
};

const MOCK_PAPERS = [
    {
        id: '1',
        title: 'Reduction in the Incidence of Type 2 Diabetes with Lifestyle Intervention or Metformin',
        authors: 'Knowler WC, Barrett-Connor E, Fowler SE, et al.',
        journal: 'New England Journal of Medicine',
        year: 2002,
        citations: 12847,
        source: 'PubMed',
    },
    {
        id: '2',
        title: 'Long-term effects of metformin on diabetes prevention: identification of subgroups',
        authors: 'Aroda VR, Knowler WC, Crandall JP, et al.',
        journal: 'Diabetes Care',
        year: 2017,
        citations: 456,
        source: 'PubMed',
    },
    {
        id: '3',
        title: 'Metformin in Prediabetes: Clinical Benefits and Mechanism',
        authors: 'Hostalek U, Gwilt M, Hildemann S.',
        journal: 'Drugs',
        year: 2015,
        citations: 312,
        source: 'OpenAlex',
    },
];

const DiscoveryPhase = memo(() => {
    const { styles } = useStyles();
    const [query, setQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedSources, setSelectedSources] = useState<string[]>([
        'PubMed',
        'OpenAlex',
        'ClinicalTrials.gov',
    ]);

    const handleSearch = () => {
        if (query.trim()) {
            setHasSearched(true);
        }
    };

    const toggleSource = (source: string) => {
        setSelectedSources((prev) =>
            prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source],
        );
    };

    return (
        <Flexbox gap={16}>
            {/* Search Input */}
            <Flexbox gap={8}>
                <Input
                    onChange={(e) => setQuery(e.target.value)}
                    onPressEnter={handleSearch}
                    placeholder="Nhập câu hỏi nghiên cứu..."
                    prefix={<Search size={16} />}
                    size="large"
                    value={query}
                />
                <Flexbox align={'center'} gap={8} horizontal justify={'space-between'}>
                    <Flexbox gap={6} horizontal>
                        {['PubMed', 'OpenAlex', 'ClinicalTrials.gov'].map((source) => (
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
                    <Button onClick={handleSearch} size={'small'} type={'primary'}>
                        Tìm kiếm
                    </Button>
                </Flexbox>
            </Flexbox>

            {/* PICO Card (shown after search) */}
            {hasSearched && (
                <>
                    <Flexbox gap={8}>
                        <span className={styles.sectionTitle}>🎯 PICO Framework Analysis</span>
                        <div className={styles.picoCard}>
                            <Flexbox gap={8}>
                                {[
                                    { label: 'Population (P)', value: MOCK_PICO.population },
                                    { label: 'Intervention (I)', value: MOCK_PICO.intervention },
                                    { label: 'Comparison (C)', value: MOCK_PICO.comparison },
                                    { label: 'Outcome (O)', value: MOCK_PICO.outcome },
                                ].map((item) => (
                                    <Flexbox align={'center'} gap={12} horizontal key={item.label}>
                                        <span className={styles.picoLabel}>{item.label}</span>
                                        <span className={styles.picoValue}>{item.value}</span>
                                    </Flexbox>
                                ))}
                            </Flexbox>
                        </div>
                    </Flexbox>

                    {/* Search Results */}
                    <Flexbox gap={8}>
                        <span className={styles.sectionTitle}>
                            📄 Kết quả tìm kiếm ({MOCK_PAPERS.length} papers)
                        </span>
                        {MOCK_PAPERS.map((paper) => (
                            <div className={styles.resultCard} key={paper.id}>
                                <Flexbox gap={6}>
                                    <span className={styles.resultTitle}>{paper.title}</span>
                                    <span className={styles.resultMeta}>{paper.authors}</span>
                                    <Flexbox align={'center'} gap={8} horizontal>
                                        <Tag color="blue" style={{ fontSize: 11 }}>
                                            {paper.source}
                                        </Tag>
                                        <span className={styles.resultMeta}>
                                            {paper.journal} · {paper.year}
                                        </span>
                                        <span className={styles.resultMeta}>📝 {paper.citations} citations</span>
                                    </Flexbox>
                                </Flexbox>
                            </div>
                        ))}
                    </Flexbox>
                </>
            )}

            {/* Empty state */}
            {!hasSearched && (
                <div className={styles.emptyState}>
                    <span style={{ fontSize: 48 }}>🔬</span>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Research Mode</span>
                    <span style={{ fontSize: 13 }}>
                        Nhập câu hỏi nghiên cứu để AI phân tích PICO
                        <br />
                        và tìm kiếm papers từ PubMed, OpenAlex, ClinicalTrials.gov
                    </span>
                </div>
            )}
        </Flexbox>
    );
});

DiscoveryPhase.displayName = 'DiscoveryPhase';

export default DiscoveryPhase;
