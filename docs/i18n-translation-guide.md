# i18n Translation Guide for pho.chat

## Problem

The `@lobehub/i18n-cli` tool requires a **real OpenAI API key** for automatic translation. However, pho.chat uses **OpenRouter** as the primary AI provider (configured via `OPENAI_API_KEY` in `.env.local`), which uses a different API key format (`sk-or-v1-...`).

When you run `npm run i18n`, you'll get this error:
```
ERROR Translate failed, Error: 401 You didn't provide an API key.
```

## Solution

We've created a wrapper script that allows you to use a separate OpenAI API key specifically for i18n translation, without affecting your OpenRouter configuration.

## Setup Instructions

### Step 1: Get a Real OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in (new accounts get $5 free credit)
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-proj-...` or `sk-...`)

### Step 2: Add the Key to .env.local

Open your `.env.local` file and add the following line:

```bash
# Real OpenAI API key for i18n CLI translation
OPENAI_API_KEY_I18N=sk-proj-YOUR_REAL_OPENAI_KEY_HERE
```

**Important:** 
- Use `OPENAI_API_KEY_I18N` (not `OPENAI_API_KEY`)
- This keeps your OpenRouter configuration intact
- Never commit this key to version control

### Step 3: Run the i18n Translation

Use the new npm script:

```bash
npm run i18n:openai
```

Or run the script directly:

```bash
node scripts/run-i18n-with-openai.js
```

Or set the key inline (for one-time use):

```bash
OPENAI_API_KEY_I18N=sk-proj-xxx npm run i18n:openai
```

## What Happens

The wrapper script (`scripts/run-i18n-with-openai.js`):

1. ✅ Reads `OPENAI_API_KEY_I18N` from your environment
2. ✅ Temporarily sets `OPENAI_API_KEY` to this value
3. ✅ Removes `OPENAI_PROXY_URL` to ensure direct OpenAI API access
4. ✅ Runs the i18n workflow
5. ✅ Translates all payment strings to 18 languages
6. ✅ Restores your original environment after completion

## Translation Process

The i18n CLI will:

1. **Analyze** the source Chinese translations in `src/locales/default/payment.ts`
2. **Generate** `locales/zh-CN/payment.json` from the TypeScript source
3. **Translate** to all 18 supported languages:
   - Arabic (ar)
   - Bulgarian (bg-BG)
   - Traditional Chinese (zh-TW)
   - English (en-US)
   - Russian (ru-RU)
   - Japanese (ja-JP)
   - Korean (ko-KR)
   - French (fr-FR)
   - Turkish (tr-TR)
   - Spanish (es-ES)
   - Portuguese (pt-BR)
   - German (de-DE)
   - Italian (it-IT)
   - Dutch (nl-NL)
   - Polish (pl-PL)
   - Vietnamese (vi-VN)
   - Persian (fa-IR)
4. **Format** all JSON files with Prettier

## Cost Estimate

The i18n CLI uses `gpt-4.1-mini` model (configured in `.i18nrc.js`):
- **Model:** gpt-4.1-mini
- **Temperature:** 0 (deterministic translations)
- **Estimated cost:** ~$0.10-0.50 for translating the payment namespace to 17 languages
- **Your $5 free credit** is more than enough for multiple translation runs

## Troubleshooting

### Error: "OPENAI_API_KEY_I18N environment variable is not set"

**Solution:** Add the key to your `.env.local` file as shown in Step 2.

### Error: "Invalid OpenAI API key format"

**Solution:** Make sure your key starts with `sk-` or `sk-proj-`. OpenRouter keys (`sk-or-v1-...`) won't work.

### Error: "401 Unauthorized" or "Incorrect API key"

**Solution:** 
1. Verify your OpenAI API key is correct
2. Check if you have available credits at https://platform.openai.com/usage
3. Make sure the key hasn't expired

### Translations are incomplete or incorrect

**Solution:**
1. Check the terminal output for specific errors
2. Verify the source translations in `src/locales/default/payment.ts` are correct
3. Re-run the command: `npm run i18n:openai`

## Alternative: Manual Translation

If you don't want to use OpenAI API, you can manually translate the payment strings:

1. Copy `locales/en-US/payment.json` to each language folder
2. Manually translate each string
3. Run Prettier to format: `npm run lint:prettier`

## Files Involved

- **Source:** `src/locales/default/payment.ts` (Chinese - TypeScript)
- **Generated:** `locales/zh-CN/payment.json` (Chinese - JSON)
- **Translated:** `locales/{locale}/payment.json` (17 other languages)
- **Config:** `.i18nrc.js` (i18n CLI configuration)
- **Script:** `scripts/run-i18n-with-openai.js` (wrapper script)

## Security Notes

⚠️ **Never commit your OpenAI API key to version control!**

- The `.env.local` file is already in `.gitignore`
- Use environment variables in production (Vercel, etc.)
- Rotate your API key if accidentally exposed

