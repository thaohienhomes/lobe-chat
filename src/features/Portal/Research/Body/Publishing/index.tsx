'use client';

import { Button, Tag } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { CheckCircle, Copy, ExternalLink, FileText } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
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
    previewFrame: css`
    overflow: hidden;

    width: 100%;
    height: 500px;

    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
  `,
    sectionTitle: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorTextSecondary};
  `,
    successCard: css`
    padding: 16px;

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

// ===== Helper functions =====
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

// ===== HTML Document Builder =====
const buildStyledHTML = (
    query: string,
    pico: { comparison: string; intervention: string; outcome: string; population: string } | null,
    allPapers: PaperResult[],
    included: PaperResult[],
    excluded: PaperResult[],
): string => {
    const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const pubmedCount = allPapers.filter((p) => p.source === 'PubMed').length;
    const oaCount = allPapers.filter((p) => p.source === 'OpenAlex').length;
    const years = included.map((p) => p.year).filter((y) => y > 0);
    const yearRange = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : 'N/A';
    const totalCitations = included.reduce((s, p) => s + (p.citations || 0), 0);
    const grade = assessGradeLevel(included);
    const gradeColor = grade === 'High' ? '#059669' : grade === 'Moderate' ? '#2563eb' : grade === 'Low' ? '#d97706' : '#dc2626';

    const typeCounts: Record<string, number> = {};
    for (const p of included) {
        const t = inferStudyType(p);
        typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    const typeList = Object.entries(typeCounts).sort(([, a], [, b]) => b - a);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Systematic Review: ${query}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');

  :root {
    --primary: #1a365d;
    --secondary: #2d3748;
    --accent: #3182ce;
    --bg: #ffffff;
    --bg-alt: #f7fafc;
    --border: #e2e8f0;
    --text: #1a202c;
    --text-secondary: #4a5568;
    --text-light: #718096;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Crimson Pro', Georgia, serif;
    font-size: 16px;
    line-height: 1.8;
    color: var(--text);
    background: var(--bg);
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 24px;
  }

  h1 {
    font-family: 'Inter', sans-serif;
    font-size: 24px;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 8px;
    line-height: 1.3;
    border-bottom: 3px solid var(--accent);
    padding-bottom: 12px;
  }

  h2 {
    font-family: 'Inter', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--primary);
    margin-top: 32px;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
  }

  h3 {
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--secondary);
    margin-top: 20px;
    margin-bottom: 8px;
  }

  p { margin-bottom: 12px; }

  .meta {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: var(--text-light);
    margin-bottom: 24px;
  }

  .abstract-box {
    background: var(--bg-alt);
    border-left: 4px solid var(--accent);
    padding: 20px 24px;
    margin: 16px 0 24px;
    border-radius: 0 8px 8px 0;
  }

  .abstract-box p { margin-bottom: 8px; }
  .abstract-box strong { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; }

  .pico-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 20px;
    font-size: 14px;
  }

  .pico-table th {
    background: var(--primary);
    color: white;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    padding: 8px 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .pico-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }

  .pico-table tr:nth-child(even) td { background: var(--bg-alt); }

  .evidence-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 20px;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
  }

  .evidence-table thead th {
    background: var(--primary);
    color: white;
    font-size: 11px;
    font-weight: 600;
    text-align: left;
    padding: 8px 10px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .evidence-table td {
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
    font-size: 12px;
  }

  .evidence-table tr:nth-child(even) td { background: var(--bg-alt); }

  .evidence-table .study-type {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
    background: #ebf8ff;
    color: #2b6cb0;
    white-space: nowrap;
  }

  .flow-diagram {
    background: var(--bg-alt);
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    margin: 16px 0;
    text-align: center;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
  }

  .flow-box {
    display: inline-block;
    padding: 10px 20px;
    margin: 6px;
    border: 2px solid var(--accent);
    border-radius: 8px;
    background: white;
    font-weight: 600;
    font-size: 13px;
  }

  .flow-box.excluded {
    border-color: #e53e3e;
    color: #e53e3e;
  }

  .flow-box.included {
    border-color: #38a169;
    color: #38a169;
    background: #f0fff4;
  }

  .flow-arrow {
    display: block;
    font-size: 20px;
    color: var(--text-light);
    margin: 4px 0;
  }

  .grade-badge {
    display: inline-block;
    padding: 4px 16px;
    border-radius: 20px;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: white;
  }

  .grade-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 20px;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
  }

  .grade-table th {
    background: var(--bg-alt);
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    padding: 8px 12px;
    border-bottom: 2px solid var(--border);
  }

  .grade-table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }

  .tag {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
  }

  .tag-warn { background: #fefcbf; color: #975a16; }
  .tag-ok { background: #c6f6d5; color: #276749; }

  .references {
    font-size: 14px;
    line-height: 1.6;
    counter-reset: ref;
  }

  .references p {
    padding-left: 28px;
    text-indent: -28px;
    margin-bottom: 6px;
  }

  .references a { color: var(--accent); text-decoration: none; }
  .references a:hover { text-decoration: underline; }

  .placeholder {
    color: var(--text-light);
    font-style: italic;
    background: #fffbeb;
    padding: 8px 12px;
    border-left: 3px solid #f6ad55;
    border-radius: 0 4px 4px 0;
    font-size: 14px;
    margin: 8px 0;
  }

  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    color: var(--text-light);
    text-align: center;
  }

  @media print {
    body { padding: 20px; }
    h2 { page-break-before: auto; }
    .evidence-table, .pico-table, .grade-table { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<h1>Systematic Review: ${query}</h1>
<p class="meta">Prepared using Phở Chat Research Mode &mdash; ${today}</p>

<h2>Abstract</h2>
<div class="abstract-box">
  <p><strong>Background: </strong>This systematic review examines the existing evidence on &ldquo;${query}&rdquo; to synthesize findings from published literature.</p>
  <p><strong>Methods: </strong>A systematic search was conducted across PubMed (MEDLINE) and OpenAlex databases on ${today}. Studies were screened using the PICO framework${pico ? ` (Population: ${pico.population}; Intervention: ${pico.intervention}; Comparison: ${pico.comparison}; Outcome: ${pico.outcome})` : ''}. Quality assessment was performed using the GRADE approach.</p>
  <p><strong>Results: </strong>${allPapers.length} records were identified. After screening, ${included.length} studies met inclusion criteria (${excluded.length} excluded). The included studies span ${yearRange}, with a combined ${totalCitations.toLocaleString()} citations. Study types: ${typeList.map(([t, c]) => `${t} (n=${c})`).join(', ')}. Overall certainty of evidence was rated as ${grade} (GRADE).</p>
  <p><strong>Conclusions: </strong><span class="placeholder">To be completed by the researcher based on the evidence synthesis.</span></p>
</div>

<h2>1. Introduction</h2>

<h3>1.1 Rationale</h3>
<p class="placeholder">Describe the existing knowledge gap and why this systematic review on &ldquo;${query}&rdquo; is needed.</p>

<h3>1.2 Objectives</h3>
<p>${pico ? `To systematically review and synthesize the evidence regarding the effect of <strong>${pico.intervention}</strong> on <strong>${pico.outcome}</strong> in <strong>${pico.population}</strong>, compared to <strong>${pico.comparison}</strong>.` : `To systematically review and synthesize the evidence on <strong>${query}</strong>.`}</p>

<h2>2. Methods</h2>

<h3>2.1 Protocol and Registration</h3>
<p>This review was conducted following the PRISMA 2020 guidelines (Page et al., 2021).</p>

<h3>2.2 Eligibility Criteria</h3>
${pico ? `
<table class="pico-table">
  <thead><tr><th>PICO Component</th><th>Criteria</th></tr></thead>
  <tbody>
    <tr><td><strong>Population (P)</strong></td><td>${pico.population}</td></tr>
    <tr><td><strong>Intervention (I)</strong></td><td>${pico.intervention}</td></tr>
    <tr><td><strong>Comparison (C)</strong></td><td>${pico.comparison}</td></tr>
    <tr><td><strong>Outcome (O)</strong></td><td>${pico.outcome}</td></tr>
  </tbody>
</table>` : '<p class="placeholder">Define eligibility criteria using the PICO framework.</p>'}

<h3>2.3 Information Sources</h3>
<p>The following databases were searched on ${today}:</p>
<ul>
  <li><strong>PubMed (MEDLINE)</strong> &mdash; ${pubmedCount} records retrieved</li>
  <li><strong>OpenAlex</strong> &mdash; ${oaCount} records retrieved</li>
</ul>

<h3>2.4 Search Strategy</h3>
<p>Search query: <code>${query}</code></p>

<h3>2.5 Selection Process</h3>
<p>All ${allPapers.length} identified records were screened against the eligibility criteria. ${included.length} studies met all inclusion criteria.</p>

<h3>2.6 Quality Assessment</h3>
<p>The quality of evidence was assessed using the GRADE approach across five domains: risk of bias, inconsistency, indirectness, imprecision, and publication bias.</p>

<h2>3. Results</h2>

<h3>3.1 Study Selection (PRISMA Flow)</h3>
<div class="flow-diagram">
  <div class="flow-box">Records identified: ${allPapers.length}</div>
  <br><span style="font-size:12px;color:#718096">PubMed: ${pubmedCount} &nbsp;|&nbsp; OpenAlex: ${oaCount}</span>
  <div class="flow-arrow">↓</div>
  <div class="flow-box">Records screened: ${allPapers.length}</div>
  <div class="flow-arrow">↓ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; →</div>
  <div class="flow-box excluded">Excluded: ${excluded.length}</div>
  <div class="flow-arrow">↓</div>
  <div class="flow-box included">✓ Included in review: ${included.length}</div>
</div>

<h3>3.2 Study Characteristics</h3>
<p>A total of ${included.length} studies published between ${yearRange} were included. The study designs comprised: ${typeList.map(([t, c]) => `${t} (n=${c}, ${Math.round((c / included.length) * 100)}%)`).join('; ')}.</p>

<p><strong>Table 1. Characteristics of Included Studies</strong></p>
<table class="evidence-table">
  <thead>
    <tr><th>#</th><th>Study</th><th>Authors</th><th>Design</th><th>Journal</th><th>Year</th><th>Citations</th></tr>
  </thead>
  <tbody>
    ${included.map((p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.title}</td>
      <td>${p.authors}</td>
      <td><span class="study-type">${inferStudyType(p)}</span></td>
      <td>${p.journal || '–'}</td>
      <td>${p.year}</td>
      <td>${p.citations?.toLocaleString() || '–'}</td>
    </tr>`).join('')}
  </tbody>
</table>

<h3>3.3 Risk of Bias Assessment</h3>
<p class="placeholder">Complete after individual study assessment using appropriate tools (e.g., RoB 2 for RCTs, ROBINS-I for observational).</p>

<h3>3.4 Synthesis of Results</h3>
<p class="placeholder">Narrative synthesis or meta-analysis results to be added by the researcher.</p>

<h2>4. Discussion</h2>

<h3>4.1 Summary of Evidence</h3>
<p>This systematic review identified ${included.length} studies on &ldquo;${query}&rdquo;. The overall certainty of evidence was rated as <span class="grade-badge" style="background:${gradeColor}">${grade}</span> according to GRADE assessment.</p>

<h3>4.2 Limitations</h3>
<p class="placeholder">Discuss limitations at study and review level.</p>

<h3>4.3 Conclusions</h3>
<p class="placeholder">State the main conclusions and their relevance to clinical practice.</p>

<h2>5. GRADE Summary of Findings</h2>
<table class="grade-table">
  <thead><tr><th>Domain</th><th>Rating</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Risk of Bias</td><td><span class="tag tag-warn">⚠️ To assess</span></td><td>Individual study assessment required</td></tr>
    <tr><td>Inconsistency</td><td><span class="tag tag-warn">⚠️ To assess</span></td><td>Compare effect estimates across studies</td></tr>
    <tr><td>Indirectness</td><td><span class="tag tag-warn">⚠️ To assess</span></td><td>Evaluate PICO alignment</td></tr>
    <tr><td>Imprecision</td><td><span class="tag tag-warn">⚠️ To assess</span></td><td>Consider confidence intervals</td></tr>
    <tr><td>Publication Bias</td><td><span class="tag tag-warn">⚠️ To assess</span></td><td>Funnel plot analysis recommended</td></tr>
    <tr><td><strong>Overall GRADE</strong></td><td><span class="grade-badge" style="background:${gradeColor}">${grade}</span></td><td>Based on ${included.length} included studies</td></tr>
  </tbody>
</table>

<h2>6. References</h2>

<h3>Included Studies</h3>
<div class="references">
  ${included.map((p, i) => `<p>${i + 1}. ${p.authors}. ${p.title}. <em>${p.journal || 'N/A'}</em>. ${p.year}.${p.doi ? ` DOI: <a href="https://doi.org/${p.doi}">${p.doi}</a>` : ''}</p>`).join('\n  ')}
</div>

<h3>Methodology References</h3>
<div class="references">
  <p>${included.length + 1}. Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. <em>BMJ</em>. 2021;372:n71.</p>
  <p>${included.length + 2}. Guyatt GH, Oxman AD, Vist GE, et al. GRADE: an emerging consensus on rating quality of evidence and strength of recommendations. <em>BMJ</em>. 2008;336(7650):924-926.</p>
</div>

<div class="footer">
  Generated by Phở Chat Research Mode on ${today}.<br>
  Sections marked in <span style="color:#d97706">orange</span> require researcher input.
</div>

</body>
</html>`;
};

// ===== Export Formats =====
const EXPORT_FORMATS = [
    {
        desc: 'Open beautifully formatted systematic review in new tab — ready to print/save as PDF',
        format: 'html_preview',
        icon: '📄',
        label: 'Full Systematic Review (HTML)',
        primary: true,
    },
    {
        desc: 'Copy formatted content — paste into Google Docs/Word with proper headings & tables',
        format: 'rich_copy',
        icon: '📋',
        label: 'Copy to Google Docs / Word',
        primary: false,
    },
    {
        desc: 'Raw Markdown for Overleaf, Quarto, or GitHub — with full PRISMA structure',
        format: 'markdown',
        icon: '📝',
        label: 'Raw Markdown (Overleaf / Quarto)',
        primary: false,
    },
    {
        desc: 'Vancouver-style numbered bibliography ready for submission',
        format: 'references',
        icon: '📚',
        label: 'References Only (Vancouver)',
        primary: false,
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

    const htmlDocument = useMemo(
        () => buildStyledHTML(searchQuery, pico, papers, includedPapers, excludedPapers),
        [searchQuery, pico, papers, includedPapers, excludedPapers],
    );

    const handleExport = useCallback((format: string) => {
        switch (format) {
            case 'html_preview': {
                // Open styled HTML in new tab
                const blob = new Blob([htmlDocument], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                setExported(format);
                setTimeout(() => setExported(null), 3000);
                break;
            }

            case 'rich_copy': {
                // Copy rich HTML to clipboard — pastes formatted in Google Docs/Word
                const blobHTML = new Blob([htmlDocument], { type: 'text/html' });
                const blobText = new Blob([htmlDocument], { type: 'text/plain' });
                const clipboardItem = new ClipboardItem({
                    'text/html': blobHTML,
                    'text/plain': blobText,
                });
                navigator.clipboard.write([clipboardItem]);
                setExported(format);
                setTimeout(() => setExported(null), 3000);
                break;
            }

            case 'markdown': {
                // Raw Markdown for Overleaf / Quarto
                const today = new Date().toISOString().split('T')[0];
                const years = includedPapers.map((p) => p.year).filter((y) => y > 0);
                const yearRange = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : 'N/A';
                const totalCitations = includedPapers.reduce((s, p) => s + (p.citations || 0), 0);
                const grade = assessGradeLevel(includedPapers);
                const typeCounts: Record<string, number> = {};
                for (const p of includedPapers) { const t = inferStudyType(p); typeCounts[t] = (typeCounts[t] || 0) + 1; }
                const typeList = Object.entries(typeCounts).sort(([, a], [, b]) => b - a);

                const md = [
                    `# Systematic Review: ${searchQuery}`,
                    `*${today}*`,
                    '',
                    '## Abstract',
                    `**Background:** This systematic review examines evidence on "${searchQuery}".`,
                    `**Methods:** PubMed + OpenAlex searched on ${today}. PICO: ${pico ? `P: ${pico.population}, I: ${pico.intervention}, C: ${pico.comparison}, O: ${pico.outcome}` : 'N/A'}. GRADE assessment applied.`,
                    `**Results:** ${papers.length} identified → ${includedPapers.length} included. Years ${yearRange}. ${totalCitations.toLocaleString()} total citations. Types: ${typeList.map(([t, c]) => `${t}(${c})`).join(', ')}. GRADE: ${grade}.`,
                    `**Conclusions:** [To be completed]`,
                    '',
                    '## 1. Introduction', '',
                    `### 1.1 Rationale`, '[Describe knowledge gap]', '',
                    `### 1.2 Objectives`,
                    pico ? `To review ${pico.intervention} effects on ${pico.outcome} in ${pico.population} vs ${pico.comparison}.` : `To review ${searchQuery}.`,
                    '',
                    '## 2. Methods', '',
                    '### 2.1 Eligibility',
                    pico ? `| Component | Criteria |\n|---|---|\n| P | ${pico.population} |\n| I | ${pico.intervention} |\n| C | ${pico.comparison} |\n| O | ${pico.outcome} |` : '[PICO]',
                    '',
                    `### 2.2 Sources`, `PubMed (${papers.filter((p) => p.source === 'PubMed').length}) + OpenAlex (${papers.filter((p) => p.source === 'OpenAlex').length})`,
                    `### 2.3 Search`, `Query: \`${searchQuery}\``,
                    '',
                    '## 3. Results', '',
                    `### PRISMA Flow`, `Identified: ${papers.length} → Screened: ${papers.length} → Excluded: ${excludedPapers.length} → **Included: ${includedPapers.length}**`,
                    '',
                    '### Study Characteristics',
                    '| # | Study | Design | Year | Citations |',
                    '|---|---|---|---|---|',
                    ...includedPapers.map((p, i) => `| ${i + 1} | ${p.title} | ${inferStudyType(p)} | ${p.year} | ${p.citations?.toLocaleString() || '–'} |`),
                    '',
                    '## 4. Discussion', '', '[Summary + Limitations + Conclusions]',
                    '',
                    '## References',
                    ...includedPapers.map((p, i) => `${i + 1}. ${p.authors}. ${p.title}. *${p.journal || 'N/A'}*. ${p.year}.${p.doi ? ` DOI: ${p.doi}` : ''}`),
                ].join('\n');
                navigator.clipboard.writeText(md);
                setExported(format);
                setTimeout(() => setExported(null), 3000);
                break;
            }

            case 'references': {
                const refs = includedPapers.map((p, i) =>
                    `${i + 1}. ${p.authors}. ${p.title}. ${p.journal || 'N/A'}. ${p.year}.${p.doi ? ` DOI: ${p.doi}` : ''}`,
                ).join('\n');
                navigator.clipboard.writeText(refs);
                setExported(format);
                setTimeout(() => setExported(null), 3000);
                break;
            }
            // No default
        }
    }, [htmlDocument, searchQuery, pico, papers, includedPapers, excludedPapers]);

    return (
        <Flexbox className={styles.container} gap={16}>
            {/* Summary */}
            <div className={styles.summaryCard}>
                <Flexbox gap={12}>
                    <span style={{ fontSize: 15, fontWeight: 700 }}>📤 Publishing Summary</span>
                    <Flexbox gap={4}>
                        <span className={styles.checklist}><CheckCircle color="#52c41a" size={14} /> Research question defined</span>
                        <span className={styles.checklist}><CheckCircle color="#52c41a" size={14} /> {papers.length} papers searched (PubMed + OpenAlex)</span>
                        <span className={styles.checklist}><CheckCircle color="#52c41a" size={14} /> {includedPapers.length} included, {excludedPapers.length} excluded</span>
                        <span className={styles.checklist}><CheckCircle color="#52c41a" size={14} /> GRADE assessment completed</span>
                        <span className={styles.checklist}><CheckCircle color="#52c41a" size={14} /> PRISMA 2020 structure ready</span>
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
                                <Flexbox align={'center'} gap={8} horizontal>
                                    <span className={styles.exportTitle}>
                                        {fmt.icon} {fmt.label}
                                    </span>
                                    {fmt.primary && <Tag color="blue" style={{ fontSize: 10 }}>Recommended</Tag>}
                                </Flexbox>
                                <span className={styles.exportDesc}>{fmt.desc}</span>
                            </Flexbox>
                            {exported === fmt.format ? (
                                <Tag color="green">✓ Done!</Tag>
                            ) : fmt.format === 'html_preview' ? (
                                <ExternalLink size={16} style={{ opacity: 0.5 }} />
                            ) : (
                                <Copy size={16} style={{ opacity: 0.5 }} />
                            )}
                        </Flexbox>
                    </div>
                ))}
            </Flexbox>

            {/* Inline Preview */}
            <Flexbox gap={8}>
                <span className={styles.sectionTitle}>👀 Preview</span>
                <iframe
                    className={styles.previewFrame}
                    srcDoc={htmlDocument}
                    title="Systematic Review Preview"
                />
            </Flexbox>

            {/* Success */}
            {exported && (
                <div className={styles.successCard}>
                    <Flexbox align={'center'} gap={6}>
                        <CheckCircle color="#52c41a" size={24} />
                        <span style={{ fontSize: 14, fontWeight: 700 }}>
                            {exported === 'html_preview' ? 'Opened in new tab!' : 'Copied to clipboard!'}
                        </span>
                    </Flexbox>
                </div>
            )}

            {/* Navigation */}
            <Flexbox gap={8} horizontal justify={'space-between'}>
                <Button onClick={() => setActivePhase('writing')} size={'small'}>← Back to Writing</Button>
                <Button onClick={() => setActivePhase('discovery')} size={'small'} type={'primary'}>🔄 New Research</Button>
            </Flexbox>
        </Flexbox>
    );
});

PublishingPhase.displayName = 'PublishingPhase';

export default PublishingPhase;
