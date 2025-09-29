# 🤖 AI Model Integration Guide for pho.chat

## Overview

The pho.chat application uses a comprehensive AI model integration system with support for multiple providers, dynamic model loading, and secure API key management.

## Architecture Components

### 1. **Model Runtime System**

- **Location**: `packages/model-runtime/src/providers/`
- **Purpose**: Handles different AI provider implementations
- **Supported Providers**: OpenAI, Anthropic, Google, Azure, Bedrock, DeepSeek, Moonshot, and 30+ others

### 2. **API Routes Structure**

```
/webapi/chat/{provider}     - Chat completions
/webapi/models/{provider}   - Model listings
/webapi/models/{provider}/pull - Model downloads (for local providers)
```

### 3. **tRPC Routers**

- **aiProvider**: Manages AI provider configurations
- **aiModel**: Handles individual model settings
- **Location**: `src/server/routers/lambda/`

## Configuration Steps

### Step 1: Environment Variables Setup

Create/update your `.env.local` file:

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_PROXY_URL=https://api.openai.com/v1 # Optional proxy

# Anthropic Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Google AI Configuration
GOOGLE_API_KEY=your_google_api_key_here

# Azure OpenAI Configuration
AZURE_API_KEY=your_azure_api_key_here
AZURE_ENDPOINT=https://your-resource.openai.azure.com
AZURE_API_VERSION=2024-02-15-preview

# Enable specific providers
ENABLED_AZURE_OPENAI=1
ENABLED_AWS_BEDROCK=1
ENABLED_ANTHROPIC=1
ENABLED_GOOGLE=1

# Model Lists (optional - for custom model filtering)
OPENAI_MODEL_LIST=gpt-4,gpt-4-turbo,gpt-3.5-turbo
ANTHROPIC_MODEL_LIST=claude-3-opus,claude-3-sonnet,claude-3-haiku
```

### Step 2: Provider Configuration

The system automatically loads providers based on environment variables. Each provider is configured in:

- `src/config/modelProviders/{provider}.ts`
- `packages/model-runtime/src/providers/{provider}/index.ts`

### Step 3: Model Selection Implementation

The application provides several ways to select and switch models:

#### A. Global Model Settings

Users can set default models in Settings > AI Provider

#### B. Per-Session Model Selection

Each chat session can have its own model configuration

#### C. Dynamic Model Switching

Models can be changed mid-conversation

## API Key Management

### Secure Storage Options:

1. **Environment Variables** (Server-side)
2. **User Key Vaults** (Client-side, encrypted)
3. **Database Storage** (Encrypted with KeyVaults system)

### Key Vault Implementation:

```typescript
// Location: src/types/user/settings.ts
interface OpenAICompatibleKeyVault {
  apiKey?: string;
  baseURL?: string;
  models?: string[];
}
```

## Error Handling & Fallbacks

### 1. **Provider Fallback Chain**

```typescript
// Automatic fallback to alternative providers
const fallbackProviders = ['openai', 'anthropic', 'google'];
```

### 2. **Error Types Handled**:

- API Key Invalid/Missing
- Rate Limiting
- Model Unavailable
- Network Timeouts
- Quota Exceeded

### 3. **Graceful Degradation**:

- Fallback to alternative models
- User notification of issues
- Automatic retry mechanisms

## Model Provider Examples

### OpenAI Integration:

```typescript
// Automatic configuration based on env vars
const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_PROXY_URL || 'https://api.openai.com/v1',
  models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
};
```

### Custom Provider Addition:

```typescript
// Add to src/config/modelProviders/index.ts
import CustomProvider from './custom';

export const DEFAULT_MODEL_PROVIDER_LIST = [
  // ... existing providers
  CustomProvider,
];
```

## Testing Your Integration

### 1. **Check Provider Status**

Navigate to: `https://pho.chat/settings/provider`

### 2. **Test Model Availability**

Use the model selector in any chat session

### 3. **Debug API Calls**

Check browser console for API request/response logs

### 4. **Verify Error Handling**

Test with invalid API keys to ensure proper error messages

## Best Practices

### 1. **Security**

- Never expose API keys in client-side code
- Use environment variables for server-side keys
- Implement proper key rotation

### 2. **Performance**

- Cache model lists when possible
- Implement request queuing for rate limits
- Use streaming for better UX

### 3. **User Experience**

- Provide clear model selection UI
- Show loading states during model switches
- Display helpful error messages

### 4. **Monitoring**

- Log API usage and errors
- Monitor response times
- Track model performance metrics

## Troubleshooting Common Issues

### Issue: Models not loading

**Solution**: Check environment variables and provider configuration

### Issue: API key errors

**Solution**: Verify key format and permissions

### Issue: Rate limiting

**Solution**: Implement exponential backoff and user notifications

### Issue: Model switching not working

**Solution**: Check tRPC router connections and state management

## Advanced Features

### 1. **Custom Model Parameters**

Configure temperature, max tokens, etc. per model

### 2. **Model Routing**

Route different request types to optimal models

### 3. **Cost Optimization**

Automatically select cost-effective models based on request complexity

### 4. **A/B Testing**

Compare model performance across different providers

## Support & Resources

- **Documentation**: `/docs` directory
- **Provider Configs**: `src/config/modelProviders/`
- **Runtime Implementations**: `packages/model-runtime/src/providers/`
- **API Routes**: `src/app/webapi/`
- **tRPC Routers**: `src/server/routers/lambda/`
