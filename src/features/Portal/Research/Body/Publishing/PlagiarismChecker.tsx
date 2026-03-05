'use client';

/**
 * PlagiarismChecker — Research Mode Publishing Phase Component
 * Checks the generated review text against CrossRef + optional Copyleaks.
 */

import { Button } from '@lobehub/ui';
import { Progress, Spin } from 'antd';
import { createStyles } from 'antd-style';
import { AlertTriangle, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

const useStyles = createStyles(({ css, token }) => ({
    badge: css`
    display: inline-block;

    padding: 2px 10px;

    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-sans);
    color: white;

    border-radius: 20px;
  `,
    card: css`
    padding: 16px;

    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
    matchCard: css`
    padding: 10px 12px;

    background: ${token.colorWarningBg};
    border: 1px solid ${token.colorWarningBorder};
    border-radius: ${token.borderRadiusSM}px;
  `,
    matchTitle: css`
    font-size: 12px;
    font-weight: 600;
    color: ${token.colorText};
  `,
    meta: css`
    font-size: 11px;
    color: ${token.colorTextTertiary};
  `,
    root: css`
    width: 100%;
  `,
    sectionTitle: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
  `,
    successCard: css`
    padding: 14px 16px;

    background: ${token.colorSuccessBg};
    border: 1px solid ${token.colorSuccessBorder};
    border-radius: ${token.borderRadiusLG}px;
  `,
}));

interface Match {
    matchedText: string;
    similarity: number;
    sourceTitle: string;
    sourceUrl: string;
    year?: number;
}

interface PlagiarismResult {
    matches: Match[];
    overallSimilarity: number;
    processedAt: string;
    scanId: string;
    textLength: number;
    usedCopyleaks: boolean;
}

interface Props {
    reviewText: string;
    searchQuery: string;
}

// Module-scope helpers (avoid lint: no arrow function inside component)
const similarityColor = (pct: number) => {
    if (pct < 15) return '#059669'; // green
    if (pct < 30) return '#d97706'; // amber
    return '#dc2626'; // red
};

const similarityLabel = (pct: number) => {
    if (pct < 15) return 'Very Low';
    if (pct < 30) return 'Low';
    if (pct < 50) return 'Moderate';
    return 'High';
};

const PlagiarismChecker = memo(({ reviewText, searchQuery }: Props) => {
    const { styles } = useStyles();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PlagiarismResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const runCheck = useCallback(async () => {
        if (!reviewText || reviewText.length < 50) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/plagiarism/check', {
                body: JSON.stringify({ text: reviewText, title: searchQuery }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (!res.ok) throw new Error('Plagiarism check failed');
            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err?.message ?? 'Check failed');
        } finally {
            setLoading(false);
        }
    }, [reviewText, searchQuery]);

    return (
        <Flexbox className={styles.root} gap={12}>
            <Flexbox align="center" gap={8} horizontal>
                <ShieldCheck size={16} />
                <span className={styles.sectionTitle}>Plagiarism &amp; Similarity Check</span>
            </Flexbox>

            {!result && !loading && (
                <Flexbox className={styles.card} gap={8}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                        Checks your review text against CrossRef academic database for similar published works.
                        {!process.env.NEXT_PUBLIC_HAS_COPYLEAKS && ' For deeper scanning, add COPYLEAKS_API_KEY.'}
                    </span>
                    <Button
                        disabled={!reviewText || reviewText.length < 50}
                        icon={<ShieldCheck size={14} />}
                        loading={loading}
                        onClick={runCheck}
                        type="primary"
                    >
                        Run Similarity Check
                    </Button>
                </Flexbox>
            )}

            {loading && (
                <Flexbox align="center" className={styles.card} gap={8} justify="center">
                    <Spin size="small" />
                    <span style={{ fontSize: 12 }}>Scanning against academic databases...</span>
                </Flexbox>
            )}

            {error && (
                <Flexbox align="center" gap={6} horizontal style={{ color: 'var(--ant-color-error)', fontSize: 12 }}>
                    <AlertTriangle size={14} />
                    {error}
                </Flexbox>
            )}

            {result && (
                <Flexbox gap={12}>
                    {/* Overall Score */}
                    <Flexbox className={styles.successCard} gap={8}>
                        <Flexbox align="center" gap={8} horizontal>
                            <CheckCircle size={16} style={{ color: similarityColor(result.overallSimilarity) }} />
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                                Overall Similarity: {' '}
                                <span
                                    className={styles.badge}
                                    style={{ background: similarityColor(result.overallSimilarity) }}
                                >
                                    {result.overallSimilarity}% — {similarityLabel(result.overallSimilarity)}
                                </span>
                            </span>
                        </Flexbox>

                        <Progress
                            percent={result.overallSimilarity}
                            showInfo={false}
                            strokeColor={similarityColor(result.overallSimilarity)}
                        />

                        <span className={styles.meta}>
                            Scanned {result.textLength.toLocaleString()} characters · {result.processedAt.slice(0, 10)}
                            {result.usedCopyleaks ? ' · Powered by Copyleaks' : ' · CrossRef database'}
                        </span>
                    </Flexbox>

                    {/* Matched Sources */}
                    {result.matches.length > 0 && (
                        <Flexbox gap={8}>
                            <span className={styles.sectionTitle}>Similar Sources Found ({result.matches.length})</span>
                            {result.matches.map((match, i) => (
                                <Flexbox className={styles.matchCard} gap={4} key={i}>
                                    <Flexbox align="center" horizontal justify="space-between">
                                        <span className={styles.matchTitle}>{match.sourceTitle}</span>
                                        <span
                                            className={styles.badge}
                                            style={{ background: similarityColor(match.similarity), fontSize: 10 }}
                                        >
                                            {match.similarity}%
                                        </span>
                                    </Flexbox>
                                    <Flexbox align="center" gap={8} horizontal>
                                        <span className={styles.meta}>
                                            {match.year && `${match.year} · `}
                                        </span>
                                        {match.sourceUrl && (
                                            <a
                                                href={match.sourceUrl}
                                                rel="noopener noreferrer"
                                                style={{ fontSize: 11 }}
                                                target="_blank"
                                            >
                                                <Flexbox align="center" gap={4} horizontal>
                                                    <ExternalLink size={10} />
                                                    View source
                                                </Flexbox>
                                            </a>
                                        )}
                                    </Flexbox>
                                </Flexbox>
                            ))}
                        </Flexbox>
                    )}

                    {result.matches.length === 0 && (
                        <Flexbox align="center" gap={6} horizontal style={{ color: 'var(--ant-color-success)', fontSize: 12 }}>
                            <CheckCircle size={14} />
                            No significant similarity detected in academic database
                        </Flexbox>
                    )}

                    <Button
                        icon={<ShieldCheck size={14} />}
                        onClick={runCheck}
                        size="small"
                        type="default"
                    >
                        Re-scan
                    </Button>
                </Flexbox>
            )}
        </Flexbox>
    );
});

PlagiarismChecker.displayName = 'PlagiarismChecker';
export default PlagiarismChecker;
