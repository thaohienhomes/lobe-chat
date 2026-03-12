/**
 * TranslationBatcher — Batch AI translation for diagram labels
 *
 * Sends extracted texts to the AI model for translation in batches.
 * Uses the existing model runtime infrastructure from Pho.Chat.
 *
 * System prompt is optimized for:
 * - Short diagram labels (not full sentences)
 * - Technical terminology (construction, engineering, academic)
 * - Structured JSON output for reliable parsing
 */
import type { ExtractedText, Translation, TranslationOptions } from './types';

// ─── Constants ──────────────────────────────────────────────────────

/** Maximum texts per batch to stay within token limits */
const BATCH_SIZE = 50;

/** AI models to try, in priority order */
const TRANSLATION_MODELS = [
  { model: 'google/gemini-2.5-flash', provider: 'vercelaigateway' },
  { model: 'anthropic/claude-sonnet-4-6', provider: 'vercelaigateway' },
  { model: 'openai/gpt-5.2', provider: 'vercelaigateway' },
] as const;

// ─── Prompt Templates ───────────────────────────────────────────────

function buildSystemPrompt(sourceLang: string, targetLang: string): string {
  return `You are a technical document translator specializing in construction, engineering, and academic terminology. You translate diagram labels (short phrases in boxes/shapes) from ${sourceLang} to ${targetLang}.

RULES:
- Keep translations concise — these are diagram labels, not paragraphs
- Preserve technical terminology accuracy
- If a term has a standard translation in the target field, use it
- Return ONLY valid JSON: {"translations": [{"id": "...", "translated": "..."}]}
- Do not translate proper nouns, abbreviations, or numbers
- Maintain the same level of formality as the original text
- For construction/engineering terms, use industry-standard translations`;
}

function buildBatchPrompt(texts: Array<{ id: string; text: string }>): string {
  const items = texts.map((t) => `  {"id": "${t.id}", "text": "${t.text}"}`).join(',\n');
  return `Translate these diagram labels:
[
${items}
]

Return JSON with translations for each id.`;
}

// ─── Language Detection ─────────────────────────────────────────────

/** Simple heuristic to detect source language from text samples */
function detectLanguage(texts: string[]): string {
  const sample = texts.slice(0, 10).join(' ');

  // Chinese characters (CJK Unified Ideographs)
  if (/[\u4E00-\u9FFF]/.test(sample)) return 'Chinese';

  // Japanese (Hiragana + Katakana)
  if (/[\u3040-\u30FF]/.test(sample)) return 'Japanese';

  // Korean (Hangul)
  if (/[\uAC00-\uD7AF]/.test(sample)) return 'Korean';

  // Vietnamese (Latin with specific diacritics)
  if (/[âêôăđơư]/i.test(sample)) return 'Vietnamese';

  // Default to English
  return 'English';
}

// ─── SSE/Stream parsing (reused from vision-analysis.ts pattern) ────

function extractContentFromSSE(raw: string): string {
  const lines = raw.split('\n');
  const textParts: string[] = [];

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    const data = line.slice(6).trim();
    if (data === '[DONE]') break;

    try {
      const parsed = JSON.parse(data);
      const content = parsed.choices?.[0]?.delta?.content;
      if (content) textParts.push(content);
    } catch {
      if (data && data !== '[DONE]') textParts.push(data);
    }
  }

  return textParts.join('');
}

async function streamToText(response: any): Promise<string> {
  if (typeof response === 'string') return response;

  if (response instanceof Response) {
    const reader = response.body?.getReader();
    if (!reader) return '';

    const decoder = new TextDecoder();
    const chunks: string[] = [];

    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (done) break;
      chunks.push(decoder.decode(result.value, { stream: true }));
    }

    return extractContentFromSSE(chunks.join(''));
  }

  return String(response || '');
}

// ─── JSON Response Parser ───────────────────────────────────────────

function parseTranslationResponse(raw: string): Array<{ id: string; translated: string }> {
  let cleaned = raw.trim();

  // Strip markdown code fences
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  // Find JSON boundaries
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No JSON object found in translation response');
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  const parsed = JSON.parse(cleaned);

  if (!parsed.translations || !Array.isArray(parsed.translations)) {
    throw new Error('Invalid translation response: missing translations array');
  }

  return parsed.translations.map((t: any) => ({
    id: String(t.id || ''),
    translated: String(t.translated || ''),
  }));
}

// ─── TranslationBatcher ─────────────────────────────────────────────

export class TranslationBatcher {
  /**
   * Translate a batch of extracted texts using the AI model.
   *
   * @param texts - Extracted text elements to translate
   * @param options - Translation options (target lang, model, glossary)
   * @returns Array of Translation objects with original + translated text
   */
  async translateBatch(
    texts: ExtractedText[],
    options: TranslationOptions,
  ): Promise<Translation[]> {
    const { initModelRuntimeWithUserPayload } = await import('@/server/modules/ModelRuntime');

    // Auto-detect source language if not provided
    const sourceLang = options.sourceLang || detectLanguage(texts.map((t) => t.text));
    const targetLang = options.targetLang;

    // Apply glossary first (direct replacements)
    const glossary = options.glossary || {};

    // Split into batches
    const batches: ExtractedText[][] = [];
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      batches.push(texts.slice(i, i + BATCH_SIZE));
    }

    const allTranslations: Translation[] = [];

    for (const batch of batches) {
      // Prepare batch items, applying glossary where possible
      const batchItems: Array<{ id: string; text: string }> = [];
      const glossaryTranslations: Translation[] = [];

      for (const text of batch) {
        // Check glossary first
        if (glossary[text.text]) {
          glossaryTranslations.push({
            confidence: 1,
            id: text.id,
            original: text.text,
            translated: glossary[text.text],
          });
        } else {
          batchItems.push({ id: text.id, text: text.text });
        }
      }

      // Add glossary results
      allTranslations.push(...glossaryTranslations);

      // Skip AI call if all texts were in glossary
      if (batchItems.length === 0) continue;

      // Try each model in priority order
      let translated = false;

      for (const { model, provider } of TRANSLATION_MODELS) {
        try {
          const runtime = await initModelRuntimeWithUserPayload(provider, {});

          const response = await runtime.chat({
            messages: [
              {
                content: buildSystemPrompt(sourceLang, targetLang),
                role: 'system' as const,
              },
              {
                content: buildBatchPrompt(batchItems),
                role: 'user' as const,
              },
            ],
            model,
            temperature: 0.2,
          });

          const text = await streamToText(response);
          if (!text) {
            console.warn(`[DocTranslation] Empty response from ${model}, trying next`);
            continue;
          }

          const results = parseTranslationResponse(text);

          // Map results back to Translation objects
          for (const result of results) {
            const original = batchItems.find((b) => b.id === result.id);
            if (original) {
              allTranslations.push({
                confidence: 0.9,
                id: result.id,
                original: original.text,
                translated: result.translated,
              });
            }
          }

          translated = true;
          break; // Success — don't try other models
        } catch (error) {
          console.warn(
            `[DocTranslation] ${model} failed:`,
            error instanceof Error ? error.message : error,
          );
          continue;
        }
      }

      if (!translated) {
        // All models failed for this batch — add untranslated entries
        for (const item of batchItems) {
          allTranslations.push({
            confidence: 0,
            id: item.id,
            original: item.text,
            translated: item.text, // Keep original if translation fails
          });
        }
      }
    }

    return allTranslations;
  }

  /**
   * Detect the source language of the extracted texts.
   */
  detectSourceLanguage(texts: ExtractedText[]): string {
    return detectLanguage(texts.map((t) => t.text));
  }
}
