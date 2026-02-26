/**
 * Phở Auto ✨ — Client-side Prompt Router
 *
 * Classifies user prompts by complexity and category, then selects the
 * optimal model from the user's available model list. This runs entirely
 * on the client side (zero latency overhead) and falls back gracefully
 * when quota is exhausted.
 *
 * Architecture:
 *   1. classifyPrompt()  — regex-based analysis of the raw prompt text
 *   2. pickBestModel()   — walks tiers from best-fit ↓, checks affinity
 *   3. resolveAutoModel() — orchestrates 1+2 for store integration
 */

import { getModelTier } from '@/config/pricing';

// ─── Constants ────────────────────────────────────────────────────────
export const PHO_AUTO_MODEL_ID = 'pho-auto';

// ─── Types ────────────────────────────────────────────────────────────
export type PromptComplexity = 'simple' | 'medium' | 'complex';
export type PromptCategory =
    | 'coding'
    | 'medical'
    | 'creative'
    | 'analysis'
    | 'translation'
    | 'general';

export interface PromptClassification {
    category: PromptCategory;
    complexity: PromptComplexity;
    hasAttachments: boolean;
    language: 'en' | 'other' | 'vi';
}

export interface AutoRouterResult {
    modelId: string;
    providerId: string;
    reason: string;
    /** Tier that was ultimately used (for UI badge) */
    resolvedTier: number;
}

interface AvailableModel {
    id: string;
    originProvider: string;
}

// ─── Vietnamese Unicode Detection ─────────────────────────────────────
const VIETNAMESE_REGEX =
    /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;

// ─── Keyword Dictionaries ─────────────────────────────────────────────
const COMPLEX_KEYWORDS = [
    // English
    'algorithm', 'architecture', 'benchmark', 'build', 'code', 'compile',
    'comprehensive', 'debug', 'deep dive', 'deploy', 'design pattern',
    'detailed analysis', 'differential diagnosis', 'implement',
    'machine learning', 'multi-step', 'optimize', 'refactor', 'research',
    'step by step', 'systematic',
    // Vietnamese
    'chẩn đoán', 'kiến trúc', 'lập trình', 'nghiên cứu', 'phân tích chi tiết',
    'phương pháp', 'thuật toán', 'tối ưu hóa', 'triển khai', 'xây dựng',
];

const MEDIUM_KEYWORDS = [
    // English
    'analyze', 'compare', 'create', 'describe', 'draft', 'explain',
    'how does', 'list', 'outline', 'plan', 'pros and cons', 'review',
    'summarize', 'why', 'write',
    // Vietnamese
    'giải thích', 'liệt kê', 'mô tả', 'phân tích', 'so sánh',
    'tạo', 'tóm tắt', 'viết',
];

const CATEGORY_KEYWORDS: Record<PromptCategory, string[]> = {
    analysis: [
        'analyze', 'benchmark', 'chart', 'compare', 'data', 'evaluate',
        'metrics', 'report', 'statistics', 'trend',
        'dữ liệu', 'đánh giá', 'phân tích', 'so sánh', 'thống kê',
    ],
    coding: [
        'api', 'bug', 'class', 'code', 'component', 'css', 'database',
        'debug', 'deploy', 'docker', 'error', 'function', 'git', 'html',
        'implement', 'javascript', 'json', 'node', 'python', 'react',
        'refactor', 'regex', 'rest', 'sql', 'test', 'typescript', 'variable',
        'lập trình', 'lỗi', 'mã nguồn', 'thuật toán', 'triển khai',
    ],
    creative: [
        'blog', 'brainstorm', 'creative', 'essay', 'fiction', 'novel',
        'poem', 'slogan', 'story', 'tagline', 'tone',
        'bài viết', 'sáng tác', 'sáng tạo', 'thơ', 'truyện', 'viết',
    ],
    general: [], // fallback — never matched by keywords
    medical: [
        'blood', 'clinical', 'diagnosis', 'disease', 'dosage', 'drug',
        'health', 'medical', 'medicine', 'patient', 'prescription',
        'side effect', 'symptom', 'therapy', 'treatment', 'vaccine',
        'bệnh', 'chẩn đoán', 'dược', 'liều', 'sức khỏe', 'thuốc',
        'triệu chứng', 'điều trị',
    ],
    translation: [
        'dịch', 'interpret', 'localize', 'translate', 'translation',
    ],
};

/**
 * Category → preferred model IDs per tier.
 *
 * The router tries from highest applicable tier downward. Within each tier
 * it picks the first model that is actually available in the user's list.
 *
 * NOTE: These include BOTH phochat shorthand IDs AND vercelaigateway full
 * IDs so matching works regardless of which provider the model comes from.
 */
const CATEGORY_AFFINITY: Record<PromptCategory, Record<number, string[]>> = {
    analysis: {
        1: ['google/gemini-2.0-flash', 'pho-fast', 'gemma-3-27b-it'],
        2: ['google/gemini-2.5-pro', 'openai/gpt-4o', 'pho-pro', 'anthropic/claude-sonnet-4-20250514'],
        3: ['google/gemini-3.1-pro-preview', 'anthropic/claude-opus-4-6', 'pho-smart'],
    },
    coding: {
        1: ['google/gemini-2.0-flash', 'mercury-coder-small-2-2', 'pho-fast'],
        2: ['anthropic/claude-sonnet-4-20250514', 'openai/gpt-4o', 'pho-pro', 'google/gemini-2.5-pro'],
        3: ['anthropic/claude-opus-4-6', 'google/gemini-3.1-pro-preview', 'pho-smart'],
    },
    creative: {
        1: ['google/gemini-2.0-flash', 'pho-fast'],
        2: ['anthropic/claude-sonnet-4-20250514', 'pho-pro', 'openai/gpt-4o'],
        3: ['anthropic/claude-opus-4-6', 'pho-smart'],
    },
    general: {
        1: ['google/gemini-2.0-flash', 'pho-fast', 'llama-3.3-70b-versatile'],
        2: ['openai/gpt-4o', 'pho-pro', 'google/gemini-2.5-flash'],
        3: ['pho-smart', 'google/gemini-3.1-pro-preview'],
    },
    medical: {
        1: ['google/gemini-2.0-flash', 'pho-fast'],
        2: ['openai/gpt-4o', 'google/gemini-2.5-pro', 'pho-pro'],
        3: ['google/gemini-3.1-pro-preview', 'anthropic/claude-opus-4-6', 'pho-smart'],
    },
    translation: {
        1: ['google/gemini-2.0-flash', 'pho-fast'],
        2: ['openai/gpt-4o', 'pho-pro', 'google/gemini-2.5-flash'],
        3: ['pho-smart', 'google/gemini-3.1-pro-preview'],
    },
};

// ─── Prompt Classification ────────────────────────────────────────────

/**
 * Classify a user prompt by complexity, category, and language.
 * Pure function — no side-effects, safe to call from anywhere.
 */
export function classifyPrompt(
    query: string,
    hasAttachments = false,
): PromptClassification {
    const lower = query.toLowerCase();

    // ── Language ──
    const language: PromptClassification['language'] = VIETNAMESE_REGEX.test(query) ? 'vi' : 'en';

    // ── Complexity ──
    let complexity: PromptComplexity = 'simple';
    const hasComplexKeyword = COMPLEX_KEYWORDS.some((kw) => lower.includes(kw));
    const hasMediumKeyword = MEDIUM_KEYWORDS.some((kw) => lower.includes(kw));

    if (hasComplexKeyword || query.length > 500 || hasAttachments) {
        complexity = 'complex';
    } else if (hasMediumKeyword || query.length > 150) {
        complexity = 'medium';
    }

    // ── Category (first match wins — order matters) ──
    let category: PromptCategory = 'general';
    const categoryOrder: PromptCategory[] = [
        'coding', 'medical', 'analysis', 'creative', 'translation',
    ];

    for (const cat of categoryOrder) {
        const keywords = CATEGORY_KEYWORDS[cat];
        if (keywords.some((kw) => lower.includes(kw))) {
            category = cat;
            break;
        }
    }

    return { category, complexity, hasAttachments, language };
}

// ─── Reason Builder (defined before pickBestModel to avoid use-before-define) ──

const CATEGORY_LABELS: Record<PromptCategory, string> = {
    analysis: 'phân tích dữ liệu',
    coding: 'lập trình',
    creative: 'sáng tạo nội dung',
    general: 'hội thoại',
    medical: 'y khoa',
    translation: 'dịch thuật',
};

const COMPLEXITY_LABELS: Record<PromptComplexity, string> = {
    complex: 'phức tạp',
    medium: 'trung bình',
    simple: 'đơn giản',
};

function buildReason(
    category: PromptCategory,
    complexity: PromptComplexity,
    _tier: number,
    modelId: string,
): string {
    const catLabel = CATEGORY_LABELS[category];
    const compLabel = COMPLEXITY_LABELS[complexity];
    const shortName = modelId
        .replaceAll(/^[^/]+\//g, '')       // strip provider prefix
        .replaceAll(/-\d{8,}$/g, '')       // strip date suffix
        .replaceAll(/[_-]/g, ' ')          // dashes/underscores → spaces
        .replaceAll(/\b\w/g, (c) => c.toUpperCase()); // capitalize words

    return `${shortName} — tối ưu cho ${catLabel} (${compLabel})`;
}

// ─── Model Selection ──────────────────────────────────────────────────

/**
 * Determine the ideal tier based on prompt complexity.
 */
function idealTierForComplexity(complexity: PromptComplexity): number {
    if (complexity === 'complex') { return 3; }
    if (complexity === 'medium') { return 2; }
    return 1;
}

/**
 * Pick the best model for a given classification from the available model
 * list. Walks from the ideal tier downward, trying affinity-preferred
 * models first, then any model in that tier.
 */
export function pickBestModel(
    classification: PromptClassification,
    availableModels: AvailableModel[],
): AutoRouterResult {
    const { category, complexity } = classification;
    const idealTier = idealTierForComplexity(complexity);
    const availableIds = new Set(availableModels.map((m) => m.id));
    const affinity = CATEGORY_AFFINITY[category] ?? CATEGORY_AFFINITY.general;

    // Walk tiers: idealTier → idealTier-1 → … → 1
    for (let tier = idealTier; tier >= 1; tier--) {
        const preferredIds = affinity[tier] ?? [];

        // Try affinity-preferred models first
        for (const modelId of preferredIds) {
            if (availableIds.has(modelId)) {
                const found = availableModels.find((m) => m.id === modelId)!;
                return {
                    modelId: found.id,
                    providerId: found.originProvider,
                    reason: buildReason(category, complexity, tier, found.id),
                    resolvedTier: tier,
                };
            }
        }

        // Fall back to ANY model in this tier that is available
        for (const model of availableModels) {
            const modelTier = getModelTier(model.id);
            if (modelTier === tier) {
                return {
                    modelId: model.id,
                    providerId: model.originProvider,
                    reason: buildReason(category, complexity, tier, model.id),
                    resolvedTier: tier,
                };
            }
        }
    }

    // Ultimate fallback: first available model
    const fallback = availableModels[0];
    if (fallback) {
        return {
            modelId: fallback.id,
            providerId: fallback.originProvider,
            reason: 'Sử dụng model mặc định',
            resolvedTier: getModelTier(fallback.id),
        };
    }

    // Should never happen — but safety net
    return {
        modelId: 'pho-fast',
        providerId: 'phochat',
        reason: 'Không tìm thấy model — sử dụng Phở Fast',
        resolvedTier: 1,
    };
}
