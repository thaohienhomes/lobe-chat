'use client';

/**
 * ResearchSlides — Research Mode Publishing Phase Component
 * Generates academic presentation slides from the research data.
 * Exports to PPTX format using pptxgenjs.
 */

import { Button } from '@lobehub/ui';
import { Select } from 'antd';
import { createStyles } from 'antd-style';
import { ChevronLeft, ChevronRight, Download, Presentation, Sparkles } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { type PaperResult, useResearchStore } from '@/store/research';

const useStyles = createStyles(({ css, token }) => ({
    card: css`
    padding: 16px;

    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
    navBtn: css`
    padding: 4px 8px;
    color: ${token.colorTextSecondary};
    cursor: pointer;

    background: ${token.colorFillTertiary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusSM}px;

    &:hover {
      background: ${token.colorFill};
    }
  `,
    root: css`
    width: 100%;
  `,
    sectionTitle: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
  `,
    slide: css`
    overflow: hidden;

    width: 100%;
    min-height: 220px;

    padding: 24px 28px;

    background: linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorFillQuaternary} 100%);
    border: 2px solid ${token.colorPrimaryBorder};
    border-radius: ${token.borderRadiusLG}px;
  `,
    slideBullet: css`
    display: flex;
    gap: 8px;
    align-items: flex-start;

    font-size: 12px;
    line-height: 1.6;
    color: ${token.colorTextSecondary};
  `,
    slideNotes: css`
    padding: 8px 12px;

    font-size: 11px;
    font-style: italic;
    color: ${token.colorTextTertiary};

    background: ${token.colorFillQuaternary};
    border-left: 3px solid ${token.colorBorderSecondary};
    border-radius: 0 4px 4px 0;
  `,
    slideTitle: css`
    margin-bottom: 12px;

    font-size: 15px;
    font-weight: 700;
    color: ${token.colorPrimary};
  `,
    tableCell: css`
    padding: 4px 8px;

    font-size: 11px;

    border: 1px solid ${token.colorBorderSecondary};
  `,
}));

interface Slide {
    bullets?: string[];
    layout: string;
    notes?: string;
    subtitle?: string;
    tableData?: { headers: string[]; rows: string[][] };
    title: string;
}

interface SlideDeck {
    generatedAt: string;
    query: string;
    slides: Slide[];
    theme: string;
}

interface Props {
    papers: PaperResult[];
}

const ResearchSlides = memo(({ papers }: Props) => {
    const { styles } = useStyles();
    const searchQuery = useResearchStore((s) => s.searchQuery);
    const pico = useResearchStore((s) => s.pico);
    const getIncludedPapers = useResearchStore((s) => s.getIncludedPapers);

    const [deck, setDeck] = useState<SlideDeck | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [theme, setTheme] = useState<'medical' | 'academic' | 'minimal'>('medical');

    const includedPapers = getIncludedPapers();

    const generateSlides = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/research/slides', {
                body: JSON.stringify({
                    includedCount: includedPapers.length || papers.length,
                    papers: (includedPapers.length ? includedPapers : papers).slice(0, 10).map((p) => ({
                        authors: p.authors,
                        doi: p.doi,
                        journal: p.journal,
                        title: p.title,
                        year: p.year,
                    })),
                    pico,
                    query: searchQuery,
                    theme,
                    totalScreened: papers.length,
                }),
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            });

            if (!res.ok) throw new Error('Slide generation failed');
            const data: SlideDeck = await res.json();
            setDeck(data);
            setCurrentSlide(0);
        } catch (err: any) {
            console.error('[Slides]', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, pico, papers, includedPapers, theme]);

    const exportPPTX = useCallback(async () => {
        if (!deck) return;
        setExporting(true);
        try {
            const pptxModule = await import('pptxgenjs');
            const PptxGenJS = pptxModule.default;
            const prs = new PptxGenJS();

            // Theme colors
            const PRIMARY = theme === 'medical' ? '1a365d' : theme === 'academic' ? '1e3a5f' : '374151';
            const ACCENT = theme === 'medical' ? '3182ce' : theme === 'academic' ? '2563eb' : '6366f1';

            prs.layout = 'LAYOUT_WIDE';
            prs.author = 'Phở Chat Research Mode';
            prs.title = `Systematic Review: ${deck.query}`;

            for (const slide of deck.slides) {
                const pptSlide = prs.addSlide();

                // Background
                pptSlide.background = { color: 'FFFFFF' };

                if (slide.layout === 'title') {
                    // Title slide
                    pptSlide.addText(slide.title, {
                        align: 'center',
                        bold: true,
                        color: PRIMARY,
                        fontSize: 28,
                        h: 2.5,
                        w: '80%',
                        x: '10%',
                        y: '25%',
                    });
                    if (slide.subtitle) {
                        pptSlide.addText(slide.subtitle, {
                            align: 'center',
                            color: '718096',
                            fontSize: 14,
                            h: 0.6,
                            w: '80%',
                            x: '10%',
                            y: '55%',
                        });
                    }
                    // Accent bar
                    pptSlide.addShape(prs.ShapeType.rect, {
                        fill: { color: ACCENT },
                        h: 0.08,
                        w: '80%',
                        x: '10%',
                        y: '47%',
                    });
                } else if (slide.layout === 'table' && slide.tableData) {
                    // Title
                    pptSlide.addText(slide.title, {
                        bold: true,
                        color: PRIMARY,
                        fontSize: 18,
                        h: 0.7,
                        w: '90%',
                        x: '5%',
                        y: '5%',
                    });
                    // Table
                    const rows = [
                        slide.tableData.headers.map((h) => ({
                            options: { bold: true, color: 'FFFFFF', fill: { color: PRIMARY } },
                            text: h,
                        })),
                        ...slide.tableData.rows.map((row) =>
                            row.map((cell) => ({ text: cell })),
                        ),
                    ];
                    pptSlide.addTable(rows, {
                        border: { color: 'E2E8F0', pt: 1, type: 'solid' },
                        colW: slide.tableData.headers.length === 2 ? [2, 6] : undefined,
                        fontSize: 11,
                        h: 3.5,
                        w: '90%',
                        x: '5%',
                        y: '20%',
                    });
                } else {
                    // Content slide with bullets
                    pptSlide.addText(slide.title, {
                        bold: true,
                        color: PRIMARY,
                        fontSize: 18,
                        h: 0.7,
                        w: '90%',
                        x: '5%',
                        y: '5%',
                    });
                    // Accent line under title
                    pptSlide.addShape(prs.ShapeType.rect, {
                        fill: { color: ACCENT },
                        h: 0.04,
                        w: '90%',
                        x: '5%',
                        y: '17%',
                    });
                    if (slide.bullets && slide.bullets.length > 0) {
                        const bulletText = slide.bullets.map((b) => ({ options: { bullet: true }, text: b }));
                        pptSlide.addText(bulletText, {
                            color: '2D3748',
                            fontSize: 12,
                            h: 3.5,
                            lineSpacingMultiple: 1.4,
                            paraSpaceBefore: 6,
                            w: '85%',
                            x: '8%',
                            y: '22%',
                        });
                    }
                }

                // Footer
                pptSlide.addText('Phở Chat Research Mode', {
                    color: 'CCCCCC',
                    fontSize: 9,
                    h: 0.3,
                    w: '50%',
                    x: '5%',
                    y: '92%',
                });
                pptSlide.addText(`${deck.slides.indexOf(slide) + 1} / ${deck.slides.length}`, {
                    align: 'right',
                    color: 'CCCCCC',
                    fontSize: 9,
                    h: 0.3,
                    w: '20%',
                    x: '75%',
                    y: '92%',
                });
            }

            prs.writeFile({ fileName: `systematic-review-${deck.query.slice(0, 30).replaceAll(/\s+/g, '-')}.pptx` });
        } catch (err) {
            console.error('[PPTX export]', err);
        } finally {
            setExporting(false);
        }
    }, [deck, theme]);

    const slide = deck?.slides[currentSlide];

    return (
        <Flexbox className={styles.root} gap={12}>
            <Flexbox align="center" gap={8} horizontal>
                <Presentation size={16} />
                <span className={styles.sectionTitle}>Research Slides</span>
            </Flexbox>

            {!deck && (
                <Flexbox className={styles.card} gap={12}>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                        Generate a structured 14-slide academic presentation from your research. Export to PPTX for conference or thesis use.
                    </span>
                    <Flexbox align="center" gap={8} horizontal>
                        <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>Theme:</span>
                        <Select
                            onChange={(v) => setTheme(v)}
                            options={[
                                { label: '🏥 Medical / Clinical', value: 'medical' },
                                { label: '🎓 Academic / Research', value: 'academic' },
                                { label: '✏️ Minimal / Simple', value: 'minimal' },
                            ]}
                            size="small"
                            style={{ width: 180 }}
                            value={theme}
                        />
                    </Flexbox>
                    <Button
                        icon={<Sparkles size={14} />}
                        loading={loading}
                        onClick={generateSlides}
                        type="primary"
                    >
                        {loading ? 'Generating Slides...' : 'Generate Presentation'}
                    </Button>
                </Flexbox>
            )}

            {deck && slide && (
                <Flexbox gap={12}>
                    {/* Slide Preview */}
                    <div className={styles.slide}>
                        <div className={styles.slideTitle}>
                            {slide.layout === 'title' ? '🎯 ' : '📑 '}{slide.title}
                        </div>

                        {slide.subtitle && (
                            <div style={{ color: 'var(--ant-color-text-secondary)', fontSize: 13, marginBottom: 8 }}>
                                {slide.subtitle}
                            </div>
                        )}

                        {slide.bullets?.map((b, i) => (
                            <div className={styles.slideBullet} key={i}>
                                <span>•</span>
                                <span>{b}</span>
                            </div>
                        ))}

                        {slide.tableData && (
                            <table style={{ borderCollapse: 'collapse', fontSize: 11, marginTop: 8, width: '100%' }}>
                                <thead>
                                    <tr>
                                        {slide.tableData.headers.map((h, i) => (
                                            <th
                                                className={styles.tableCell}
                                                key={i}
                                                style={{ background: 'var(--ant-color-primary)', color: 'white', fontWeight: 600 }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {slide.tableData.rows.map((row, ri) => (
                                        <tr key={ri}>
                                            {row.map((cell, ci) => (
                                                <td className={styles.tableCell} key={ci}>{cell}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Speaker Notes */}
                    {slide.notes && (
                        <div className={styles.slideNotes}>
                            📝 <strong>Speaker notes:</strong> {slide.notes}
                        </div>
                    )}

                    {/* Navigation */}
                    <Flexbox align="center" horizontal justify="space-between">
                        <Flexbox align="center" gap={6} horizontal>
                            <button
                                className={styles.navBtn}
                                disabled={currentSlide === 0}
                                onClick={() => setCurrentSlide((n) => n - 1)}
                                type="button"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <span style={{ fontSize: 12 }}>
                                Slide {currentSlide + 1} / {deck.slides.length}
                            </span>
                            <button
                                className={styles.navBtn}
                                disabled={currentSlide === deck.slides.length - 1}
                                onClick={() => setCurrentSlide((n) => n + 1)}
                                type="button"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </Flexbox>

                        <Flexbox gap={8} horizontal>
                            <Button
                                icon={<Sparkles size={14} />}
                                onClick={generateSlides}
                                size="small"
                                type="default"
                            >
                                Regenerate
                            </Button>
                            <Button
                                icon={<Download size={14} />}
                                loading={exporting}
                                onClick={exportPPTX}
                                size="small"
                                type="primary"
                            >
                                Export PPTX
                            </Button>
                        </Flexbox>
                    </Flexbox>
                </Flexbox>
            )}
        </Flexbox>
    );
});

ResearchSlides.displayName = 'ResearchSlides';
export default ResearchSlides;
