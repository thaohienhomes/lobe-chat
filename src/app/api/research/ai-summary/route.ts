import { NextRequest, NextResponse } from 'next/server';

import { initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';
import { phoGatewayService } from '@/server/services/phoGateway';

export const maxDuration = 120;

/**
 * Known model-to-provider mappings for common research models.
 * Used to correctly resolve providers before calling remapProvider.
 */
const MODEL_PROVIDER_HINTS: Record<string, string> = {
    'claude-3-5-sonnet-20241022': 'anthropic',
    'claude-3.5-sonnet': 'anthropic',
    'gemini-2.5-flash': 'google',
    'gemini-2.5-pro': 'google',
    'gpt-4o': 'openai',
    'gpt-4o-mini': 'openai',
};

/**
 * POST /api/research/ai-summary
 *
 * Clerk-authenticated AI completions endpoint for the Research Mode
 * Evidence Summarizer & Multi-Agent Manuscript Reviewer.
 *
 * Body: { model: string; prompt: string }
 * Response: { text: string }
 */
export async function POST(req: NextRequest) {
    // ── 1. Auth via Clerk cookies ───────────────────────────────────────────
    let userId: string | null = null;
    try {
        const { auth } = await import('@clerk/nextjs/server');
        const session = await auth();
        userId = session.userId;
    } catch {
        // Clerk auth not available
    }

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized – please sign in' }, { status: 401 });
    }

    // ── 2. Parse body ───────────────────────────────────────────────────────
    let body: { model?: string; prompt?: string; stream?: boolean };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { model = 'gemini-2.5-flash', prompt, stream: streamMode = false } = body;
    if (!prompt) {
        return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // ── 3. Resolve provider chain ─────────────────────────────────────────
    // Use remapProvider to correctly route models (e.g. google → vercelaigateway)
    const hintProvider = MODEL_PROVIDER_HINTS[model] || 'openai';
    const remapped = phoGatewayService.remapProvider(hintProvider, model);

    console.log('[research/ai-summary] Request:', {
        hintProvider,
        model,
        remappedModelId: remapped.modelId,
        remappedProvider: remapped.provider,
        userId,
    });

    // Build provider list: remapped provider first, then fallbacks
    const providerList = [
        remapped,
        // Add Vercel AI Gateway as universal fallback if not already the primary
        ...(remapped.provider !== 'vercelaigateway'
            ? [{ modelId: `google/${model.replace('google/', '')}`, provider: 'vercelaigateway' }]
            : []),
    ];

    // ── 4. Try each provider ──────────────────────────────────────────────
    const messages = [{ content: prompt, role: 'user' as const }];
    // Empty payload = use server env vars for API keys (not user-provided keys)
    const emptyPayload = {} as any;
    let lastError: any = null;

    for (const [idx, entry] of providerList.entries()) {
        const { provider, modelId } = entry;
        try {
            console.log(`[research/ai-summary] Attempt ${idx + 1}: provider=${provider}, model=${modelId}`);
            const runtime = await initModelRuntimeWithUserPayload(provider, emptyPayload);
            const response = await runtime.chat({
                messages,
                model: modelId,
                temperature: 0.4,
            } as any);

            if (response.body) {
                // ── Streaming mode: pipe SSE events to client ──
                if (streamMode) {
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    const encoder = new TextEncoder();

                    const readable = new ReadableStream({
                        async start(controller) {
                            try {
                                // eslint-disable-next-line no-constant-condition
                                while (true) {
                                    const { done, value } = await reader.read();
                                    if (done) break;
                                    const chunk = decoder.decode(value, { stream: true });
                                    for (const line of chunk.split('\n')) {
                                        const trimmed = line.trim();
                                        if (trimmed.startsWith('data: ')) {
                                            const raw = trimmed.slice(6);
                                            if (raw === '[DONE]') continue;
                                            try {
                                                const json = JSON.parse(raw);
                                                const delta = json?.choices?.[0]?.delta?.content;
                                                if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`));
                                                else if (typeof json === 'string') controller.enqueue(encoder.encode(`data: ${JSON.stringify(json)}\n\n`));
                                            } catch {
                                                if (raw && raw !== '[DONE]') controller.enqueue(encoder.encode(`data: ${JSON.stringify(raw)}\n\n`));
                                            }
                                        } else if (trimmed && !trimmed.startsWith(':') && !trimmed.startsWith('event:')) {
                                            try {
                                                const json = JSON.parse(trimmed);
                                                const delta = json?.choices?.[0]?.delta?.content ?? json?.text ?? '';
                                                if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify(delta)}\n\n`));
                                            } catch {
                                                controller.enqueue(encoder.encode(`data: ${JSON.stringify(trimmed)}\n\n`));
                                            }
                                        }
                                    }
                                }
                                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                                controller.close();
                            } catch (err) {
                                controller.error(err);
                            }
                        },
                    });

                    console.log(`[research/ai-summary] Streaming via ${provider}`);
                    return new Response(readable, {
                        headers: {
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                            'Content-Type': 'text/event-stream',
                        },
                    });
                }

                // ── Non-streaming mode: buffer full response ──
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullContent = '';

                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    for (const line of chunk.split('\n')) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('data: ')) {
                            const raw = trimmed.slice(6);
                            if (raw === '[DONE]') continue;
                            try {
                                const json = JSON.parse(raw);
                                const delta = json?.choices?.[0]?.delta?.content;
                                if (delta) fullContent += delta;
                                else if (typeof json === 'string') fullContent += json;
                            } catch {
                                if (raw && raw !== '[DONE]') fullContent += raw;
                            }
                        } else if (trimmed && !trimmed.startsWith(':') && !trimmed.startsWith('event:')) {
                            try {
                                const json = JSON.parse(trimmed);
                                const delta = json?.choices?.[0]?.delta?.content ?? json?.text ?? '';
                                if (delta) fullContent += delta;
                            } catch {
                                fullContent += trimmed + '\n';
                            }
                        }
                    }
                }

                console.log(`[research/ai-summary] Success via ${provider}, ${fullContent.length} chars`);
                return NextResponse.json({ model: modelId, provider, text: fullContent });
            }

            // Non-streaming response
            const text = await response.text();
            return NextResponse.json({ model: modelId, provider, text });
        } catch (e: any) {
            console.error(`[research/ai-summary] Attempt ${idx + 1} failed (${provider}):`, e?.message);
            lastError = e;
        }
    }

    return NextResponse.json(
        { error: `All providers failed. ${lastError?.message || ''}` },
        { status: 502 },
    );
}
