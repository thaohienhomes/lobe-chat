---
description: How to integrate and use Google Vertex AI with Phở Platform
---

# Google Vertex AI Integration Skill

This skill provides comprehensive guidance for integrating Google Vertex AI into Phở Chat and Phở Studio applications.

## Overview

Vertex AI is Google Cloud's unified AI platform providing access to:
- **Google Models**: Gemini 3/2.5/2.0, Imagen 4/3, Veo 3.1/3/2, Embeddings
- **Partner Models**: Claude 4.5/4/3.5 (Anthropic), Llama 4/3.3 (Meta), DeepSeek R1, Mistral
- **Advanced Features**: Grounding (Google Search, RAG), Function Calling, Live API

## Authentication

### Option 1: Service Account JSON (Recommended for Production)

1. Create a Service Account in GCP Console
2. Grant "Vertex AI User" role
3. Download JSON key file
4. Set environment variable:

```bash
VERTEXAI_CREDENTIALS='{"type":"service_account","project_id":"your-project",...}'
VERTEXAI_PROJECT=your-gcp-project-id
VERTEXAI_LOCATION=us-central1
```

### Option 2: Application Default Credentials (ADC)

```bash
gcloud auth application-default login
```

## SDK Installation

### Node.js
```bash
npm install @google/genai
```

### Python
```bash
pip install google-genai
```

## Basic Usage (Node.js)

```javascript
const { GoogleGenAI } = require('@google/genai');

const client = new GoogleGenAI({
  vertexai: true,
  project: process.env.GOOGLE_CLOUD_PROJECT,
  location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
});

// Text generation
const response = await client.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Explain quantum computing in simple terms',
});

console.log(response.text);
```

## Streaming Responses

```javascript
const response = await client.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: 'Write a story about a robot',
});

for await (const chunk of response) {
  process.stdout.write(chunk.text);
}
```

## Function Calling

```javascript
const tools = [{
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City name' },
    },
    required: ['location'],
  },
}];

const response = await client.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What is the weather in Tokyo?',
  tools: [{ functionDeclarations: tools }],
});

// Check for function call in response
if (response.candidates[0].content.parts[0].functionCall) {
  const functionCall = response.candidates[0].content.parts[0].functionCall;
  console.log('Function:', functionCall.name);
  console.log('Args:', functionCall.args);
}
```

## Model Naming Conventions

| Provider | Model ID Format | Example |
|:---------|:----------------|:--------|
| Google (Gemini) | `gemini-{version}` | `gemini-2.5-flash` |
| Anthropic | `claude-{variant}@anthropic` | `claude-opus-4-5@anthropic` |
| Meta (Llama) | `llama-{version}@meta` | `llama-4-maverick@meta` |
| DeepSeek | `deepseek-{variant}` | `deepseek-r1-0528` |

## Available Models (Feb 2026)

> **Note:** Currently only Google Gemini models are supported via `@lobechat/model-runtime`.
> Partner models (Claude, Llama, DeepSeek, Mistral) require custom backend implementation.

### Gemini Family (Supported)
- `gemini-3-pro-preview` - Most advanced, 1M context, agentic workflows
- `gemini-3-flash-preview` - Near-zero thinking, multimodal
- `gemini-2.5-pro` - GA, complex reasoning, 2M context
- `gemini-2.5-flash` - **Recommended default**, balanced speed/quality
- `gemini-2.5-flash-lite` - Cost-optimized
- `gemini-2.0-flash` - Stable, production-ready

### Partner Models (Not Yet Supported)
The following require custom backend routing implementation:
- Claude (Anthropic) - `claude-opus-4-5`, `claude-sonnet-4-5`, `claude-haiku-4-5`
- Llama (Meta) - `llama-4-maverick`, `llama-4-scout`, `llama-3.3-70b`
- DeepSeek - `deepseek-r1`
- Mistral - `mistral-large`

## Grounding with Google Search

```javascript
const response = await client.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What are the latest news about AI?',
  tools: [{
    googleSearch: {},
  }],
});

// Response includes citations
console.log(response.text);
console.log(response.groundingMetadata);
```

## Image Generation (Imagen)

```javascript
const response = await client.models.generateImages({
  model: 'imagen-4',
  prompt: 'A futuristic cityscape at sunset',
  config: {
    numberOfImages: 4,
    aspectRatio: '16:9',
  },
});

for (const image of response.generatedImages) {
  // image.image.imageBytes contains base64 data
  console.log(image.image.mimeType);
}
```

## Video Generation (Veo)

```javascript
const response = await client.models.generateContent({
  model: 'veo-3-generate-preview',
  contents: 'A cat playing with a ball',
  generationConfig: {
    videoDuration: 8, // 5-8 seconds
    aspectRatio: '16:9',
  },
});
```

## Phở Platform Integration

The existing integration uses `@lobechat/model-runtime/vertexai`:

```typescript
import { LobeVertexAI } from '@lobechat/model-runtime/vertexai';

const instance = LobeVertexAI.initFromVertexAI({
  googleAuthOptions: { credentials: parsedCredentials },
  location: process.env.VERTEXAI_LOCATION,
  project: process.env.VERTEXAI_PROJECT,
});
```

### Environment Variables (.env.local)
```bash
# Required
VERTEXAI_CREDENTIALS='{"type":"service_account","project_id":"xxx",...}'
VERTEXAI_PROJECT=your-project-id

# Optional
VERTEXAI_LOCATION=us-central1  # Default: us-central1
```

### Step-by-Step Integration

#### 1. Update Model Provider Config
Edit `src/config/modelProviders/vertexai.ts` to add/update models:
```typescript
const VertexAI: ModelProviderCard = {
  chatModels: [
    { id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', ... },
    { id: 'claude-sonnet-4-5@anthropic', displayName: 'Claude Sonnet 4.5', ... },
    // Add more models as needed
  ],
  enabled: true,
  id: 'vertexai',
  name: 'Vertex AI',
};
```

#### 2. Enable Vertex AI Provider
Edit `src/config/modelProviders/index.ts`:
```typescript
// Set enabled: true for vertexai
// Set enabled: false for other providers if needed
```

#### 3. Update Default Model/Provider
Edit `packages/const/src/settings/llm.ts`:
```typescript
export const DEFAULT_MODEL = 'gemini-2.5-flash';
export const DEFAULT_PROVIDER = 'vertexai';
```

#### 4. Update Model Picker Hook
Edit `src/hooks/useEnabledChatModels.ts`:
```typescript
import VertexAIConfig from '@/config/modelProviders/vertexai';
const ALLOWED_PROVIDER_ID = 'vertexai';
// Update the hook to return Vertex AI models
```

#### 5. Update Provider Selectors
Edit `src/store/aiInfra/slices/aiProvider/selectors.ts`:
```typescript
const ALLOWED_PROVIDER_IDS = new Set(['vertexai']);
```

#### 6. Update Pricing Tiers
Edit `src/config/pricing.ts`:
- Add Vertex AI model IDs to `MODEL_TIERS`
- Update `PLAN_MODEL_ACCESS` with `defaultProvider: 'vertexai'`

## Pricing Comparison

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|:------|:---------------------|:-----------------------|
| Gemini 2.5 Flash | $0.15 | $0.60 |
| Gemini 2.5 Pro | $2.50 | $10.00 |
| Claude Opus 4.5 | ~$15.00 | ~$75.00 |
| Claude Sonnet 4.5 | ~$3.00 | ~$15.00 |
| Claude Haiku 4.5 | ~$0.25 | ~$1.25 |

## Troubleshooting

### Common Errors

1. **"Permission denied" error**
   - Verify Service Account has "Vertex AI User" role
   - Check project ID matches credentials

2. **"Model not found" error**
   - Check model ID spelling
   - Verify model is available in your region
   - Partner models may need additional enablement

3. **"Quota exceeded" error**
   - Check GCP quotas in console
   - Request quota increase if needed

### Regional Availability

Most models work well from Vietnam when using Vertex AI (vs direct Google AI Studio which has restrictions). Recommended locations:
- `us-central1` - Most models available
- `asia-southeast1` - Lower latency for Vietnam
- `global` - Automatic routing

## Resources

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini API Reference](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/overview)
- [Partner Models](https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude)
- [Pricing](https://cloud.google.com/vertex-ai/generative-ai/pricing)
