import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/artifact-ai
 *
 * Allows React artifact iframes to call the LLM from within the artifact.
 * The calling iframe uses: window.phoChat.askAI(prompt, options)
 *
 * Body: { prompt: string; systemPrompt?: string; model?: string }
 * Returns: { text: string }
 *
 * Security: requires authenticated session (Clerk).
 */
export async function POST(request: Request) {
  // 1. Verify auth
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse body
  const body = await request.json();
  const { prompt, systemPrompt = '', model = 'gemini-2.5-flash' } = body;

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Missing "prompt" field' }, { status: 400 });
  }

  // 3. Call Vertex AI via Vercel AI Gateway
  try {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 });
    }

    // Use Google Generative Language API directly for simplicity
    const googleEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(googleEndpoint, {
      body: JSON.stringify({
        contents: [
          ...(systemPrompt ? [{ parts: [{ text: systemPrompt }], role: 'model' }] : []),
          { parts: [{ text: prompt }], role: 'user' },
        ],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7,
        },
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[artifact-ai] API error:', response.status, errText);
      return NextResponse.json({ error: `AI API error: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return NextResponse.json({ text });
  } catch (error) {
    console.error('[artifact-ai] Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
