# AI Providers Quick Start Guide

> **Quick reference for configuring AI model providers in pho.chat**

## 🚀 Minimum Configuration for Production

### Required Providers

```bash
# OpenAI (Primary - REQUIRED)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Anthropic (Fallback - HIGHLY RECOMMENDED)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Optional but Recommended

```bash
# Google AI (Free tier available)
GOOGLE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# DeepSeek (Cost optimization)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 📋 Quick Setup Steps

### 1. Get API Keys

| Provider      | Sign Up URL                                                       | Key Format    | Free Tier |
| ------------- | ----------------------------------------------------------------- | ------------- | --------- |
| **OpenAI**    | [platform.openai.com](https://platform.openai.com/api-keys)       | `sk-proj-...` | $5 credit |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/)           | `sk-ant-...`  | $5 credit |
| **Google AI** | [makersuite.google.com](https://makersuite.google.com/app/apikey) | `AIzaSy...`   | Free tier |
| **DeepSeek**  | [platform.deepseek.com](https://platform.deepseek.com/)           | `sk-...`      | Free tier |

### 2. Local Development

```bash
# Copy template
cp .env.example .env.local

# Add your keys to .env.local
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Start dev server
bun run dev

# Verify in browser
# Navigate to Settings → Language Model
# Check providers appear with green checkmarks
```

### 3. Vercel Production

```bash
# In Vercel Dashboard → Settings → Environment Variables

# Add for all environments (Production, Preview, Development):
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Deploy
git push origin main
```

## 🎯 Recommended Models

### For Cost Optimization

```bash
# Cheapest options for production
gpt-4o-mini      # OpenAI - $0.15/$0.60 per 1M tokens
claude-3-5-haiku # Anthropic - $1/$5 per 1M tokens
gemini-2.0-flash # Google - Free tier available
deepseek-chat    # DeepSeek - $0.14/$0.28 per 1M tokens
```

### For Best Performance

```bash
# Most capable models
gpt-4o            # OpenAI - $5/$15 per 1M tokens
claude-3-5-sonnet # Anthropic - $3/$15 per 1M tokens
gemini-1.5-pro    # Google - $1.25/$5 per 1M tokens
```

## ✅ Verification Checklist

Before deploying to production:

- [ ] OpenAI API key configured in Vercel
- [ ] Anthropic API key configured in Vercel
- [ ] Test chat with OpenAI model in production
- [ ] Test chat with Anthropic model in production
- [ ] Billing alerts set up in OpenAI dashboard
- [ ] Billing alerts set up in Anthropic dashboard
- [ ] Rate limits understood (see full guide)
- [ ] Cost optimization enabled (optional)

## 🔧 Common Issues

### Provider not showing in UI

```bash
# Check environment variable name (case-sensitive)
OPENAI_API_KEY=... # ✅ Correct
openai_api_key=... # ❌ Wrong

# Restart dev server
bun run dev
```

### Invalid API Key error

```bash
# Verify key format
OpenAI: sk-proj-... or sk-...
Anthropic: sk-ant-...
Google: AIzaSy...

# Check for extra spaces
OPENAI_API_KEY=sk-proj-xxxxx  # ✅ Correct
OPENAI_API_KEY= sk-proj-xxxxx # ❌ Extra space
```

### Works locally but not in production

```bash
# Verify Vercel environment variables
# Must be set for "Production" environment
# Redeploy after adding variables
```

## 📊 Cost Estimates

### Low Usage (1M tokens/month)

```
OpenAI (gpt-4o-mini):     $0.75/month
Anthropic (claude-haiku): $6/month
Google (gemini-flash):    Free
DeepSeek (deepseek-chat): $0.42/month
```

### Medium Usage (10M tokens/month)

```
OpenAI (gpt-4o-mini):     $7.50/month
Anthropic (claude-haiku): $60/month
Google (gemini-flash):    Free (with limits)
DeepSeek (deepseek-chat): $4.20/month
```

### High Usage (100M tokens/month)

```
OpenAI (gpt-4o-mini):     $75/month
Anthropic (claude-haiku): $600/month
Google (gemini-flash):    ~$50/month
DeepSeek (deepseek-chat): $42/month
```

## 🔗 Full Documentation

For complete details, see:

- **[AI Model Providers Production Guide](./AI_MODEL_PROVIDERS_PRODUCTION_GUIDE.md)** - Complete guide with all 60+ providers
- **Environment Variables**: `src/envs/llm.ts`
- **Provider Configs**: `src/config/modelProviders/`

## 🆘 Need Help?

1. Check the [full production guide](./AI_MODEL_PROVIDERS_PRODUCTION_GUIDE.md)
2. Review provider documentation (links in full guide)
3. Check Vercel deployment logs
4. Enable debug mode: `NEXT_PUBLIC_ENABLE_DEBUG=1`

---

**Quick Start Version**: 1.0\
**Last Updated**: January 2025
