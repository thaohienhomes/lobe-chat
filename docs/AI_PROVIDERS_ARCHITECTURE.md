# AI Providers Architecture

> **Technical overview of AI model provider integration in pho.chat**

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Environment Variables                        │
│  (.env.local for dev / Vercel Environment Variables for prod)   │
│                                                                  │
│  OPENAI_API_KEY=sk-proj-xxxxx                                   │
│  ANTHROPIC_API_KEY=sk-ant-xxxxx                                 │
│  GOOGLE_API_KEY=AIzaSyxxxxx                                     │
│  ... (60+ providers supported)                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Environment Validation                         │
│                   src/envs/llm.ts                               │
│                                                                  │
│  - Validates environment variables using Zod                    │
│  - Auto-enables providers when API key is present               │
│  - Exports typed configuration object                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Server Configuration Generation                     │
│        src/server/globalConfig/genServerAiProviderConfig.ts     │
│                                                                  │
│  - Reads validated environment variables                        │
│  - Loads provider definitions from model-bank                   │
│  - Generates runtime configuration for each provider            │
│  - Handles custom model lists and proxy URLs                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Provider Definitions                            │
│              src/config/modelProviders/*.ts                     │
│                                                                  │
│  - openai.ts: OpenAI models (GPT-4, GPT-3.5, etc.)            │
│  - anthropic.ts: Claude models (Opus, Sonnet, Haiku)          │
│  - google.ts: Gemini models (Pro, Flash)                       │
│  - ... (60+ provider definition files)                         │
│                                                                  │
│  Each file exports:                                             │
│  - Model list with capabilities                                │
│  - Default settings (proxy URL, SDK type)                      │
│  - Pricing information                                          │
│  - Context window sizes                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Model Runtime Layer                            │
│              packages/model-runtime/src/providers/              │
│                                                                  │
│  - Implements provider-specific API clients                     │
│  - Handles authentication and request formatting                │
│  - Manages streaming responses                                  │
│  - Implements retry logic and error handling                    │
│  - Supports function calling and tool use                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Routes                                  │
│                 src/app/api/chat/                               │
│                                                                  │
│  - Receives chat requests from frontend                         │
│  - Selects appropriate provider based on model                  │
│  - Calls model runtime with user message                        │
│  - Streams response back to client                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend UI                                   │
│          src/app/[variants]/(main)/settings/llm/                │
│                                                                  │
│  - Displays available providers in Settings                     │
│  - Shows model selection dropdown                               │
│  - Allows custom API key configuration (optional)               │
│  - Displays provider status (enabled/disabled)                  │
└─────────────────────────────────────────────────────────────────┘
```

## Provider Enablement Logic

```typescript
// src/envs/llm.ts

// Pattern 1: Auto-enable when API key is present
ENABLED_ANTHROPIC: !!process.env.ANTHROPIC_API_KEY;

// Pattern 2: Enabled by default (can be disabled)
ENABLED_OPENAI: process.env.ENABLED_OPENAI !== '0';

// Pattern 3: Explicit enable flag required
ENABLED_AWS_BEDROCK: process.env.ENABLED_AWS_BEDROCK === '1';

// Pattern 4: Multiple conditions
ENABLED_CLOUDFLARE: !!process.env.CLOUDFLARE_API_KEY &&
  !!process.env.CLOUDFLARE_BASE_URL_OR_ACCOUNT_ID;
```

## Configuration Flow

### 1. Development Environment

```
Developer sets .env.local
    ↓
Next.js loads environment variables
    ↓
src/envs/llm.ts validates and exports config
    ↓
Server components read config
    ↓
Provider appears in UI if enabled
```

### 2. Production Environment (Vercel)

```
Developer sets Vercel Environment Variables
    ↓
Vercel injects variables at build time
    ↓
Next.js build process validates config
    ↓
Deployed app uses production config
    ↓
Providers available based on configured keys
```

## Provider Categories

### Tier 1: Essential (Always Configure)

```typescript
const essentialProviders = {
  openai: {
    enabled: true, // Default enabled
    apiKey: 'OPENAI_API_KEY',
    priority: 'CRITICAL',
    fallback: ['anthropic', 'google'],
  },
  anthropic: {
    enabled: !!process.env.ANTHROPIC_API_KEY,
    apiKey: 'ANTHROPIC_API_KEY',
    priority: 'HIGH',
    fallback: ['openai', 'google'],
  },
};
```

### Tier 2: Recommended (Configure for Production)

```typescript
const recommendedProviders = {
  google: {
    enabled: !!process.env.GOOGLE_API_KEY,
    apiKey: 'GOOGLE_API_KEY',
    priority: 'MEDIUM',
    features: ['free-tier', 'long-context'],
  },
  deepseek: {
    enabled: !!process.env.DEEPSEEK_API_KEY,
    apiKey: 'DEEPSEEK_API_KEY',
    priority: 'MEDIUM',
    features: ['cost-effective', 'reasoning'],
  },
};
```

### Tier 3: Optional (Configure as Needed)

```typescript
const optionalProviders = {
  azure: {
    enabled: !!process.env.AZURE_API_KEY,
    apiKey: 'AZURE_API_KEY',
    priority: 'LOW',
    useCase: 'enterprise-compliance',
  },
  bedrock: {
    enabled: process.env.ENABLED_AWS_BEDROCK === '1',
    apiKey: 'AWS_ACCESS_KEY_ID',
    priority: 'LOW',
    useCase: 'aws-ecosystem',
  },
};
```

## Model Selection Strategy

```typescript
// Automatic model selection based on task
const modelStrategy = {
  // Simple tasks → Cheapest models
  'simple-chat': {
    primary: 'gpt-4o-mini',
    fallback: ['claude-3-5-haiku', 'gemini-2.0-flash'],
    maxCost: 0.001, // $0.001 per request
  },

  // Complex reasoning → Best models
  'complex-reasoning': {
    primary: 'gpt-4o',
    fallback: ['claude-3-5-sonnet', 'gemini-1.5-pro'],
    maxCost: 0.01, // $0.01 per request
  },

  // Code generation → Specialized models
  'code-generation': {
    primary: 'claude-3-5-sonnet',
    fallback: ['gpt-4o', 'deepseek-coder'],
    maxCost: 0.005, // $0.005 per request
  },

  // Long context → High context window models
  'long-context': {
    primary: 'gemini-1.5-pro',
    fallback: ['claude-3-5-sonnet', 'gpt-4o'],
    maxCost: 0.02, // $0.02 per request
  },
};
```

## Error Handling & Fallback

```typescript
// Automatic fallback chain
async function callModel(message: string, model: string) {
  const providers = [
    { name: 'openai', model: 'gpt-4o-mini' },
    { name: 'anthropic', model: 'claude-3-5-haiku' },
    { name: 'google', model: 'gemini-2.0-flash' },
    { name: 'deepseek', model: 'deepseek-chat' },
  ];

  for (const provider of providers) {
    try {
      return await provider.call(message);
    } catch (error) {
      if (error.code === 'rate_limit') {
        // Try next provider
        continue;
      }
      if (error.code === 'invalid_api_key') {
        // Skip this provider
        continue;
      }
      throw error; // Unrecoverable error
    }
  }

  throw new Error('All providers failed');
}
```

## Rate Limiting

```typescript
// Built-in rate limiting per provider
const rateLimits = {
  openai: {
    requestsPerMinute: 500,
    tokensPerMinute: 200_000,
    tier: 'tier-1',
  },
  anthropic: {
    requestsPerMinute: 50,
    tokensPerMinute: 100_000,
    tier: 'free',
  },
  google: {
    requestsPerMinute: 60,
    tokensPerMinute: 'unlimited',
    tier: 'free',
  },
};

// Automatic request queuing when rate limit is reached
// Implemented in packages/model-runtime
```

## Cost Tracking

```typescript
// Cost tracking per request
interface RequestCost {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  currency: 'USD' | 'VND';
}

// Aggregate costs per user/session
interface UserCosts {
  userId: string;
  totalCost: number;
  requestCount: number;
  providers: Record<string, number>;
}

// Budget alerts
const budgetAlerts = {
  warning: 0.75, // 75% of budget
  critical: 0.9, // 90% of budget
  emergency: 0.95, // 95% of budget
};
```

## Security Considerations

### API Key Storage

```typescript
// ✅ Correct: Server-side only
// src/server/routers/lambda/aiProvider.ts
const apiKey = process.env.OPENAI_API_KEY;

// ❌ Wrong: Never expose in client
// src/app/components/Chat.tsx
const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;  // NEVER DO THIS
```

### Key Encryption

```typescript
// User-provided API keys are encrypted in database
// Using KEY_VAULTS_SECRET from environment
import { encrypt, decrypt } from '@/server/utils/keyVault';

// Store user's custom API key
const encryptedKey = encrypt(userApiKey, process.env.KEY_VAULTS_SECRET);
await db.insert(userKeys).values({ userId, encryptedKey });

// Retrieve and decrypt
const { encryptedKey } = await db.query.userKeys.findFirst({ where: eq(userKeys.userId, userId) });
const apiKey = decrypt(encryptedKey, process.env.KEY_VAULTS_SECRET);
```

## Performance Optimization

### Caching

```typescript
// Model list caching
const modelListCache = new Map<string, ModelList>();

async function getModelList(provider: string) {
  if (modelListCache.has(provider)) {
    return modelListCache.get(provider);
  }

  const models = await fetchModelsFromProvider(provider);
  modelListCache.set(provider, models);
  return models;
}
```

### Parallel Provider Initialization

```typescript
// src/server/globalConfig/genServerAiProviderConfig.ts
const providerConfigs = await Promise.all(
  Object.values(ModelProvider).map(async (provider) => {
    // Initialize all providers in parallel
    return await initializeProvider(provider);
  }),
);
```

## Monitoring & Observability

### Metrics to Track

```typescript
const metrics = {
  // Provider health
  providerAvailability: {
    openai: 0.999, // 99.9% uptime
    anthropic: 0.995, // 99.5% uptime
    google: 0.998, // 99.8% uptime
  },

  // Performance
  averageLatency: {
    openai: 1200, // 1.2s average
    anthropic: 1500, // 1.5s average
    google: 800, // 0.8s average
  },

  // Costs
  dailyCost: {
    openai: 15.5, // $15.50/day
    anthropic: 8.2, // $8.20/day
    google: 2.1, // $2.10/day
  },

  // Usage
  requestCount: {
    openai: 1500, // 1500 requests/day
    anthropic: 800, // 800 requests/day
    google: 300, // 300 requests/day
  },
};
```

## File Structure

```
pho.chat/
├── src/
│   ├── envs/
│   │   └── llm.ts                    # Environment variable validation
│   ├── config/
│   │   └── modelProviders/           # Provider definitions (60+ files)
│   │       ├── openai.ts
│   │       ├── anthropic.ts
│   │       ├── google.ts
│   │       └── ...
│   ├── server/
│   │   └── globalConfig/
│   │       ├── index.ts              # Main server config
│   │       └── genServerAiProviderConfig.ts  # Provider config generation
│   └── app/
│       └── api/
│           └── chat/                 # Chat API routes
├── packages/
│   └── model-runtime/
│       └── src/
│           └── providers/            # Provider implementations
│               ├── openai/
│               ├── anthropic/
│               ├── google/
│               └── ...
└── docs/
    ├── AI_MODEL_PROVIDERS_PRODUCTION_GUIDE.md  # Complete guide
    ├── AI_PROVIDERS_QUICK_START.md             # Quick start
    └── AI_PROVIDERS_ARCHITECTURE.md            # This file
```

## Key Takeaways

1. **60+ providers supported** - But only 2-3 needed for production
2. **Auto-enablement** - Providers automatically enabled when API key is set
3. **Fallback chain** - Automatic failover between providers
4. **Cost optimization** - Built-in cost tracking and budget alerts
5. **Security** - API keys never exposed to client
6. **Flexibility** - Easy to add new providers or customize existing ones

---

**Architecture Version**: 1.0\
**Last Updated**: January 2025
