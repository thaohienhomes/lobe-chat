/* eslint-disable sort-keys-fix/sort-keys-fix */
/**
 * Shared Model Catalog — Single source of truth for all AI models available on Phở Chat.
 *
 * Used by:
 * - /models page (model discovery)
 * - /api/v1/chat (public API allowed models + pricing)
 * - Onboarding professions.ts (suggested models validation)
 */

export type ModelTier = 'free' | 'budget' | 'standard' | 'premium';

export interface ModelEntry {
    id: string;
    name: string;
    provider: string;
    providerLabel: string;
    tier: ModelTier;
    costPerMessage: number;
    description: string;
    tags?: string[];
    /** If true, model is available in the public API */
    apiEnabled?: boolean;
}

export const MODEL_CATALOG: ModelEntry[] = [
    // ── Free Tier ─────────────────────────────────────
    {
        id: 'pho-fast',
        name: 'Phở Fast',
        provider: 'groq',
        providerLabel: 'Groq / Cerebras',
        tier: 'free',
        costPerMessage: 0,
        description: 'Lightning-fast responses for quick questions. Powered by Llama 3.1 8B.',
        tags: ['fast', 'free'],
        apiEnabled: true,
    },

    // ── Budget Tier ───────────────────────────────────
    {
        id: 'pho-pro',
        name: 'Phở Pro',
        provider: 'groq',
        providerLabel: 'Groq',
        tier: 'budget',
        costPerMessage: 5,
        description: 'High-quality balanced model. Llama 3.3 70B with reasoning.',
        tags: ['balanced', 'recommended'],
        apiEnabled: true,
    },
    {
        id: 'pho-smart',
        name: 'Phở Smart',
        provider: 'cerebras',
        providerLabel: 'Cerebras',
        tier: 'budget',
        costPerMessage: 5,
        description: 'Fast, smart responses. Llama 3.1 70B on Cerebras hardware.',
        apiEnabled: true,
    },
    {
        id: 'pho-vision',
        name: 'Phở Vision',
        provider: 'vercelaigateway',
        providerLabel: 'Google',
        tier: 'budget',
        costPerMessage: 5,
        description: 'Multimodal — understands images, documents, and text.',
        tags: ['vision', 'multimodal'],
        apiEnabled: true,
    },
    {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'google',
        providerLabel: 'Google',
        tier: 'budget',
        costPerMessage: 5,
        description: 'Google\'s fastest Gemini model for everyday tasks.',
        tags: ['fast'],
        apiEnabled: true,
    },

    // ── Standard Tier ─────────────────────────────────
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'google',
        providerLabel: 'Google',
        tier: 'standard',
        costPerMessage: 10,
        description: 'Latest Flash with enhanced reasoning and coding.',
        tags: ['reasoning', 'coding'],
        apiEnabled: true,
    },
    {
        id: 'gpt-4.1-mini',
        name: 'GPT-4.1 Mini',
        provider: 'openai',
        providerLabel: 'OpenAI',
        tier: 'standard',
        costPerMessage: 10,
        description: 'Compact but powerful OpenAI model for cost-effective use.',
        apiEnabled: true,
    },

    // ── Mid Tier ──────────────────────────────────────
    {
        id: 'deepseek-v3',
        name: 'DeepSeek V3',
        provider: 'deepseek',
        providerLabel: 'DeepSeek',
        tier: 'standard',
        costPerMessage: 20,
        description: 'Open-source Chinese AI model, strong at coding and math.',
        tags: ['coding', 'math'],
        apiEnabled: true,
    },
    {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        provider: 'openai',
        providerLabel: 'OpenAI',
        tier: 'premium',
        costPerMessage: 40,
        description: 'OpenAI\'s newest workhorse — reliable, smart, great at following instructions.',
        tags: ['reliable', 'instruct'],
        apiEnabled: true,
    },
    {
        id: 'deepseek-r1',
        name: 'DeepSeek R1',
        provider: 'deepseek',
        providerLabel: 'DeepSeek',
        tier: 'premium',
        costPerMessage: 50,
        description: 'Advanced reasoning model with chain-of-thought. Excels at complex tasks.',
        tags: ['reasoning', 'research'],
        apiEnabled: true,
    },

    // ── Premium Tier ──────────────────────────────────
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'google',
        providerLabel: 'Google',
        tier: 'premium',
        costPerMessage: 80,
        description: 'Google\'s most capable model. 1M context window, deep reasoning.',
        tags: ['research', 'long-context'],
        apiEnabled: true,
    },
    {
        id: 'gpt-5.2',
        name: 'GPT-5.2',
        provider: 'openai',
        providerLabel: 'OpenAI',
        tier: 'premium',
        costPerMessage: 100,
        description: 'OpenAI\'s most advanced model. State-of-the-art reasoning and creativity.',
        tags: ['advanced', 'creative'],
        apiEnabled: true,
    },
];

// ── Helper functions ──────────────────────────────────

/** Get model by ID */
export const getModelById = (id: string): ModelEntry | undefined =>
    MODEL_CATALOG.find(m => m.id === id);

/** Get all models available for API */
export const getApiModels = (): ModelEntry[] =>
    MODEL_CATALOG.filter(m => m.apiEnabled);

/** Get API model cost by ID */
export const getModelCost = (id: string): number =>
    getModelById(id)?.costPerMessage ?? 10;

/** Get models grouped by tier */
export const getModelsByTier = (): Record<ModelTier, ModelEntry[]> => {
    const grouped: Record<ModelTier, ModelEntry[]> = { budget: [], free: [], premium: [], standard: [] };
    MODEL_CATALOG.forEach(m => grouped[m.tier].push(m));
    return grouped;
};

/** Get all valid model IDs (for validation) */
export const getValidModelIds = (): string[] =>
    MODEL_CATALOG.map(m => m.id);
