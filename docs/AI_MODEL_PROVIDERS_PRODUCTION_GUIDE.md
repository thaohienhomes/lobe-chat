# AI Model Providers - Production Configuration Guide for pho.chat

> **Last Updated**: January 2025\
> **Target Deployment**: Vercel Production\
> **Authentication**: Clerk (required)\
> **Database**: PostgreSQL (Neon)

## Table of Contents

1. [Overview](#overview)
2. [Essential Providers (Required for Production)](#essential-providers)
3. [Enterprise Providers (Recommended)](#enterprise-providers)
4. [Additional Providers (Optional)](#additional-providers)
5. [Configuration Steps](#configuration-steps)
6. [Testing & Verification](#testing--verification)
7. [Production Considerations](#production-considerations)
8. [Troubleshooting](#troubleshooting)

---

## Overview

pho.chat supports **60+ AI model providers** through a unified configuration system. Each provider is automatically enabled when its API key is configured.

### Architecture

```
Environment Variables (.env.local / Vercel)
    ↓
src/envs/llm.ts (Validation)
    ↓
src/server/globalConfig/genServerAiProviderConfig.ts (Server Config)
    ↓
src/config/modelProviders/* (Provider Definitions)
    ↓
AI Model Runtime (packages/model-runtime)
```

### Configuration Pattern

Most providers follow this pattern:

```bash
# Required: API Key
{PROVIDER}_API_KEY=your_api_key_here

# Optional: Custom endpoint/proxy
{PROVIDER}_PROXY_URL=https://custom-endpoint.com/v1

# Optional: Custom model list
{PROVIDER}_MODEL_LIST=model1,model2,model3

# Auto-enabled when API key is present
ENABLED_{PROVIDER}=1 # Automatically set
```

---

## Essential Providers

These providers are **critical for production** and should be configured before deployment.

### 1. OpenAI (Primary Provider)

**Status**: Enabled by default\
**Priority**: CRITICAL\
**Use Case**: Primary AI provider for most features

#### Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional - Custom endpoint (for proxies)
OPENAI_PROXY_URL=https://api.openai.com/v1

# Optional - Custom model list
OPENAI_MODEL_LIST=gpt-4o,gpt-4o-mini,gpt-3.5-turbo

# Optional - Disable OpenAI (not recommended)
ENABLED_OPENAI=0
```

#### Getting API Keys

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-proj-` or `sk-`)
6. **Important**: Save it immediately - you won't see it again!

#### Recommended Models for Production

| Model           | Use Case              | Cost                      | Context Window |
| --------------- | --------------------- | ------------------------- | -------------- |
| `gpt-4o`        | Complex tasks, vision | $5/$15 per 1M tokens      | 128K           |
| `gpt-4o-mini`   | Fast, cost-effective  | $0.15/$0.60 per 1M tokens | 128K           |
| `gpt-3.5-turbo` | Simple tasks, legacy  | $0.50/$1.50 per 1M tokens | 16K            |

#### Vercel Configuration

```bash
# In Vercel Dashboard → Settings → Environment Variables
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 2. Anthropic (Claude Models)

**Status**: Optional but highly recommended\
**Priority**: HIGH\
**Use Case**: Advanced reasoning, long context, coding

#### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional - Custom endpoint
ANTHROPIC_PROXY_URL=https://api.anthropic.com
```

#### Getting API Keys

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-`)

#### Recommended Models for Production

| Model                        | Use Case         | Cost                  | Context Window |
| ---------------------------- | ---------------- | --------------------- | -------------- |
| `claude-3-5-sonnet-20241022` | Best balance     | $3/$15 per 1M tokens  | 200K           |
| `claude-3-5-haiku-20241022`  | Fast, affordable | $1/$5 per 1M tokens   | 200K           |
| `claude-3-opus-20240229`     | Most capable     | $15/$75 per 1M tokens | 200K           |

#### Vercel Configuration

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 3. Google AI (Gemini Models)

**Status**: Optional\
**Priority**: MEDIUM\
**Use Case**: Multimodal, long context, free tier available

#### Environment Variables

```bash
# Required
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Getting API Keys

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click **Get API Key**
4. Create a new API key or use existing
5. Copy the key (starts with `AIzaSy`)

#### Recommended Models for Production

| Model              | Use Case           | Cost                   | Context Window |
| ------------------ | ------------------ | ---------------------- | -------------- |
| `gemini-2.0-flash` | Fast, multimodal   | Free tier available    | 1M tokens      |
| `gemini-1.5-pro`   | Advanced reasoning | $1.25/$5 per 1M tokens | 2M tokens      |

#### Vercel Configuration

```bash
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Enterprise Providers

### 4. Azure OpenAI

**Status**: Optional\
**Priority**: MEDIUM (for enterprise customers)\
**Use Case**: Enterprise compliance, data residency

#### Environment Variables

```bash
# Required
AZURE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_ENDPOINT=https://your-resource.openai.azure.com
AZURE_API_VERSION=2024-10-21

# Auto-enabled when AZURE_API_KEY is set
ENABLED_AZURE_OPENAI=1
```

#### Getting API Keys

1. Visit [Azure Portal](https://portal.azure.com/)
2. Create **Azure OpenAI** resource
3. Navigate to **Keys and Endpoint**
4. Copy **Key 1** or **Key 2**
5. Copy **Endpoint** URL
6. Note the **API Version** (use latest stable)

#### Deployment Names

Azure OpenAI requires deployment names for each model:

```bash
# In Azure Portal, create deployments for:
- gpt-4o (deployment name: gpt-4o)
- gpt-4o-mini (deployment name: gpt-4o-mini)
- gpt-35-turbo (deployment name: gpt-35-turbo)
```

#### Vercel Configuration

```bash
AZURE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_ENDPOINT=https://your-resource.openai.azure.com
AZURE_API_VERSION=2024-10-21
```

---

### 5. AWS Bedrock

**Status**: Optional\
**Priority**: LOW (for AWS customers)\
**Use Case**: AWS ecosystem integration

#### Environment Variables

```bash
# Required
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1

# Optional - Enable Bedrock
ENABLED_AWS_BEDROCK=1

# Optional - Custom model list
AWS_BEDROCK_MODEL_LIST=anthropic.claude-3-sonnet-20240229-v1:0
```

#### Getting API Keys

1. Visit [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create IAM user with **Bedrock** permissions
3. Generate **Access Key**
4. Copy **Access Key ID** and **Secret Access Key**
5. Enable Bedrock in your AWS region

#### Vercel Configuration

```bash
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
ENABLED_AWS_BEDROCK=1
```

---

## Additional Providers

pho.chat supports 55+ additional providers. Here's a categorized list:

### Popular Open-Source / Self-Hosted

| Provider      | API Key Variable | Proxy URL Variable   | Notes                            |
| ------------- | ---------------- | -------------------- | -------------------------------- |
| **Ollama**    | N/A              | `OLLAMA_PROXY_URL`   | Local models, enabled by default |
| **LM Studio** | N/A              | `LMSTUDIO_PROXY_URL` | Local models                     |
| **vLLM**      | `VLLM_API_KEY`   | `VLLM_PROXY_URL`     | Self-hosted inference            |

### AI Aggregators / Routers

| Provider       | API Key Variable     | Default Endpoint               | Notes                 |
| -------------- | -------------------- | ------------------------------ | --------------------- |
| **OpenRouter** | `OPENROUTER_API_KEY` | `https://openrouter.ai/api/v1` | Access 100+ models    |
| **302.AI**     | `AI302_API_KEY`      | `https://api.302.ai/v1`        | Chinese market        |
| **AiHubMix**   | `AIHUBMIX_API_KEY`   | -                              | Multi-provider access |

### Chinese AI Providers

| Provider              | API Key Variable       | Notes                      |
| --------------------- | ---------------------- | -------------------------- |
| **DeepSeek**          | `DEEPSEEK_API_KEY`     | Cost-effective reasoning   |
| **ZhiPu (GLM)**       | `ZHIPU_API_KEY`        | Chinese language optimized |
| **Moonshot (Kimi)**   | `MOONSHOT_API_KEY`     | Long context (200K+)       |
| **Qwen (Alibaba)**    | `QWEN_API_KEY`         | Alibaba Cloud              |
| **Baidu (Wenxin)**    | `WENXIN_API_KEY`       | Baidu ERNIE models         |
| **Tencent (Hunyuan)** | `HUNYUAN_API_KEY`      | Tencent Cloud              |
| **Minimax**           | `MINIMAX_API_KEY`      | Voice + text               |
| **Baichuan**          | `BAICHUAN_API_KEY`     | Open-source models         |
| **SiliconCloud**      | `SILICONCLOUD_API_KEY` | Cost-effective             |
| **Gitee AI**          | `GITEE_AI_API_KEY`     | Chinese developer platform |

### Specialized Providers

| Provider         | API Key Variable      | Specialty            |
| ---------------- | --------------------- | -------------------- |
| **Perplexity**   | `PERPLEXITY_API_KEY`  | Search-augmented     |
| **Groq**         | `GROQ_API_KEY`        | Ultra-fast inference |
| **Together AI**  | `TOGETHERAI_API_KEY`  | Open-source models   |
| **Fireworks AI** | `FIREWORKSAI_API_KEY` | Function calling     |
| **Mistral**      | `MISTRAL_API_KEY`     | European AI          |
| **Cohere**       | `COHERE_API_KEY`      | Enterprise NLP       |

### Image Generation

| Provider | API Key Variable | Notes                 |
| -------- | ---------------- | --------------------- |
| **FAL**  | `FAL_API_KEY`    | Fast image generation |
| **BFL**  | `BFL_API_KEY`    | FLUX models           |

### Complete Provider List

For a complete list of all 60+ providers, see:

- **Environment Variables**: `src/envs/llm.ts`
- **Provider Configs**: `src/config/modelProviders/`
- **Example Config**: `.env.example`

---

## Configuration Steps

### Step 1: Local Development Setup

1. **Copy environment template**:

   ```bash
   cp .env.example .env.local
   ```

2. **Add your API keys**:

   ```bash
   # Edit .env.local
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

3. **Start development server**:

   ```bash
   bun run dev
   ```

4. **Verify in UI**:
   - Navigate to **Settings** → **Language Model**
   - Check that your providers appear in the list
   - Each provider should show a green checkmark if configured correctly

### Step 2: Vercel Production Deployment

1. **Access Vercel Dashboard**:
   - Go to your project on [Vercel](https://vercel.com)
   - Navigate to **Settings** → **Environment Variables**

2. **Add environment variables**:

   ```
   Variable Name: OPENAI_API_KEY
   Value: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Environments: ✓ Production ✓ Preview ✓ Development
   ```

3. **Add all required providers**:
   - Repeat for each provider you want to enable
   - Use the same variable names as in `.env.local`

4. **Deploy**:

   ```bash
   git push origin main
   ```

   Or trigger manual deployment in Vercel Dashboard

5. **Verify deployment**:
   - Visit your production URL
   - Check Settings → Language Model
   - Verify all providers are available

---

## Testing & Verification

### Local Testing

1. **Check provider availability**:

   ```bash
   # Start dev server
   bun run dev
   
   # Open browser
   # Navigate to Settings → Language Model
   # Verify providers appear with green checkmarks
   ```

2. **Test API connection**:
   - Create a new chat
   - Select a model from your configured provider
   - Send a test message
   - Verify response is received

3. **Check server logs**:
   ```bash
   # Look for provider initialization logs
   # Should see: "Provider [openai] enabled with X models"
   ```

### Production Testing

1. **Verify environment variables**:

   ```bash
   # In Vercel Dashboard → Settings → Environment Variables
   # Confirm all API keys are set for Production environment
   ```

2. **Check deployment logs**:

   ```bash
   # In Vercel Dashboard → Deployments → [Latest] → Logs
   # Look for successful provider initialization
   ```

3. **Test each provider**:
   - Visit production URL
   - Settings → Language Model
   - For each provider:
     - Select a model
     - Send test message
     - Verify response

4. **Monitor errors**:
   ```bash
   # Check Vercel logs for API errors
   # Common issues:
   # - Invalid API key
   # - Rate limit exceeded
   # - Network timeout
   ```

### Automated Testing

Create a test script to verify all providers:

```typescript
// scripts/test-providers.ts
import { getLLMConfig } from '@/envs/llm';

const config = getLLMConfig();

console.log('Enabled Providers:');
console.log('- OpenAI:', config.ENABLED_OPENAI);
console.log('- Anthropic:', config.ENABLED_ANTHROPIC);
console.log('- Google:', config.ENABLED_GOOGLE);
// ... add more providers
```

Run with:

```bash
bun run scripts/test-providers.ts
```

---

## Production Considerations

### 1. Essential vs. Optional Providers

**For pho.chat production, configure AT MINIMUM**:

- ✅ **OpenAI** (required - primary provider)
- ✅ **Anthropic** (recommended - fallback + advanced features)
- ⚠️ **Google AI** (optional - free tier for testing)

**Optional but recommended**:

- Azure OpenAI (enterprise customers)
- DeepSeek (cost optimization)
- OpenRouter (model diversity)

### 2. Security Best Practices

#### API Key Management

```bash
# ❌ NEVER commit API keys to git
# ❌ NEVER expose API keys in client-side code
# ❌ NEVER share API keys in screenshots/logs

# ✅ Use environment variables
# ✅ Rotate keys regularly (every 90 days)
# ✅ Use separate keys for dev/staging/production
# ✅ Set up billing alerts
```

#### Vercel Environment Variables

```bash
# Set different keys for each environment
Production: OPENAI_API_KEY=sk-proj-prod-xxxxx
Preview: OPENAI_API_KEY=sk-proj-preview-xxxxx
Development: OPENAI_API_KEY=sk-proj-dev-xxxxx
```

#### Key Rotation Process

1. Generate new API key in provider dashboard
2. Add new key to Vercel as `OPENAI_API_KEY_NEW`
3. Update code to try new key first, fallback to old
4. Deploy and verify
5. Remove old key from Vercel
6. Revoke old key in provider dashboard

### 3. Rate Limiting & Quotas

#### OpenAI Rate Limits

| Tier   | RPM  | TPM  | Batch Queue |
| ------ | ---- | ---- | ----------- |
| Free   | 3    | 40K  | -           |
| Tier 1 | 500  | 200K | 100K        |
| Tier 2 | 5000 | 2M   | 1M          |

**Recommendation**: Start with Tier 1, upgrade based on usage

#### Handling Rate Limits

```typescript
// Implemented in packages/model-runtime
// Automatic retry with exponential backoff
// Falls back to alternative providers if configured
```

### 4. Cost Optimization

#### Model Selection Strategy

```typescript
// Use cheaper models for simple tasks
const modelStrategy = {
  'simple-chat': 'gpt-4o-mini', // $0.15/$0.60 per 1M
  'complex-reasoning': 'gpt-4o', // $5/$15 per 1M
  'code-generation': 'claude-3-5-sonnet', // $3/$15 per 1M
  'long-context': 'gemini-1.5-pro', // $1.25/$5 per 1M
};
```

#### Budget Alerts

```bash
# Set up in provider dashboards
OpenAI: Platform → Usage → Billing → Set usage limits
Anthropic: Console → Settings → Billing → Usage alerts
Google: Cloud Console → Billing → Budgets &
alerts
```

#### Cost Tracking

```bash
# Enable in .env.local / Vercel
COST_OPTIMIZATION_ENABLED=true
USAGE_TRACKING_ENABLED=true
VND_EXCHANGE_RATE=24167
MAX_COST_PER_QUERY_VND=100
```

### 5. Fallback & Redundancy

#### Provider Fallback Chain

```typescript
// Automatic fallback order (configured in codebase)
1. Primary: OpenAI (gpt-4o-mini)
2. Fallback 1: Anthropic (claude-3-5-haiku)
3. Fallback 2: Google (gemini-2.0-flash)
4. Fallback 3: DeepSeek (deepseek-chat)
```

#### Configuration

```bash
# Configure multiple providers for redundancy
OPENAI_API_KEY=sk-proj-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx
GOOGLE_API_KEY=AIzaSyxxxxx
DEEPSEEK_API_KEY=sk-xxxxx
```

### 6. Monitoring & Alerts

#### Vercel Monitoring

```bash
# Enable in Vercel Dashboard
Settings → Monitoring → Enable
- Function errors
- Function duration
- Edge network errors
```

#### Custom Monitoring

```bash
# Add to .env.local / Vercel
NEXT_PUBLIC_VERCEL_ANALYTICS=1
PERFORMANCE_MONITORING_ENABLED=true
```

#### Error Tracking

```bash
# Optional: Sentry integration
NEXT_PUBLIC_ENABLE_SENTRY=1
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

---

## Troubleshooting

### Common Issues

#### 1. Provider Not Appearing in UI

**Symptoms**: Provider doesn't show in Settings → Language Model

**Solutions**:

```bash
# Check API key is set
echo $OPENAI_API_KEY # Should output your key

# Check environment variable name
# Must match exactly: OPENAI_API_KEY (not openai_api_key)

# Restart dev server
bun run dev

# Clear Next.js cache
rm -rf .next
bun run dev
```

#### 2. "Invalid API Key" Error

**Symptoms**: Error message when sending chat

**Solutions**:

```bash
# Verify key format
OpenAI: sk-proj-... or sk-...
Anthropic: sk-ant-...
Google: AIzaSy...

# Check key is active in provider dashboard
# Regenerate if necessary

# Verify no extra spaces/newlines
OPENAI_API_KEY=sk-proj-xxxxx  # ✅ Correct
OPENAI_API_KEY= sk-proj-xxxxx # ❌ Extra space
```

#### 3. Rate Limit Errors

**Symptoms**: "Rate limit exceeded" or 429 errors

**Solutions**:

```bash
# Check usage in provider dashboard
# Upgrade tier if needed
# Configure fallback providers
# Implement request queuing (already built-in)
```

#### 4. Vercel Deployment Issues

**Symptoms**: Providers work locally but not in production

**Solutions**:

```bash
# Verify environment variables in Vercel
# Must be set for "Production" environment
# Redeploy after adding variables

# Check deployment logs
Vercel Dashboard → Deployments → [Latest] → Logs

# Verify no build errors
# Check for missing dependencies
```

#### 5. Model Not Available

**Symptoms**: Specific model doesn't appear in model list

**Solutions**:

```bash
# Check model is enabled in provider config
# See: src/config/modelProviders/{provider}.ts

# Verify model name is correct
# Check provider documentation for exact model IDs

# Custom model list (if needed)
OPENAI_MODEL_LIST=gpt-4o,gpt-4o-mini,custom-model
```

### Debug Mode

Enable debug logging:

```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_ENABLE_DEBUG=1

# Check browser console for detailed logs
# Check terminal for server-side logs
```

### Getting Help

1. **Check Documentation**:
   - Provider-specific docs in `src/config/modelProviders/`
   - Environment variables in `src/envs/llm.ts`

2. **Review Logs**:
   - Browser console (F12)
   - Terminal output
   - Vercel deployment logs

3. **Test Incrementally**:
   - Start with one provider (OpenAI)
   - Verify it works
   - Add additional providers one at a time

---

## Quick Reference

### Essential Environment Variables for Production

```bash
# Core Configuration
NEXT_PUBLIC_SERVICE_MODE=server
DATABASE_URL=postgresql://...
KEY_VAULTS_SECRET=...

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# AI Providers (Minimum)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...

# AI Providers (Recommended)
GOOGLE_API_KEY=AIzaSy...
DEEPSEEK_API_KEY=sk-...

# Storage (S3)
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=pho-chat
S3_ENDPOINT=...
S3_PUBLIC_DOMAIN=...
```

### Provider Status Checklist

Before production deployment, verify:

- [ ] OpenAI API key configured and tested
- [ ] Anthropic API key configured and tested
- [ ] Google AI API key configured (optional)
- [ ] Billing alerts set up for all providers
- [ ] Rate limits understood and monitored
- [ ] Fallback providers configured
- [ ] Cost optimization enabled
- [ ] All environment variables set in Vercel
- [ ] Production deployment tested
- [ ] Monitoring and alerts configured

---

## Additional Resources

- **OpenAI Documentation**: <https://platform.openai.com/docs>

- **Anthropic Documentation**: <https://docs.anthropic.com>

- **Google AI Documentation**: <https://ai.google.dev/docs>

- **Azure OpenAI Documentation**: <https://learn.microsoft.com/azure/ai-services/openai/>

- **AWS Bedrock Documentation**: <https://docs.aws.amazon.com/bedrock/>

- **LobeChat Model Providers**: `src/config/modelProviders/`

- **Environment Variables**: `src/envs/llm.ts`

- **Server Configuration**: `src/server/globalConfig/`

---

**Document Version**: 1.0\
**Last Updated**: January 2025\
**Maintained By**: pho.chat Development Team
