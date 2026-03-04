'use client';

import { Button, Dropdown, Input, Select, Spin, Tag, Tooltip, message } from 'antd';
import { createStyles } from 'antd-style';
import {
    BookOpen,
    ChevronDown,
    ChevronRight,
    ClipboardCopy,
    Download,
    Loader2,
    Play,
    RefreshCw,
    Search,
    Sparkles,
} from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { Markdown } from '@lobehub/ui';
import { downloadFile } from '@/utils/client';

const { TextArea } = Input;

/* ────────────────────────── types ────────────────────────── */

type Phase = 'input' | 'clarify' | 'research' | 'outline' | 'article' | 'done';

interface AgentResult {
    content: string;
    name: string;
    status: 'idle' | 'running' | 'done' | 'error';
}

interface OutlineItem {
    children?: OutlineItem[];
    title: string;
}

/* ────────────────────────── agents ────────────────────────── */

const AGENTS = [
    {
        desc: 'Tìm kiếm RCTs, meta-analyses, cohort studies liên quan',
        emoji: '🔬',
        name: 'Clinical Researcher',
    },
    {
        desc: 'Đánh giá chất lượng nghiên cứu, risk of bias, study design',
        emoji: '📐',
        name: 'Methodologist',
    },
    {
        desc: 'Đánh giá ứng dụng thực tế, hiệu quả lâm sàng, dose-response',
        emoji: '👨‍⚕️',
        name: 'Clinician',
    },
    {
        desc: 'Tác dụng phụ, chất lượng cuộc sống, tuân thủ điều trị',
        emoji: '🧑‍🤝‍🧑',
        name: 'Patient Advocate',
    },
];

const MODELS = [
    { label: 'Gemini 2.5 Flash (fast)', value: 'gemini-2.5-flash' },
    { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
    { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
    { label: 'GPT-4o', value: 'gpt-4o' },
    { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
];

/* ────────────────────────── styles ────────────────────────── */

const useStyles = createStyles(({ css, token }) => ({
    agentCard: css`
    padding: 12px;
    background: ${token.colorFillQuaternary};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: ${token.borderRadiusLG}px;
    transition: all 0.3s;
  `,
    agentDone: css`border-color: ${token.colorSuccess};`,
    agentError: css`border-color: ${token.colorError};`,
    agentRunning: css`border-color: ${token.colorPrimary}; box-shadow: 0 0 8px ${token.colorPrimaryBg};`,
    article: css`
    padding: 16px;
    font-size: 14px;
    line-height: 1.7;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadiusLG}px;
    white-space: pre-wrap;
    max-height: 60vh;
    overflow-y: auto;
  `,
    container: css`
    overflow-y: auto;
    width: 100%;
    height: 100%;
    padding: 16px;
  `,
    header: css`
    font-size: 18px;
    font-weight: 700;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  `,
    outlineItem: css`
    padding: 6px 12px;
    cursor: pointer;
    border-radius: ${token.borderRadius}px;
    &:hover { background: ${token.colorFillSecondary}; }
  `,
    phaseActive: css`
    padding: 3px 10px;
    font-weight: 600;
    color: ${token.colorPrimary};
    background: ${token.colorPrimaryBg};
    border: 1px solid ${token.colorPrimaryBorder};
    border-radius: 16px;
  `,
    phaseBar: css`
    display: flex;
    gap: 4px;
    align-items: center;
    padding: 8px 12px;
    font-size: 11px;
    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadiusLG}px;
    flex-wrap: wrap;
  `,
    phaseDone: css`
    padding: 3px 10px;
    color: ${token.colorSuccess};
    background: ${token.colorSuccessBg};
    border-radius: 16px;
  `,
    phaseItem: css`
    padding: 3px 10px;
    color: ${token.colorTextQuaternary};
    border-radius: 16px;
  `,
    progressLine: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
    padding: 2px 0;
  `,
    subtitle: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
}));

/* ────────────────────────── helpers ────────────────────────── */

async function callAI(model: string, prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000); // 90s timeout

    try {
        const res = await fetch('/api/research/ai-summary', {
            body: JSON.stringify({ model, prompt }),
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            signal: controller.signal,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        console.log('[DeepResearch] callAI response:', { length: data.text?.length, model: data.model, provider: data.provider });
        return data.text || '';
    } finally {
        clearTimeout(timeoutId);
    }
}

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/* ────────────────────────── component ────────────────────────── */

const DeepResearchBody = memo(() => {
    const { styles, cx } = useStyles();
    const [phase, setPhase] = useState<Phase>('input');
    const [question, setQuestion] = useState('');
    const [model, setModel] = useState('gemini-2.5-flash');
    const [clarifyQs, setClarifyQs] = useState<string[]>([]);
    const [clarifyAnswers, setClarifyAnswers] = useState<Record<number, string>>({});
    const [agents, setAgents] = useState<AgentResult[]>(
        AGENTS.map((a) => ({ content: '', name: a.name, status: 'idle' }))
    );
    const [progressLines, setProgressLines] = useState<string[]>([]);
    const [outline, setOutline] = useState<OutlineItem[]>([]);
    const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
    const [article, setArticle] = useState('');
    const abortRef = useRef(false);
    const startResearchRef = useRef<(() => void) | undefined>(undefined);

    const PHASES_LIST: { key: Phase; label: string }[] = [
        { key: 'input', label: '📝 Câu hỏi' },
        { key: 'clarify', label: '❓ Làm rõ' },
        { key: 'research', label: '🔍 Nghiên cứu' },
        { key: 'outline', label: '📋 Dàn bài' },
        { key: 'article', label: '✍️ Viết bài' },
        { key: 'done', label: '✅ Hoàn thành' },
    ];

    const phaseIndex = PHASES_LIST.findIndex((p) => p.key === phase);

    /* ── Phase 1 → Clarify ── */
    const handleStart = useCallback(async () => {
        if (!question.trim()) return;
        setPhase('clarify');
        setProgressLines(['🤔 Đang phân tích câu hỏi nghiên cứu...']);

        try {
            const prompt = `You are a medical research methodology expert. The user wants to write a literature review on the following clinical question:

"${question}"

Generate 3-4 clarifying questions to help scope the review. Each question should be concise and help define:
- Population/condition scope
- Intervention types to include
- Outcome measures of interest
- Time frame or study design preferences

Format: Return ONLY a JSON array of strings, each being one question. Example:
["Should the review focus only on RCTs, or include observational studies?", "What age group should be included?"]

Return ONLY the JSON array, no other text.`;

            const result = await callAI(model, prompt);
            console.log('[DeepResearch] Clarify raw result:', result.slice(0, 500));
            try {
                // Clean markdown code fences and extract JSON
                let cleaned = result.replaceAll('```json', '').replaceAll('```', '').trim();
                // Also try to extract JSON array from any surrounding text
                const jsonMatch = cleaned.match(/\[\s*"[\S\s]*]/);
                if (jsonMatch) cleaned = jsonMatch[0];
                const parsed = JSON.parse(cleaned);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setClarifyQs(parsed);
                    setProgressLines((prev) => [...prev, '✅ Câu hỏi làm rõ đã được tạo']);
                    return; // Stay in clarify phase
                }
            } catch (parseErr) {
                console.warn('[DeepResearch] Failed to parse clarify JSON:', parseErr);
            }
            // If we get here, parsing failed or empty — skip to research
            console.log('[DeepResearch] Skipping clarify phase, going to research directly');
            setClarifyQs([]);
            setPhase('research');
            setProgressLines((prev) => [...prev, '⚠️ Bỏ qua giai đoạn làm rõ, bắt đầu nghiên cứu trực tiếp...']);
        } catch (e: any) {
            console.error('[DeepResearch] handleStart error:', e);
            message.error(`Lỗi: ${e.message}`);
            setPhase('input');
        }
    }, [question, model]);

    /* ── Phase 3 → Outline ── */
    const startOutline = useCallback(async (agentFindings: string) => {
        setPhase('outline');

        try {
            const prompt = `You are an academic writing expert specializing in medical literature reviews. Based on the following multi-perspective research findings, generate a structured outline for a comprehensive literature review.

Clinical Question: "${question}"

Research Findings:
${agentFindings.slice(0, 12_000)}

Generate a hierarchical outline with main sections and subsections. The outline should follow standard medical literature review structure:
1. Introduction & Background
2. Search Strategy & Methods
3. Results (organized by themes/outcomes)
4. Quality of Evidence (GRADE assessment)
5. Discussion
6. Clinical Implications
7. Conclusions

Format: Return ONLY a JSON array of objects with "title" and optional "children" array. Example:
[{"title": "1. Introduction", "children": [{"title": "1.1 Background"}, {"title": "1.2 Rationale"}]}, {"title": "2. Methods"}]

Return ONLY the JSON array.`;

            const result = await callAI(model, prompt);
            try {
                const cleaned = result.replaceAll('```json\n', '').replaceAll('```\n', '').replaceAll('```', '').trim();
                const parsed = JSON.parse(cleaned);
                setOutline(Array.isArray(parsed) ? parsed : []);
                setExpandedSections(new Set(parsed.map((_: any, i: number) => i)));
            } catch {
                // Fallback outline
                setOutline([
                    { children: [{ title: '1.1 Background' }, { title: '1.2 Rationale' }], title: '1. Introduction' },
                    { title: '2. Search Strategy & Methods' },
                    { children: [{ title: '3.1 Study Characteristics' }, { title: '3.2 Key Findings' }], title: '3. Results' },
                    { title: '4. Quality of Evidence' },
                    { title: '5. Discussion' },
                    { title: '6. Clinical Implications' },
                    { title: '7. Conclusions' },
                ]);
            }
            setProgressLines((prev) => [...prev, '✅ Dàn bài đã tạo xong']);
        } catch (e: any) {
            message.error(`Outline error: ${e.message}`);
        }
    }, [question, model]);

    /* ── Phase 2 → Research ── */
    const startResearch = useCallback(async () => {
        setPhase('research');
        abortRef.current = false;

        const clarifyContext = clarifyQs.length > 0
            ? `\n\nAdditional scope context from clarifying questions:\n${clarifyQs.map((q, i) => `Q: ${q}\nA: ${clarifyAnswers[i] || 'No specific preference'}`).join('\n')}`
            : '';

        const agentPrompts = AGENTS.map((agent) => {
            const perspectiveMap: Record<string, string> = {
                'Clinical Researcher': `You are a clinical researcher conducting a literature search. Find and summarize key clinical studies (RCTs, systematic reviews, meta-analyses) relevant to this question. For each study found, provide: Author/Year, Study Design, Sample Size, Key Findings, and Limitations. Focus on the highest quality evidence available.`,
                'Clinician': `You are an experienced clinician evaluating the clinical applicability of research. Assess the practical implications of findings for this question. Consider: treatment protocols, dose-response relationships, patient selection criteria, monitoring requirements, clinical decision-making algorithms, and real-world effectiveness vs efficacy.`,
                'Methodologist': `You are a research methodologist reviewing the quality of evidence. For this question, assess: study design adequacy, risk of bias (using Cochrane RoB 2.0 or ROBINS-I frameworks), heterogeneity concerns, publication bias indicators, statistical methods used, and overall quality of evidence (using GRADE or similar framework).`,
                'Patient Advocate': `You are a patient advocate reviewing research from the patient perspective. For this question, evaluate: adverse effects and tolerability, impact on quality of life, treatment burden and adherence challenges, patient-reported outcomes, accessibility and cost considerations, and patient preference data.`,
            };

            return {
                name: agent.name,
                prompt: `${perspectiveMap[agent.name] || ''}

Clinical Question: "${question}"${clarifyContext}

Provide a thorough analysis from your perspective. Use markdown formatting with headers, bullet points, and bold for key findings. Include specific data points (percentages, confidence intervals, p-values) where relevant. Cite studies as [Author, Year] format.`,
            };
        });

        // Run agents in parallel
        const updatedAgents = [...agents];
        const promises = agentPrompts.map(async (ap, idx) => {
            updatedAgents[idx] = { ...updatedAgents[idx], status: 'running' };
            setAgents([...updatedAgents]);
            setProgressLines((prev) => [...prev, `🔄 ${AGENTS[idx].emoji} ${ap.name} đang nghiên cứu...`]);

            try {
                const result = await callAI(model, ap.prompt);
                if (abortRef.current) return;
                updatedAgents[idx] = { content: result, name: ap.name, status: 'done' };
                setAgents([...updatedAgents]);
                setProgressLines((prev) => [...prev, `✅ ${AGENTS[idx].emoji} ${ap.name} hoàn thành`]);
            } catch (e: any) {
                updatedAgents[idx] = { content: e.message, name: ap.name, status: 'error' };
                setAgents([...updatedAgents]);
                setProgressLines((prev) => [...prev, `❌ ${AGENTS[idx].emoji} ${ap.name} lỗi: ${e.message}`]);
            }
        });

        await Promise.all(promises);
        if (!abortRef.current) {
            setProgressLines((prev) => [...prev, '📋 Đang tạo dàn bài...']);
            const findings = updatedAgents
                .filter((a) => a.status === 'done')
                .map((a) => `## ${a.name}\n${a.content}`)
                .join('\n\n---\n\n');
            startOutline(findings);
        }
    }, [question, model, clarifyQs, clarifyAnswers, agents, startOutline]);

    // Keep ref in sync so handleStart can trigger it without forward reference
    startResearchRef.current = startResearch;

    // Auto-trigger research when phase transitions to 'research' but agents haven't started
    useEffect(() => {
        if (phase === 'research' && agents.every((a) => a.status === 'idle')) {
            startResearch();
        }
    }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Phase 4 → Article ── */
    const handleGenerateArticle = useCallback(async () => {
        setPhase('article');
        setProgressLines((prev) => [...prev, '✍️ Đang viết bài tổng quan...']);

        const agentFindings = agents
            .filter((a) => a.status === 'done')
            .map((a) => `## ${a.name}\n${a.content}`)
            .join('\n\n---\n\n');

        const outlineStr = outline
            .map((o) => {
                let s = `- ${o.title}`;
                if (o.children) {
                    s += '\n' + o.children.map((c) => `  - ${c.title}`).join('\n');
                }
                return s;
            })
            .join('\n');

        try {
            const prompt = `You are an expert medical academic writer. Write a comprehensive literature review article based on the following outline and research findings.

Clinical Question: "${question}"

Outline:
${outlineStr}

Research Findings from Multiple Perspectives:
${agentFindings.slice(0, 15_000)}

Instructions:
1. Follow the outline structure exactly, using markdown headers (##, ###)
2. Synthesize findings from all perspectives, don't just copy them
3. Include inline citations in [Author, Year] format
4. Add a "Summary of Findings" table at the end
5. Include GRADE quality assessment for major outcomes
6. Use professional academic medical writing style
7. Total length: 2000-4000 words
8. End with "Key Takeaways" bullet points

Write the full article now in markdown format.`;

            const result = await callAI(model, prompt);
            const footer = `\n\n---\n\n*📚 Generated by Phở Chat Deep Research Mode — Inspired by Stanford STORM*\n*${new Date().toLocaleDateString('vi-VN')}*`;
            setArticle(result + footer);
            setPhase('done');
            setProgressLines((prev) => [...prev, '✅ Bài tổng quan hoàn thành!']);
        } catch (e: any) {
            message.error(`Article generation error: ${e.message}`);
            setPhase('outline');
        }
    }, [question, model, outline, agents]);

    /* ── Reset ── */
    const handleReset = () => {
        abortRef.current = true;
        setPhase('input');
        setQuestion('');
        setClarifyQs([]);
        setClarifyAnswers({});
        setAgents(AGENTS.map((a) => ({ content: '', name: a.name, status: 'idle' })));
        setProgressLines([]);
        setOutline([]);
        setArticle('');
    };

    /* ── Export ── */
    const handleDownloadMd = () => {
        downloadFile(article, `deep-research-${Date.now()}.md`, 'text/markdown');
    };

    const handleDownloadHtml = () => {
        // Render markdown to HTML using a simple converter (the content is already markdown)
        const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deep Research - ${question.slice(0, 60)}</title>
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; line-height: 1.7; color: #1a1a1a; }
  h1 { color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
  h2 { color: #2d3748; margin-top: 2em; }
  h3 { color: #4a5568; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
  th { background: #f7fafc; font-weight: 600; }
  blockquote { border-left: 4px solid #667eea; margin: 1em 0; padding: 0.5em 1em; background: #f7fafc; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #1e293b; color: #e2e8f0; padding: 16px; border-radius: 8px; overflow-x: auto; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 2em 0; }
  .footer { margin-top: 3em; padding-top: 1em; border-top: 1px solid #e2e8f0; color: #718096; font-size: 0.85em; }
</style>
</head>
<body>
${article.replaceAll('\n', '<br>\n')}
<div class="footer">
  <p>\uD83D\uDCDA Generated by Ph\u1EDF Chat Deep Research Mode \u2014 Inspired by Stanford STORM</p>
  <p>${new Date().toLocaleDateString('vi-VN')}</p>
</div>
</body>
</html>`;
        downloadFile(htmlContent, `deep-research-${Date.now()}.html`, 'text/html');
    };

    const handlePrintPdf = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            message.error('Kh\u00F4ng th\u1EC3 m\u1EDF c\u1EEDa s\u1ED5 in. Vui l\u00F2ng cho ph\u00E9p popup.');
            return;
        }
        printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Deep Research</title>
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 800px; margin: 20px auto; line-height: 1.7; color: #1a1a1a; font-size: 11pt; }
  h1 { font-size: 18pt; color: #1a365d; }
  h2 { font-size: 14pt; color: #2d3748; margin-top: 1.5em; }
  h3 { font-size: 12pt; color: #4a5568; }
  table { border-collapse: collapse; width: 100%; margin: 1em 0; font-size: 10pt; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; }
  th { background: #f0f0f0; }
  @media print { body { margin: 0; } }
</style></head><body>
${article.replaceAll('\n', '<br>\n')}
</body></html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(article);
        message.success('Đã sao chép vào clipboard');
    };

    /* ── Render ── */
    return (
        <Flexbox className={styles.container} gap={16}>
            {/* Title */}
            <Flexbox align={'center'} gap={8} horizontal>
                <BookOpen size={22} />
                <span className={styles.header}>Deep Research</span>
                <Tag color="purple" style={{ fontSize: 10, marginLeft: 4 }}>STORM-inspired</Tag>
            </Flexbox>
            <span className={styles.subtitle}>
                Tạo bài tổng quan y văn tự động với citations — Lấy cảm hứng từ Stanford STORM
            </span>

            {/* Phase Bar */}
            <div className={styles.phaseBar}>
                {PHASES_LIST.map((p, i) => (
                    <span
                        className={cx(
                            i < phaseIndex ? styles.phaseDone :
                                i === phaseIndex ? styles.phaseActive :
                                    styles.phaseItem
                        )}
                        key={p.key}
                    >
                        {p.label}
                    </span>
                ))}
            </div>

            {/* ────── PHASE: INPUT ────── */}
            {phase === 'input' && (
                <Flexbox gap={12}>
                    <TextArea
                        autoSize={{ maxRows: 6, minRows: 3 }}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Nhập câu hỏi nghiên cứu lâm sàng... Ví dụ: What is the efficacy of GLP-1 agonists vs SGLT2 inhibitors for type 2 diabetes with heart failure?"
                        style={{ fontSize: 14 }}
                        value={question}
                    />
                    <Flexbox gap={8} horizontal>
                        <Select
                            onChange={setModel}
                            options={MODELS}
                            style={{ width: 220 }}
                            value={model}
                        />
                        <Button
                            disabled={!question.trim()}
                            icon={<Sparkles size={14} />}
                            onClick={handleStart}
                            type="primary"
                        >
                            🚀 Bắt đầu nghiên cứu
                        </Button>
                    </Flexbox>
                </Flexbox>
            )}

            {/* ────── PHASE: CLARIFY ────── */}
            {phase === 'clarify' && (
                <Flexbox gap={12}>
                    <span style={{ fontWeight: 600 }}>❓ Câu hỏi làm rõ phạm vi nghiên cứu:</span>
                    {clarifyQs.length === 0 ? (
                        <Spin size="small" />
                    ) : (
                        <>
                            {clarifyQs.map((q, i) => (
                                <Flexbox gap={4} key={i}>
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{i + 1}. {q}</span>
                                    <Input
                                        onChange={(e) => setClarifyAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                                        placeholder="Trả lời (tùy chọn — bỏ trống nếu không có yêu cầu cụ thể)"
                                        size="small"
                                        value={clarifyAnswers[i] || ''}
                                    />
                                </Flexbox>
                            ))}
                            <Button
                                icon={<Search size={14} />}
                                onClick={startResearch}
                                type="primary"
                            >
                                Tiếp tục nghiên cứu →
                            </Button>
                        </>
                    )}
                </Flexbox>
            )}

            {/* ────── PHASE: RESEARCH ────── */}
            {(phase === 'research' || phase === 'outline' || phase === 'article' || phase === 'done') && (
                <Flexbox gap={8}>
                    <span style={{ fontWeight: 600 }}>🤖 AI Research Agents:</span>
                    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                        {agents.map((agent, idx) => (
                            <div
                                className={cx(
                                    styles.agentCard,
                                    agent.status === 'running' && styles.agentRunning,
                                    agent.status === 'done' && styles.agentDone,
                                    agent.status === 'error' && styles.agentError,
                                )}
                                key={agent.name}
                            >
                                <Flexbox align={'center'} gap={6} horizontal>
                                    <span>{AGENTS[idx].emoji}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{agent.name}</span>
                                    {agent.status === 'running' && <Loader2 className="animate-spin" size={12} />}
                                    {agent.status === 'done' && <Tag color="success" style={{ fontSize: 10 }}>✓</Tag>}
                                    {agent.status === 'error' && <Tag color="error" style={{ fontSize: 10 }}>✗</Tag>}
                                </Flexbox>
                                <span style={{ color: '#888', fontSize: 11 }}>{AGENTS[idx].desc}</span>
                            </div>
                        ))}
                    </div>
                </Flexbox>
            )}

            {/* ────── PROGRESS LOG ────── */}
            {progressLines.length > 0 && phase !== 'input' && (
                <Flexbox gap={2} style={{ maxHeight: 120, overflowY: 'auto' }}>
                    {progressLines.map((line, i) => (
                        <div className={styles.progressLine} key={i}>{line}</div>
                    ))}
                </Flexbox>
            )}

            {/* ────── PHASE: OUTLINE ────── */}
            {(phase === 'outline' || phase === 'done') && outline.length > 0 && (
                <Flexbox gap={8}>
                    <Flexbox align={'center'} gap={8} horizontal justify={'space-between'}>
                        <span style={{ fontWeight: 600 }}>📋 Dàn bài tổng quan:</span>
                        {phase === 'outline' && (
                            <Button
                                icon={<Play size={12} />}
                                onClick={handleGenerateArticle}
                                size="small"
                                type="primary"
                            >
                                Viết bài →
                            </Button>
                        )}
                    </Flexbox>
                    <div style={{ paddingLeft: 8 }}>
                        {outline.map((item, idx) => (
                            <div key={idx}>
                                <div
                                    className={styles.outlineItem}
                                    onClick={() => {
                                        const next = new Set(expandedSections);
                                        if (next.has(idx)) next.delete(idx);
                                        else next.add(idx);
                                        setExpandedSections(next);
                                    }}
                                    style={{ alignItems: 'center', display: 'flex', gap: 4 }}
                                >
                                    {item.children && item.children.length > 0 ? (
                                        expandedSections.has(idx) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                                    ) : (
                                        <span style={{ width: 14 }} />
                                    )}
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{item.title}</span>
                                </div>
                                {item.children && expandedSections.has(idx) && (
                                    <div style={{ paddingLeft: 28 }}>
                                        {item.children.map((child, ci) => (
                                            <div className={styles.outlineItem} key={ci} style={{ fontSize: 12 }}>
                                                {child.title}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Flexbox>
            )}

            {/* ────── PHASE: ARTICLE (loading) ────── */}
            {phase === 'article' && (
                <Flexbox align={'center'} gap={8} style={{ padding: 24 }}>
                    <Spin size="large" />
                    <span>✍️ Đang viết bài tổng quan...</span>
                </Flexbox>
            )}

            {/* ────── PHASE: DONE ────── */}
            {phase === 'done' && article && (
                <Flexbox gap={12}>
                    <Flexbox gap={8} horizontal style={{ flexWrap: 'wrap' }}>
                        <Dropdown
                            menu={{
                                items: [
                                    { key: 'md', label: '📄 Markdown (.md)', onClick: handleDownloadMd },
                                    { key: 'html', label: '🌐 HTML (.html)', onClick: handleDownloadHtml },
                                    { key: 'pdf', label: '🖨️ In / PDF', onClick: handlePrintPdf },
                                ],
                            }}
                        >
                            <Button icon={<Download size={14} />}>
                                Tải xuống ▾
                            </Button>
                        </Dropdown>
                        <Tooltip title="Sao chép Markdown vào clipboard">
                            <Button icon={<ClipboardCopy size={14} />} onClick={handleCopy}>
                                Sao chép
                            </Button>
                        </Tooltip>
                        <Button icon={<RefreshCw size={14} />} onClick={handleReset}>
                            Nghiên cứu mới
                        </Button>
                    </Flexbox>
                    <div className={styles.article}>
                        <Markdown>{article}</Markdown>
                    </div>
                </Flexbox>
            )}
        </Flexbox>
    );
});

DeepResearchBody.displayName = 'DeepResearchBody';
export default DeepResearchBody;
