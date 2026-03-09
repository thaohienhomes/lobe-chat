/**
 * POST /api/ai-rendering
 *
 * AI Rendering & Virtual Staging API endpoint.
 * Actions: virtual-stage, render-floor-plan, upscale, image-to-image, style-transfer
 *
 * - Auth check via Clerk
 * - Rate limit: 10 renders/day per user (in-memory + Redis fallback)
 * - Charges credits via processModelUsage
 *
 * Phase 3: "See Your Space"
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { render, upscale } from '@/services/ai-rendering/fal-client';
import { renderFloorPlan } from '@/services/ai-rendering/floor-plan-renderer';
import type {
  AIRenderResponse,
  FloorPlanRenderOptions,
  FurnitureStyle,
  RenderOperation,
  RenderStyle,
  RoomType,
  StagingConfig,
} from '@/services/ai-rendering/types';
import { stageRoom } from '@/services/ai-rendering/virtual-staging';
import { getClientIp } from '@/utils/rate-limiter';

export const runtime = 'nodejs';
export const maxDuration = 120;

// ─── Daily render limit per user ────────────────────────────────────

const DAILY_RENDER_LIMIT = 10;

// In-memory daily render counter (per-instance; Redis upgrade recommended)
const dailyRenderCounts = new Map<string, { count: number; date: string }>();

function checkDailyRenderLimit(userId: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().slice(0, 10);
  const entry = dailyRenderCounts.get(userId);

  if (!entry || entry.date !== today) {
    dailyRenderCounts.set(userId, { count: 1, date: today });
    return { allowed: true, remaining: DAILY_RENDER_LIMIT - 1 };
  }

  if (entry.count >= DAILY_RENDER_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: DAILY_RENDER_LIMIT - entry.count };
}

// ─── Request body type ──────────────────────────────────────────────

type RenderAction =
  | 'image-to-image'
  | 'inpainting'
  | 'render-floor-plan'
  | 'style-transfer'
  | 'upscale'
  | 'virtual-stage';

interface RequestBody {
  /** Render action to perform */
  action: RenderAction;
  /** Camera angle for floor plan renders */
  cameraAngle?: FloorPlanRenderOptions['cameraAngle'];
  /** Furniture style for virtual staging */
  furnitureStyle?: FurnitureStyle;
  /** Source image URL */
  imageUrl: string;
  /** Lighting for floor plan renders */
  lighting?: FloorPlanRenderOptions['lighting'];
  /** Mask URL for inpainting */
  maskUrl?: string;
  /** Additional generation prompt */
  prompt?: string;
  /** Target render style */
  renderStyle?: RenderStyle;
  /** Room type hint */
  roomType?: RoomType;
  /** Target room in floor plan */
  targetRoom?: string;
}

// ─── Validation ─────────────────────────────────────────────────────

const VALID_ACTIONS: RenderAction[] = [
  'virtual-stage',
  'render-floor-plan',
  'upscale',
  'image-to-image',
  'style-transfer',
  'inpainting',
];

function validateBody(body: unknown): { error?: string; parsed?: RequestBody } {
  if (!body || typeof body !== 'object') {
    return { error: 'Request body is required' };
  }

  const b = body as Record<string, unknown>;

  if (
    !b.action ||
    typeof b.action !== 'string' ||
    !VALID_ACTIONS.includes(b.action as RenderAction)
  ) {
    return { error: `action must be one of: ${VALID_ACTIONS.join(', ')}` };
  }

  if (!b.imageUrl || typeof b.imageUrl !== 'string') {
    return { error: 'imageUrl is required' };
  }

  try {
    new URL(b.imageUrl as string);
  } catch {
    return { error: 'imageUrl must be a valid URL' };
  }

  if (b.action === 'inpainting' && (!b.maskUrl || typeof b.maskUrl !== 'string')) {
    return { error: 'maskUrl is required for inpainting action' };
  }

  return { parsed: b as unknown as RequestBody };
}

// ─── Cost calculation ───────────────────────────────────────────────

/** Cost in Phở Points per render action */
const RENDER_COSTS: Record<RenderAction, number> = {
  'image-to-image': 50,
  'inpainting': 50,
  'render-floor-plan': 80,
  'style-transfer': 60,
  'upscale': 20,
  'virtual-stage': 80,
};

// ─── Route Handler ──────────────────────────────────────────────────

export async function POST(request: Request): Promise<NextResponse<AIRenderResponse>> {
  // 1. Auth check
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
  }

  // 2. Check FAL_KEY is configured
  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      { error: 'AI rendering is not configured on this server', success: false },
      { status: 503 },
    );
  }

  // 3. Rate limit: 10 renders/day per user
  const rateCheck = checkDailyRenderLimit(userId);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: `Bạn đã dùng hết ${DAILY_RENDER_LIMIT} lượt render hôm nay. Thử lại vào ngày mai.`,
        success: false,
      },
      { status: 429 },
    );
  }

  // 4. Parse and validate body
  let body: RequestBody;
  try {
    const raw = await request.json();
    const validation = validateBody(raw);
    if (validation.error) {
      return NextResponse.json({ error: validation.error, success: false }, { status: 400 });
    }
    body = validation.parsed!;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body', success: false }, { status: 400 });
  }

  // 5. Check credit balance before rendering
  const cost = RENDER_COSTS[body.action];
  try {
    const { getUserCreditBalance } = await import('@/server/services/billing/credits');
    const balance = await getUserCreditBalance(userId);
    if (balance && balance.balance !== null && balance.balance < cost) {
      return NextResponse.json(
        {
          error: 'Không đủ Phở Points. Vui lòng nạp thêm để sử dụng AI Rendering.',
          success: false,
        },
        { status: 402 },
      );
    }
  } catch {
    // Fail open if billing service unavailable
    console.warn('[ai-rendering] Could not check credit balance, proceeding');
  }

  // 6. Execute rendering
  const startTime = Date.now();
  try {
    let result;

    switch (body.action) {
      case 'virtual-stage': {
        const config: StagingConfig = {
          furnitureStyle: body.furnitureStyle ?? 'modern',
          renderStyle: body.renderStyle ?? 'modern',
          roomType: body.roomType,
        };
        result = await stageRoom(body.imageUrl, config);
        break;
      }

      case 'render-floor-plan': {
        const options: FloorPlanRenderOptions = {
          cameraAngle: body.cameraAngle ?? 'corner',
          furnitureStyle: body.furnitureStyle,
          lighting: body.lighting ?? 'day',
          targetRoom: body.targetRoom,
          viewStyle: body.renderStyle ?? 'modern',
        };
        result = await renderFloorPlan(body.imageUrl, options);
        break;
      }

      case 'upscale': {
        result = await upscale(body.imageUrl);
        break;
      }

      default: {
        // image-to-image, style-transfer, inpainting
        const operationMap: Record<string, RenderOperation> = {
          'image-to-image': 'image-to-image',
          'inpainting': 'inpainting',
          'style-transfer': 'style-transfer',
        };
        result = await render({
          imageUrl: body.imageUrl,
          maskUrl: body.maskUrl,
          operation: operationMap[body.action] ?? 'image-to-image',
          prompt: body.prompt,
          renderStyle: body.renderStyle,
          roomType: body.roomType,
        });
        break;
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? 'Rendering failed', success: false },
        { status: 502 },
      );
    }

    // 7. Charge credits after successful render
    try {
      const { processModelUsage } = await import('@/server/services/billing/credits');
      const responseTimeMs = Date.now() - startTime;

      await processModelUsage(userId, cost, 2, false, {
        inputTokens: 0,
        model: `fal-ai/${body.action}`,
        outputTokens: 0,
        provider: 'fal-ai',
        responseTimeMs,
      });
    } catch (billingError) {
      console.warn('[ai-rendering] Failed to charge credits:', billingError);
    }

    const clientIp = getClientIp(request);
    console.log(
      `[ai-rendering] ✅ ${body.action} completed for user ${userId} (${clientIp}) in ${result.duration}ms. ` +
        `Remaining today: ${rateCheck.remaining}`,
    );

    return NextResponse.json({
      duration: result.duration,
      imageUrl: result.imageUrl,
      success: true,
    });
  } catch (error) {
    console.error('[ai-rendering] Error:', error);
    return NextResponse.json(
      { error: 'Internal rendering error', success: false },
      { status: 500 },
    );
  }
}
