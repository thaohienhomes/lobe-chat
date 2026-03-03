import { NextRequest, NextResponse } from 'next/server';

import { checkAuth } from '@/app/(backend)/middleware/auth';
import { initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';
import { phoGatewayService } from '@/server/services/phoGateway';

export const maxDuration = 120;

/**
 * POST /api/research/ai-summary
 *
 * Simple Clerk-authenticated AI completions endpoint for the Research Mode
 * Evidence Summarizer. Returns a plain JSON response with the full AI text
 * (non-streaming) so the frontend doesn't need to parse SSE.
 *
 * Body: { model: string; prompt: string }
 * Response: { text: string }
 */
const coreHandler = async (req: NextRequest, { jwtPayload }: any) => {
    let body: { model?: string; prompt?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { model = 'gpt-4o-mini', prompt } = body;
    if (!prompt) {
        return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const messages = [{ content: prompt, role: 'user' as const }];
    const priorityList = phoGatewayService.resolveProviderList(model);
    let lastError: any = null;

    for (const [idx, entry] of priorityList.entries()) {
        const { provider, modelId } = entry;
        try {
            const runtime = await initModelRuntimeWithUserPayload(provider, jwtPayload);
            const response = await runtime.chat({
                messages,
                model: modelId,
                temperature: 0.4,
            } as any);

            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullContent = '';

                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, { stream: true });
                    // LobeChat streams plain text chunks OR SSE lines
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
                                // plain text chunk
                                if (raw && raw !== '[DONE]') fullContent += raw;
                            }
                        } else if (trimmed && !trimmed.startsWith(':') && !trimmed.startsWith('event:')) {
                            // Some runtimes emit raw text lines
                            try {
                                const json = JSON.parse(trimmed);
                                const delta = json?.choices?.[0]?.delta?.content ?? json?.text ?? '';
                                if (delta) fullContent += delta;
                            } catch {
                                // truly raw text
                                fullContent += trimmed + '\n';
                            }
                        }
                    }
                }

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
};

const authenticatedHandler = checkAuth(coreHandler as any);

export const POST = async (req: NextRequest, options: any) => authenticatedHandler(req, options);
