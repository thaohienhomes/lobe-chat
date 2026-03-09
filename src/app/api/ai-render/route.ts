import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { render } from '@/services/ai-rendering/fal-client';
import type {
  AIRenderRequestBody,
  AIRenderResponse,
  RenderOperation,
} from '@/services/ai-rendering/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/ai-render
 *
 * Accepts an image URL + render style and returns a rendered image URL via Fal.ai.
 * Requires authentication.
 */
export async function POST(request: Request): Promise<NextResponse<AIRenderResponse>> {
  // Auth check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
  }

  // Validate FAL_KEY
  if (!process.env.FAL_KEY) {
    console.error(
      '[ai-render] FAL_KEY missing. Available env keys with FAL:',
      Object.keys(process.env)
        .filter((k) => k.includes('FAL'))
        .join(', ') || '(none)',
    );
    return NextResponse.json(
      { error: 'AI rendering is not configured', success: false },
      { status: 503 },
    );
  }

  // Parse body
  let body: AIRenderRequestBody;
  try {
    body = (await request.json()) as AIRenderRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', success: false }, { status: 400 });
  }

  // Validate required fields
  if (!body.imageUrl || typeof body.imageUrl !== 'string') {
    return NextResponse.json({ error: 'imageUrl is required', success: false }, { status: 400 });
  }

  if (!body.renderStyle || typeof body.renderStyle !== 'string') {
    return NextResponse.json({ error: 'renderStyle is required', success: false }, { status: 400 });
  }

  // Validate URL format
  try {
    new URL(body.imageUrl);
  } catch {
    return NextResponse.json(
      { error: 'imageUrl must be a valid URL', success: false },
      { status: 400 },
    );
  }

  const operation: RenderOperation = body.operation ?? 'image-to-image';

  try {
    const result = await render({
      furnitureStyle: body.furnitureStyle,
      imageUrl: body.imageUrl,
      operation,
      prompt: body.prompt,
      renderStyle: body.renderStyle,
      roomType: body.roomType,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Rendering failed', success: false },
        { status: 502 },
      );
    }

    return NextResponse.json({
      duration: result.duration,
      imageUrl: result.imageUrl,
      success: true,
    });
  } catch (error) {
    console.error('[ai-render] Rendering error:', error);
    return NextResponse.json(
      { error: 'Internal rendering error', success: false },
      { status: 500 },
    );
  }
}
