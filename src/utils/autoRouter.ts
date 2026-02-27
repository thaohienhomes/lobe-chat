/**
 * Phở Auto ✨ — Client-side Prompt Router (Phase 2)
 *
 * Classifies user prompts by complexity and category, then selects the
 * optimal model from the user's available model list. This runs entirely
 * on the client side (zero latency overhead) and falls back gracefully
 * when quota is exhausted.
 *
 * Phase 2 improvements:
 *   - Multi-category scoring (replaces first-match-wins)
 *   - New `math` category for reasoning-heavy prompts
 *   - Short-prompt heuristic (< 20 chars → simple)
 *   - resolveAutoModel() helper to DRY up store integrations
 */

import PhoChatConfig from '@/config/modelProviders/phochat';
import { getModelTier } from '@/config/pricing';
import VercelAIGatewayConfig from '@/config/modelProviders/vercelaigateway';
import type { ModelProviderCard } from '@/types/llm';

// ─── Constants ────────────────────────────────────────────────────────
export const PHO_AUTO_MODEL_ID = 'pho-auto';

// ─── Types ────────────────────────────────────────────────────────────
export type PromptComplexity = 'simple' | 'medium' | 'complex';
export type PromptCategory =
    | 'coding'
    | 'math'
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
    'algorithm', 'architecture', 'benchmark', 'build', 'code review',
    'compile', 'comprehensive', 'debug', 'deep dive', 'deploy',
    'design pattern', 'detailed analysis', 'differential diagnosis',
    'implement', 'machine learning', 'multi-step', 'optimize',
    'refactor', 'research', 'step by step', 'systematic',
    // Vietnamese
    'chẩn đoán', 'kiến trúc', 'lập trình', 'nghiên cứu',
    'phân tích chi tiết', 'phương pháp', 'thuật toán', 'tối ưu hóa',
    'triển khai', 'xây dựng',
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
        'graph', 'insight', 'metrics', 'report', 'statistics', 'trend',
        'visualization',
        'biểu đồ', 'dữ liệu', 'đánh giá', 'phân tích', 'so sánh',
        'thống kê',
    ],
    coding: [
        'api', 'bug', 'class', 'code', 'component', 'config', 'css',
        'database', 'debug', 'deploy', 'docker', 'error', 'function',
        'git', 'html', 'implement', 'javascript', 'json', 'kubernetes',
        'node', 'npm', 'python', 'react', 'refactor', 'regex', 'rest',
        'sql', 'test', 'typescript', 'variable', 'webpack',
        'lập trình', 'lỗi', 'mã nguồn', 'thuật toán', 'triển khai',
    ],
    creative: [
        'blog', 'brainstorm', 'creative', 'essay', 'fiction', 'novel',
        'poem', 'script', 'slogan', 'song', 'story', 'tagline', 'tone',
        'bài viết', 'sáng tác', 'sáng tạo', 'thơ', 'truyện', 'viết',
    ],
    general: [], // fallback — never matched by keywords
    math: [
        'algebra', 'calculus', 'calculate', 'derivative', 'equation',
        'formula', 'geometry', 'integral', 'logarithm', 'matrix',
        'mathematical', 'probability', 'proof', 'solve', 'theorem',
        'trigonometry',
        'bất phương trình', 'công thức', 'giải', 'hình học',
        'phương trình', 'tích phân', 'tính', 'tính toán', 'toán',
        'xác suất', 'đạo hàm',
    ],
    medical: [
        'blood', 'clinical', 'diagnosis', 'disease', 'dosage', 'drug',
        'health', 'interactions', 'medical', 'medicine', 'patient',
        'pharmacology', 'prescription', 'side effect', 'symptom',
        'therapy', 'treatment', 'vaccine',
        'bệnh', 'chẩn đoán', 'dược', 'liều', 'sức khỏe', 'thuốc',
        'triệu chứng', 'tương tác thuốc', 'điều trị',
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
    math: {
        1: ['google/gemini-2.0-flash', 'pho-fast'],
        2: ['google/gemini-2.5-pro', 'openai/gpt-4o', 'pho-pro'],
        3: ['google/gemini-3.1-pro-preview', 'anthropic/claude-opus-4-6', 'pho-smart'],
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
 * Phase 2: uses **score-based** multi-category matching instead of first-match.
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

    // Phase 2: Short-prompt heuristic — very short + no keywords → force simple
    if (query.length < 20 && !hasComplexKeyword && !hasMediumKeyword) {
        complexity = 'simple';
    }

    // ── Category (Phase 2: score-based multi-category matching) ──
    const scoredCategories: PromptCategory[] = [
        'coding', 'math', 'medical', 'analysis', 'creative', 'translation',
    ];

    let bestCategory: PromptCategory = 'general';
    let bestScore = 0;

    for (const cat of scoredCategories) {
        const keywords = CATEGORY_KEYWORDS[cat];
        let score = 0;
        for (const kw of keywords) {
            if (lower.includes(kw)) {
                score += 1;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestCategory = cat;
        }
    }

    return { category: bestCategory, complexity, hasAttachments, language };
}

// ─── Reason Builder ───────────────────────────────────────────────────

const CATEGORY_LABELS: Record<PromptCategory, string> = {
    analysis: 'phân tích dữ liệu',
    coding: 'lập trình',
    creative: 'sáng tạo nội dung',
    general: 'hội thoại',
    math: 'toán học & suy luận',
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

// ─── resolveAutoModel (Phase 2 — DRY helper) ──────────────────────────

/**
 * All-in-one resolver: builds available model list, classifies prompt,
 * picks the best model, and logs the decision.
 *
 * Call from any store integration point with just the user message text.
 */
export function resolveAutoModel(
    message: string,
    hasFiles = false,
    logPrefix = 'Phở Auto',
): AutoRouterResult {
    const classification = classifyPrompt(message, hasFiles);

    const availableModels: AvailableModel[] = [
        ...(PhoChatConfig.chatModels || [])
            .filter((m) => m.enabled !== false)
            .map((m) => ({ id: m.id, originProvider: 'phochat' })),
        ...((VercelAIGatewayConfig as ModelProviderCard).chatModels || [])
            .filter((m) => m.enabled !== false)
            .map((m) => ({ id: m.id, originProvider: 'vercelaigateway' })),
    ];

    const result = pickBestModel(classification, availableModels);

    console.log(
        `✨ ${logPrefix}: "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}" → ${result.modelId} [${classification.category}/${classification.complexity}] (${result.reason})`,
    );

    return result;
}
