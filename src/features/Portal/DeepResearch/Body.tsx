'use client';

import { Button, Dropdown, Input, Select, Spin, Tag, Tooltip, message } from 'antd';
import { createStyles } from 'antd-style';
import {
    ArrowDown,
    ArrowUp,
    BookOpen,
    ChevronDown,
    ChevronRight,
    ClipboardCopy,
    Clock,
    Download,
    Eye,
    EyeOff,
    FileText,
    Loader2,
    MessageSquare,
    Pencil,
    Play,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    StopCircle,
    Trash2,
    X,
} from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { Markdown } from '@lobehub/ui';

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

interface HistoryItem {
    article: string;
    date: string;
    id: string;
    lang: string;
    model: string;
    question: string;
}

interface PubMedPaper {
    abstract: string;
    authors: string;
    journal: string;
    pmid: string;
    title: string;
    year: string;
}

interface CitationResult {
    citation: string;
    pmid?: string;
    status: 'verified' | 'unverified' | 'checking';
    title?: string;
}

const HISTORY_KEY = 'pho-deep-research-history';

const LANGUAGES = [
    { label: '🇺🇸 English', value: 'en' },
    { label: '🇻🇳 Tiếng Việt', value: 'vi' },
];

const TEMPLATES = [
    {
        cat: '❤️ Tim mạch', questions: [
            'Efficacy of SGLT2 inhibitors vs GLP-1 agonists for heart failure with preserved ejection fraction',
            'Direct oral anticoagulants vs warfarin in patients with atrial fibrillation and chronic kidney disease',
        ]
    },
    {
        cat: '🧠 Thần kinh', questions: [
            'Anti-amyloid monoclonal antibodies (lecanemab, donanemab) for early Alzheimer disease',
            'Tenecteplase vs alteplase for acute ischemic stroke thrombolysis',
        ]
    },
    {
        cat: '🩸 Ung bướu', questions: [
            'Immune checkpoint inhibitors combined with chemotherapy for first-line treatment of advanced NSCLC',
            'CAR-T cell therapy vs bispecific antibodies for relapsed/refractory DLBCL',
        ]
    },
    {
        cat: '🦠 Nhiễm', questions: [
            'Long-acting injectable cabotegravir/rilpivirine vs daily oral ART for HIV-1 maintenance',
            'Nirmatrelvir/ritonavir (Paxlovid) effectiveness in vaccinated patients with COVID-19',
        ]
    },
];

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
    cursor: pointer;
    &:hover { background: ${token.colorFillTertiary}; }
  `,
    agentContent: css`
    margin-top: 8px;
    padding: 8px;
    font-size: 12px;
    line-height: 1.6;
    max-height: 200px;
    overflow-y: auto;
    background: ${token.colorBgContainer};
    border-radius: ${token.borderRadius}px;
    border: 1px solid ${token.colorBorderSecondary};
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
    historyItem: css`
    padding: 8px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border-radius: ${token.borderRadius}px;
    cursor: pointer;
    font-size: 12px;
    &:hover { background: ${token.colorFillSecondary}; }
  `,
    historyLabel: css`
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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

async function callAIStream(
    model: string,
    prompt: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180_000); // 3 min for long articles

    // Forward external abort signal
    if (signal) {
        signal.addEventListener('abort', () => controller.abort());
    }

    try {
        const res = await fetch('/api/research/ai-summary', {
            body: JSON.stringify({ model, prompt, stream: true }),
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            signal: controller.signal,
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No stream body');
        const decoder = new TextDecoder();
        let fullContent = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data: ')) continue;
                const raw = trimmed.slice(6);
                if (raw === '[DONE]') continue;
                try {
                    const delta = JSON.parse(raw);
                    if (typeof delta === 'string') {
                        fullContent += delta;
                        onChunk(fullContent);
                    }
                } catch { /* skip unparseable */ }
            }
        }

        console.log('[DeepResearch] callAIStream complete:', { length: fullContent.length });
        return fullContent;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function searchPubMed(query: string, maxResults = 8): Promise<PubMedPaper[]> {
    try {
        const res = await fetch('/api/research/pubmed-search', {
            body: JSON.stringify({ maxResults, query }),
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            signal: AbortSignal.timeout(25_000),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.papers || [];
    } catch {
        console.warn('[DeepResearch] PubMed search failed, continuing without literature');
        return [];
    }
}

async function verifyCitationsAgainstPubMed(article: string): Promise<CitationResult[]> {
    // Extract citations in [Author, Year] format
    const citationRegex = /\[([A-Z][\sA-Za-zÀ-ỹ]+(?:et al\.?)?),?\s*(\d{4}[a-z]?)]/g;
    const found = new Map<string, string>();
    let match;
    while ((match = citationRegex.exec(article)) !== null) {
        const key = `${match[1].trim()}, ${match[2]}`;
        if (!found.has(key)) found.set(key, match[0]);
    }

    if (found.size === 0) return [];

    const results: CitationResult[] = [];
    // Verify each citation against PubMed
    for (const [key, raw] of found.entries()) {
        const [author, year] = key.split(', ');
        const searchQuery = `${author.replace(' et al.', '').replace(' et al', '')}[Author] AND ${year}[Date - Publication]`;
        try {
            const papers = await searchPubMed(searchQuery, 3);
            if (papers.length > 0) {
                results.push({ citation: raw, pmid: papers[0].pmid, status: 'verified', title: papers[0].title });
            } else {
                results.push({ citation: raw, status: 'unverified' });
            }
        } catch {
            results.push({ citation: raw, status: 'unverified' });
        }
    }
    return results;
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
    const [outputLang, setOutputLang] = useState('en');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [expandedAgent, setExpandedAgent] = useState<number | null>(null);
    const [editingOutlineIdx, setEditingOutlineIdx] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');
    const [refinePrompt, setRefinePrompt] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [pubmedPapers, setPubmedPapers] = useState<PubMedPaper[]>([]);
    const [citationResults, setCitationResults] = useState<CitationResult[]>([]);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showAllPapers, setShowAllPapers] = useState(false);
    const [showPrisma, setShowPrisma] = useState(false);
    const abortRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const startResearchRef = useRef<(() => void) | undefined>(undefined);

    // Elapsed timer
    useEffect(() => {
        if (!startTime) { setElapsed(0); return; }
        const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) setHistory(JSON.parse(saved));
        } catch { /* ignore */ }
    }, []);

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
        setStartTime(Date.now());
        setPubmedPapers([]);
        setCitationResults([]);

        // ── PubMed Literature Search ──
        setProgressLines((prev) => [...prev, '🔍 Đang tìm y văn trên PubMed...']);
        const papers = await searchPubMed(question, 10);
        setPubmedPapers(papers);
        if (papers.length > 0) {
            setProgressLines((prev) => [...prev, `📚 Tìm thấy ${papers.length} bài báo trên PubMed`]);
        } else {
            setProgressLines((prev) => [...prev, '⚠️ Không tìm thấy bài báo PubMed, agents sẽ nghiên cứu từ kiến thức chung']);
        }
        if (abortRef.current) return;

        // Build literature context from PubMed papers (limit size to avoid timeout)
        const litContext = papers.length > 0
            ? `\n\n=== RETRIEVED LITERATURE FROM PUBMED ===\n${papers.slice(0, 6).map((p, i) => `[${i + 1}] ${p.authors} (${p.year}). ${p.title}. ${p.journal}. PMID: ${p.pmid}\nAbstract: ${p.abstract.slice(0, 400)}`).join('\n\n')}\n=== END LITERATURE ===`
            : '';

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

Clinical Question: "${question}"${clarifyContext}${litContext}

IMPORTANT: When citing studies, use ONLY real papers from the provided PubMed literature above. Use the format [Author, Year] and include the PMID when possible. Do NOT fabricate or hallucinate citations.

Provide a thorough analysis from your perspective. Use markdown formatting with headers, bullet points, and bold for key findings. Include specific data points (percentages, confidence intervals, p-values) where relevant.`,
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

    /* ── Phase 4 → Article (streaming) ── */
    const handleGenerateArticle = useCallback(async () => {
        setPhase('article');
        setArticle('');
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
9. Write the entire article in ${outputLang === 'vi' ? 'Vietnamese (Tiếng Việt)' : 'English'}

Write the full article now in markdown format.`;

            // Stream article in real-time
            setPhase('done'); // Show article panel immediately with streaming content
            const result = await callAIStream(model, prompt, (streamedText) => {
                setArticle(streamedText);
            });

            const footer = `\n\n---\n\n*📚 Generated by Phở Chat Deep Research Mode*\n*${new Date().toLocaleDateString('vi-VN')}*`;
            const finalArticle = result + footer;
            setArticle(finalArticle);
            setProgressLines((prev) => [...prev, '✅ Bài tổng quan hoàn thành!']);
            setStartTime(null);

            // Save to history
            const historyItem: HistoryItem = {
                article: finalArticle,
                date: new Date().toISOString(),
                id: `dr-${Date.now()}`,
                lang: outputLang,
                model,
                question,
            };
            setHistory((prev) => {
                const updated = [historyItem, ...prev].slice(0, 20);
                try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
                return updated;
            });

            // Auto-verify citations against PubMed
            setIsVerifying(true);
            setProgressLines((prev) => [...prev, '🔍 Đang xác minh citations trên PubMed...']);
            try {
                const verifyResults = await verifyCitationsAgainstPubMed(finalArticle);
                setCitationResults(verifyResults);
                const verified = verifyResults.filter(r => r.status === 'verified').length;
                setProgressLines((prev) => [...prev, `✅ Xác minh xong: ${verified}/${verifyResults.length} citations tìm thấy trên PubMed`]);
            } catch {
                setProgressLines((prev) => [...prev, '⚠️ Không thể xác minh citations']);
            }
            setIsVerifying(false);
        } catch (e: any) {
            message.error(`Article generation error: ${e.message}`);
            setPhase('outline');
        }
    }, [question, model, outline, agents, outputLang]);

    /* \u2500\u2500 Reset \u2500\u2500 */
    const handleReset = () => {
        abortRef.current = true;
        abortControllerRef.current?.abort();
        setPhase('input');
        setQuestion('');
        setClarifyQs([]);
        setClarifyAnswers({});
        setAgents(AGENTS.map((a) => ({ content: '', name: a.name, status: 'idle' })));
        setProgressLines([]);
        setOutline([]);
        setArticle('');
        setExpandedAgent(null);
        setStartTime(null);
        setPubmedPapers([]);
        setCitationResults([]);
        setIsVerifying(false);
    };

    /* \u2500\u2500 Stop \u2500\u2500 */
    const handleStop = () => {
        abortRef.current = true;
        abortControllerRef.current?.abort();
        setStartTime(null);
        setProgressLines((prev) => [...prev, '⛔ Người dùng đã dừng nghiên cứu']);
        message.info('Đã dừng nghiên cứu');
    };

    /* \u2500\u2500 History \u2500\u2500 */
    const handleLoadHistory = (item: HistoryItem) => {
        setQuestion(item.question);
        setModel(item.model);
        setOutputLang(item.lang);
        setArticle(item.article);
        setPhase('done');
        setShowHistory(false);
        setProgressLines(['\uD83D\uDCE5 T\u1EA3i t\u1EEB l\u1ECBch s\u1EED nghi\u00EAn c\u1EE9u']);
    };

    const handleDeleteHistory = (id: string) => {
        setHistory((prev) => {
            const updated = prev.filter((h) => h.id !== id);
            try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
            return updated;
        });
    };

    /* ── Outline editing ── */
    const handleAddOutlineItem = () => {
        setOutline((prev) => [...prev, { title: `${prev.length + 1}. New Section` }]);
    };

    const handleDeleteOutlineItem = (idx: number) => {
        setOutline((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleMoveOutlineItem = (idx: number, direction: 'up' | 'down') => {
        setOutline((prev) => {
            const next = [...prev];
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (targetIdx < 0 || targetIdx >= next.length) return prev;
            [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
            return next;
        });
    };

    const handleSaveOutlineEdit = (idx: number) => {
        setOutline((prev) => prev.map((item, i) => i === idx ? { ...item, title: editingText } : item));
        setEditingOutlineIdx(null);
        setEditingText('');
    };

    /* ── Follow-up refinement ── */
    const handleRefine = useCallback(async () => {
        if (!refinePrompt.trim() || isRefining) return;
        setIsRefining(true);
        setProgressLines((prev) => [...prev, `🔄 Đang tinh chỉnh: "${refinePrompt.slice(0, 50)}..."`]);

        try {
            const prompt = `You are an expert medical academic writer. Below is an existing literature review article. The user wants you to refine/modify it based on their instruction.

Current Article:
${article.slice(0, 20_000)}

User Instruction: "${refinePrompt}"

Instructions:
1. Apply the user's requested change to the article
2. Keep the overall structure and formatting intact
3. Only modify the relevant sections
4. Maintain academic medical writing style
5. Write in ${outputLang === 'vi' ? 'Vietnamese (Tiếng Việt)' : 'English'}

Return the full updated article in markdown format.`;

            const result = await callAI(model, prompt);
            const footer = `\n\n---\n\n*📚 Generated by Phở Chat Deep Research Mode*\n*${new Date().toLocaleDateString('vi-VN')} — Refined*`;
            setArticle(result + footer);
            setRefinePrompt('');
            setProgressLines((prev) => [...prev, '✅ Đã tinh chỉnh bài viết']);
            message.success('Đã tinh chỉnh bài viết thành công');
        } catch (e: any) {
            message.error(`Lỗi tinh chỉnh: ${e.message}`);
        } finally {
            setIsRefining(false);
        }
    }, [refinePrompt, isRefining, article, model, outputLang]);

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

    /* ── BibTeX Export ── */
    const handleExportBibtex = () => {
        if (pubmedPapers.length === 0 && citationResults.length === 0) {
            message.warning('Chưa có references để export');
            return;
        }
        const entries = pubmedPapers.map((p, i) => {
            const key = `${p.authors.split(' ')[0] || 'Unknown'}${p.year}_${i + 1}`;
            return `@article{${key},
  author = {${p.authors}},
  title = {${p.title}},
  journal = {${p.journal}},
  year = {${p.year}},
  pmid = {${p.pmid}},
  url = {https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/}
}`;
        });
        downloadFile(entries.join('\n\n'), `deep-research-refs-${Date.now()}.bib`, 'application/x-bibtex');
        message.success(`Đã export ${entries.length} references (BibTeX)`);
    };

    const handleExportRis = () => {
        if (pubmedPapers.length === 0) {
            message.warning('Chưa có references để export');
            return;
        }
        const entries = pubmedPapers.map((p) => {
            return `TY  - JOUR
AU  - ${p.authors}
TI  - ${p.title}
JO  - ${p.journal}
PY  - ${p.year}
AN  - ${p.pmid}
UR  - https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/
ER  - `;
        });
        downloadFile(entries.join('\n\n'), `deep-research-refs-${Date.now()}.ris`, 'application/x-research-info-systems');
        message.success(`Đã export ${entries.length} references (RIS)`);
    };

    /* ── PRISMA Flowchart ── */
    const generatePrismaData = useCallback(() => {
        const totalIdentified = pubmedPapers.length;
        const verifiedCount = citationResults.filter(r => r.status === 'verified').length;
        const unverifiedCount = citationResults.filter(r => r.status === 'unverified').length;
        const totalCitations = citationResults.length;
        const agentsDone = agents.filter(a => a.status === 'done').length;
        const outlineSections = outline.length;

        return {
            agentsDone,
            mermaid: `graph TD
    A["Records identified<br/>PubMed search: ${totalIdentified} papers"] --> B["Records screened<br/>by ${agentsDone} AI agents"]
    B --> C["Citations extracted<br/>${totalCitations} unique citations"]
    C --> D["Citations verified<br/>${verifiedCount} found on PubMed"]
    C --> E["Citations unverified<br/>${unverifiedCount} not found"]
    D --> F["Studies included<br/>in final review"]
    F --> G["Article synthesized<br/>${outlineSections} sections"]`,
            outlineSections,
            totalCitations,
            totalIdentified,
            unverifiedCount,
            verifiedCount,
        };
    }, [pubmedPapers, citationResults, agents, outline]);

    /* ── Render ── */
    return (
        <Flexbox className={styles.container} gap={16}>
            {/* Title */}
            <Flexbox align={'center'} gap={8} horizontal>
                <BookOpen size={22} />
                <span className={styles.header}>Deep Research</span>
            </Flexbox>
            <span className={styles.subtitle}>
                Tạo bài tổng quan y văn tự động với citations
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
                    <Flexbox gap={8} horizontal style={{ flexWrap: 'wrap' }}>
                        <Select
                            onChange={setModel}
                            options={MODELS}
                            style={{ width: 200 }}
                            value={model}
                        />
                        <Select
                            onChange={setOutputLang}
                            options={LANGUAGES}
                            style={{ width: 140 }}
                            value={outputLang}
                        />
                        <Button
                            disabled={!question.trim()}
                            icon={<Sparkles size={14} />}
                            onClick={handleStart}
                            type="primary"
                        >
                            {'🚀 Bắt đầu nghiên cứu'}
                        </Button>
                        <Tooltip title={showHistory ? '\u1EA8n l\u1ECBch s\u1EED' : 'L\u1ECBch s\u1EED nghi\u00EAn c\u1EE9u'}>
                            <Button
                                icon={<Clock size={14} />}
                                onClick={() => setShowHistory(!showHistory)}
                                type={showHistory ? 'primary' : 'default'}
                            />
                        </Tooltip>
                    </Flexbox>

                    {/* History panel */}
                    {showHistory && (
                        <Flexbox gap={4} style={{ maxHeight: 200, overflowY: 'auto' }}>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{'📋 Lịch sử nghiên cứu'} ({history.length}):</span>
                            {history.length === 0 ? (
                                <span style={{ color: '#888', fontSize: 12 }}>Chưa có nghiên cứu nào</span>
                            ) : (
                                history.map((item) => (
                                    <div className={styles.historyItem} key={item.id}>
                                        <span
                                            className={styles.historyLabel}
                                            onClick={() => handleLoadHistory(item)}
                                        >
                                            {item.question.slice(0, 60)}{item.question.length > 60 ? '...' : ''}
                                        </span>
                                        <Tag style={{ fontSize: 10 }}>{new Date(item.date).toLocaleDateString('vi-VN')}</Tag>
                                        <Tooltip title="X\u00F3a">
                                            <Button
                                                danger
                                                icon={<Trash2 size={10} />}
                                                onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item.id); }}
                                                size="small"
                                                type="text"
                                            />
                                        </Tooltip>
                                    </div>
                                ))
                            )}
                        </Flexbox>
                    )}

                    {/* Templates panel */}
                    {!showHistory && (
                        <Flexbox gap={4}>
                            <Button
                                icon={<Search size={12} />}
                                onClick={() => setShowTemplates(!showTemplates)}
                                size="small"
                                type="link"
                            >
                                {showTemplates ? 'Ẩn mẫu' : '📚 Câu hỏi mẫu theo chuyên khoa'}
                            </Button>
                            {showTemplates && (
                                <Flexbox gap={6}>
                                    {TEMPLATES.map((cat) => (
                                        <div key={cat.cat}>
                                            <span style={{ fontSize: 11, fontWeight: 600 }}>{cat.cat}</span>
                                            {cat.questions.map((q) => (
                                                <div
                                                    key={q}
                                                    onClick={() => { setQuestion(q); setShowTemplates(false); }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                                    style={{ borderRadius: 4, cursor: 'pointer', fontSize: 11, padding: '2px 8px' }}
                                                >
                                                    {q.slice(0, 80)}{q.length > 80 ? '...' : ''}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </Flexbox>
                            )}
                        </Flexbox>
                    )}
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

            {/* ────── PHASE: RESEARCH + AGENTS ────── */}
            {(phase === 'research' || phase === 'outline' || phase === 'article' || phase === 'done') && (
                <Flexbox gap={8}>
                    <Flexbox align={'center'} gap={8} horizontal justify={'space-between'}>
                        <Flexbox align={'center'} gap={8} horizontal>
                            <span style={{ fontWeight: 600 }}>{'🤖 AI Research Agents:'}</span>
                            {phase === 'research' && (
                                <Tag color="processing" style={{ fontSize: 11 }}>
                                    ⏱️ {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} — {agents.filter(a => a.status === 'done').length}/{agents.length} xong
                                </Tag>
                            )}
                        </Flexbox>
                        {phase === 'research' && (
                            <Button danger icon={<StopCircle size={14} />} onClick={handleStop} size="small">
                                Dừng
                            </Button>
                        )}
                    </Flexbox>
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
                                onClick={() => setExpandedAgent(expandedAgent === idx ? null : idx)}
                            >
                                <Flexbox align={'center'} gap={6} horizontal>
                                    <span>{AGENTS[idx].emoji}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600 }}>{agent.name}</span>
                                    {agent.status === 'running' && <Loader2 className="animate-spin" size={12} />}
                                    {agent.status === 'done' && <Tag color="success" style={{ fontSize: 10 }}>\u2713</Tag>}
                                    {agent.status === 'error' && <Tag color="error" style={{ fontSize: 10 }}>\u2717</Tag>}
                                    {agent.status === 'done' && (
                                        <Tooltip title={expandedAgent === idx ? '\u1EA8n chi ti\u1EBFt' : 'Xem chi ti\u1EBFt'}>
                                            {expandedAgent === idx ? <EyeOff size={12} /> : <Eye size={12} />}
                                        </Tooltip>
                                    )}
                                </Flexbox>
                                <span style={{ color: '#888', fontSize: 11 }}>{AGENTS[idx].desc}</span>
                                {expandedAgent === idx && agent.content && (
                                    <div className={styles.agentContent}>
                                        <Markdown>{agent.content.slice(0, 3000)}</Markdown>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </Flexbox>
            )}

            {/* PubMed Papers */}
            {pubmedPapers.length > 0 && (phase === 'research' || phase === 'outline' || phase === 'article' || phase === 'done') && (
                <Flexbox gap={6} style={{ background: 'rgba(0,150,255,0.05)', borderRadius: 8, padding: '8px 12px' }}>
                    <Flexbox align={'center'} gap={6} horizontal>
                        <BookOpen size={14} />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>Y văn PubMed ({pubmedPapers.length} bài báo)</span>
                    </Flexbox>
                    <div style={{ display: 'grid', gap: 4 }}>
                        {(showAllPapers ? pubmedPapers : pubmedPapers.slice(0, 6)).map((p) => (
                            <a
                                href={`https://pubmed.ncbi.nlm.nih.gov/${p.pmid}/`}
                                key={p.pmid}
                                rel="noreferrer"
                                style={{ color: '#1890ff', cursor: 'pointer', fontSize: 11, textDecoration: 'none' }}
                                target="_blank"
                            >
                                <span style={{ fontWeight: 500 }}>{p.authors} ({p.year}).</span> {p.title.slice(0, 100)}{p.title.length > 100 ? '...' : ''} <Tag style={{ fontSize: 9 }}>{p.journal.slice(0, 30)}</Tag>
                            </a>
                        ))}
                        {pubmedPapers.length > 6 && (
                            <span
                                onClick={() => setShowAllPapers(!showAllPapers)}
                                style={{ color: '#1890ff', cursor: 'pointer', fontSize: 11, fontWeight: 500 }}
                            >
                                {showAllPapers ? '▲ Thu gọn' : `▼ Xem thêm ${pubmedPapers.length - 6} bài báo khác`}
                            </span>
                        )}
                    </div>
                </Flexbox>
            )}

            {/* Progress Log */}
            {progressLines.length > 0 && phase !== 'input' && (
                <Flexbox gap={2} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, maxHeight: 200, overflowY: 'auto', padding: '8px 12px' }}>
                    <span style={{ color: '#aaa', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>Quá trình nghiên cứu:</span>
                    {progressLines.map((line, i) => (
                        <div className={styles.progressLine} key={i} style={{ fontSize: 12, lineHeight: 1.5 }}>{line}</div>
                    ))}
                </Flexbox>
            )}

            {/* ────── PHASE: OUTLINE ────── */}
            {(phase === 'outline' || phase === 'done') && outline.length > 0 && (
                <Flexbox gap={8}>
                    <Flexbox align={'center'} gap={8} horizontal justify={'space-between'}>
                        <span style={{ fontWeight: 600 }}>📋 Dàn bài tổng quan:</span>
                        <Flexbox gap={4} horizontal>
                            {phase === 'outline' && (
                                <>
                                    <Tooltip title="Thêm mục">
                                        <Button icon={<Plus size={12} />} onClick={handleAddOutlineItem} size="small" />
                                    </Tooltip>
                                    <Button
                                        icon={<Play size={12} />}
                                        onClick={handleGenerateArticle}
                                        size="small"
                                        type="primary"
                                    >
                                        Viết bài →
                                    </Button>
                                </>
                            )}
                        </Flexbox>
                    </Flexbox>
                    <div style={{ paddingLeft: 8 }}>
                        {outline.map((item, idx) => (
                            <div key={idx}>
                                <div
                                    className={styles.outlineItem}
                                    style={{ alignItems: 'center', display: 'flex', gap: 4 }}
                                >
                                    {item.children && item.children.length > 0 ? (
                                        expandedSections.has(idx) ? (
                                            <ChevronDown onClick={() => { const next = new Set(expandedSections); next.delete(idx); setExpandedSections(next); }} size={14} style={{ cursor: 'pointer' }} />
                                        ) : (
                                            <ChevronRight onClick={() => { const next = new Set(expandedSections); next.add(idx); setExpandedSections(next); }} size={14} style={{ cursor: 'pointer' }} />
                                        )
                                    ) : (
                                        <span style={{ width: 14 }} />
                                    )}
                                    {editingOutlineIdx === idx ? (
                                        <Flexbox gap={4} horizontal style={{ flex: 1 }}>
                                            <Input
                                                onChange={(e) => setEditingText(e.target.value)}
                                                onPressEnter={() => handleSaveOutlineEdit(idx)}
                                                size="small"
                                                value={editingText}
                                            />
                                            <Button onClick={() => handleSaveOutlineEdit(idx)} size="small" type="primary">✓</Button>
                                            <Button onClick={() => { setEditingOutlineIdx(null); setEditingText(''); }} size="small"><X size={10} /></Button>
                                        </Flexbox>
                                    ) : (
                                        <>
                                            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{item.title}</span>
                                            {phase === 'outline' && (
                                                <Flexbox gap={2} horizontal>
                                                    <Tooltip title="Sửa"><Button icon={<Pencil size={10} />} onClick={() => { setEditingOutlineIdx(idx); setEditingText(item.title); }} size="small" type="text" /></Tooltip>
                                                    <Tooltip title="Lên"><Button disabled={idx === 0} icon={<ArrowUp size={10} />} onClick={() => handleMoveOutlineItem(idx, 'up')} size="small" type="text" /></Tooltip>
                                                    <Tooltip title="Xuống"><Button disabled={idx === outline.length - 1} icon={<ArrowDown size={10} />} onClick={() => handleMoveOutlineItem(idx, 'down')} size="small" type="text" /></Tooltip>
                                                    <Tooltip title="Xóa"><Button danger icon={<Trash2 size={10} />} onClick={() => handleDeleteOutlineItem(idx)} size="small" type="text" /></Tooltip>
                                                </Flexbox>
                                            )}
                                        </>
                                    )}
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
                                    { type: 'divider' as const },
                                    { key: 'bib', label: '📚 BibTeX (.bib) - Zotero/Mendeley', onClick: handleExportBibtex },
                                    { key: 'ris', label: '📚 RIS (.ris) - EndNote', onClick: handleExportRis },
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
                        {pubmedPapers.length > 0 && (
                            <Button
                                icon={<FileText size={14} />}
                                onClick={() => setShowPrisma(!showPrisma)}
                                type={showPrisma ? 'primary' : 'default'}
                            >
                                PRISMA Flow
                            </Button>
                        )}
                    </Flexbox>

                    {/* PRISMA Flowchart */}
                    {showPrisma && (
                        <Flexbox gap={8} style={{ background: 'rgba(100,102,241,0.06)', border: '1px solid rgba(100,102,241,0.15)', borderRadius: 10, padding: '12px 16px' }}>
                            <Flexbox align={'center'} gap={6} horizontal>
                                <FileText size={14} />
                                <span style={{ fontSize: 14, fontWeight: 700 }}>PRISMA Flow Diagram</span>
                                <Tag color="purple" style={{ fontSize: 10 }}>Systematic Review</Tag>
                            </Flexbox>
                            {(() => {
                                const pd = generatePrismaData();
                                return (
                                    <div style={{ display: 'grid', gap: 6 }}>
                                        {/* Visual flowchart as styled boxes */}
                                        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ background: '#4f46e5', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, padding: '8px 16px', textAlign: 'center', width: '80%' }}>
                                                Records identified: {pd.totalIdentified} papers (PubMed)
                                            </div>
                                            <span style={{ color: '#666', fontSize: 16 }}>▼</span>
                                            <div style={{ background: '#7c3aed', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, padding: '8px 16px', textAlign: 'center', width: '80%' }}>
                                                Screened by {pd.agentsDone} AI Research Agents
                                            </div>
                                            <span style={{ color: '#666', fontSize: 16 }}>▼</span>
                                            <div style={{ background: '#2563eb', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, padding: '8px 16px', textAlign: 'center', width: '80%' }}>
                                                Citations extracted: {pd.totalCitations} unique citations
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', width: '80%' }}>
                                                <div style={{ background: '#16a34a', borderRadius: 8, color: 'white', flex: 1, fontSize: 11, fontWeight: 600, padding: '6px 12px', textAlign: 'center' }}>
                                                    ✅ Verified: {pd.verifiedCount}
                                                </div>
                                                <div style={{ background: '#d97706', borderRadius: 8, color: 'white', flex: 1, fontSize: 11, fontWeight: 600, padding: '6px 12px', textAlign: 'center' }}>
                                                    ⚠️ Unverified: {pd.unverifiedCount}
                                                </div>
                                            </div>
                                            <span style={{ color: '#666', fontSize: 16 }}>▼</span>
                                            <div style={{ background: '#059669', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, padding: '8px 16px', textAlign: 'center', width: '80%' }}>
                                                Article synthesized: {pd.outlineSections} sections
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </Flexbox>
                    )}

                    {/* Citation Verification */}
                    {(citationResults.length > 0 || isVerifying) && (
                        <Flexbox gap={6} style={{ background: 'rgba(0,0,0,0.02)', borderRadius: 8, padding: '8px 12px' }}>
                            <Flexbox align={'center'} gap={8} horizontal>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>Xác minh Citations</span>
                                {isVerifying ? (
                                    <Tag color="processing" icon={<Loader2 className="animate-spin" size={10} />}>
                                        Đang kiểm tra...
                                    </Tag>
                                ) : citationResults.length > 0 ? (
                                    <Tag color={citationResults.filter(r => r.status === 'verified').length / citationResults.length > 0.5 ? 'success' : 'warning'}>
                                        {citationResults.filter(r => r.status === 'verified').length}/{citationResults.length} tìm thấy trên PubMed ({Math.round(citationResults.filter(r => r.status === 'verified').length / citationResults.length * 100)}%)
                                    </Tag>
                                ) : null}
                            </Flexbox>
                            {citationResults.length > 0 && (
                                <div style={{ display: 'grid', gap: 3 }}>
                                    {citationResults.map((cr, i) => (
                                        <Flexbox align={'center'} gap={6} horizontal key={i} style={{ fontSize: 11 }}>
                                            <Tag color={cr.status === 'verified' ? 'success' : 'warning'} style={{ fontSize: 10 }}>
                                                {cr.status === 'verified' ? 'V' : '?'}
                                            </Tag>
                                            <span style={{ fontWeight: 500 }}>{cr.citation}</span>
                                            {cr.status === 'verified' && cr.pmid && (
                                                <a
                                                    href={`https://pubmed.ncbi.nlm.nih.gov/${cr.pmid}/`}
                                                    rel="noreferrer"
                                                    style={{ color: '#1890ff', fontSize: 10 }}
                                                    target="_blank"
                                                >
                                                    PMID: {cr.pmid}
                                                </a>
                                            )}
                                            {cr.status === 'unverified' && (
                                                <span style={{ color: '#999', fontSize: 10 }}>Không tìm thấy trên PubMed</span>
                                            )}
                                        </Flexbox>
                                    ))}
                                </div>
                            )}
                        </Flexbox>
                    )}

                    {/* Follow-up refinement */}
                    <Flexbox gap={4}>
                        <Flexbox gap={8} horizontal>
                            <Input
                                disabled={isRefining}
                                onChange={(e) => setRefinePrompt(e.target.value)}
                                onPressEnter={handleRefine}
                                placeholder="Tinh chỉnh: 'Mở rộng phần Discussion', 'Thêm so sánh với X'..."
                                prefix={<MessageSquare size={14} />}
                                style={{ flex: 1 }}
                                value={refinePrompt}
                            />
                            <Button
                                disabled={!refinePrompt.trim() || isRefining}
                                icon={isRefining ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                loading={isRefining}
                                onClick={handleRefine}
                                type="primary"
                            >
                                Tinh chỉnh
                            </Button>
                        </Flexbox>
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
