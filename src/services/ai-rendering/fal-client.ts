/**
 * Fal.ai Client — AI Rendering Integration
 *
 * Wrapper for @fal-ai/client with retry logic, model selection,
 * and style-to-prompt mapping.
 *
 * Phase 3: "See Your Space"
 */
import { createFalClient } from '@fal-ai/client';

import type {
  RenderMetadata,
  RenderOperation,
  RenderRequest,
  RenderResult,
  RenderStyle,
} from './types';

// ─── Fal.ai Model IDs ──────────────────────────────────────────────

export const FAL_MODELS = {
  controlnetCanny: 'fal-ai/fast-sdxl-controlnet-canny',
  controlnetDepth: 'fal-ai/sd15-depth-controlnet',
  fluxSchnell: 'fal-ai/flux/schnell',
  inpaint: 'fal-ai/inpaint',
  ipAdapter: 'fal-ai/ip-adapter-face-id',
  realEsrgan: 'fal-ai/esrgan',  // was: fal-ai/real-esrgan (404)
  sdxl: 'fal-ai/fast-sdxl',
} as const;

// ─── Style → Prompt Mapping ────────────────────────────────────────

const STYLE_PROMPTS: Record<RenderStyle, string> = {
  'contemporary':
    'contemporary interior design, clean lines, neutral tones, open layout, high-end finishes',
  'industrial':
    'industrial loft interior, exposed brick, metal beams, concrete floors, Edison bulbs',
  'japandi':
    'japandi interior design, wabi-sabi aesthetics, natural materials, warm neutrals, minimal furniture',
  'mid-century-modern':
    'mid-century modern interior, retro furniture, warm wood tones, geometric patterns',
  'minimalist':
    'minimalist interior design, white walls, clean surfaces, essential furniture only, natural light',
  'modern':
    'modern interior design, sleek furniture, warm lighting, neutral palette, photorealistic',
  'rustic':
    'rustic interior design, reclaimed wood, stone fireplace, cozy textiles, warm ambient lighting',
  'scandinavian':
    'scandinavian interior design, light wood, white walls, hygge atmosphere, functional furniture',
  'traditional':
    'traditional interior design, classic furniture, rich fabrics, crown molding, elegant decor',
};

// ─── Helper ─────────────────────────────────────────────────────────

function buildPrompt(request: RenderRequest): string {
  const parts: string[] = [];

  if (request.prompt) {
    parts.push(request.prompt);
  }

  if (request.renderStyle) {
    parts.push(STYLE_PROMPTS[request.renderStyle]);
  }

  if (request.roomType) {
    parts.push(`${request.roomType.replaceAll('-', ' ')} room`);
  }

  parts.push('professional architectural photography, 8k, ultra-detailed');

  return parts.join(', ');
}

function selectModel(operation: RenderOperation): string {
  switch (operation) {
    case 'floor-plan-to-room': {
      return FAL_MODELS.controlnetDepth;
    }
    case 'image-to-image':
    case 'virtual-staging': {
      return FAL_MODELS.controlnetCanny;
    }
    case 'inpainting': {
      return FAL_MODELS.inpaint;
    }
    case 'style-transfer': {
      return FAL_MODELS.ipAdapter;
    }
    case 'upscale': {
      return FAL_MODELS.realEsrgan;
    }
  }
}

// ─── Retry Logic ───────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on client errors (4xx)
      if (lastError.message.includes('(4')) break;

      if (attempt < retries - 1) {
        const delay = RETRY_BASE_DELAY_MS * 2 ** attempt;
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }
  }
  throw lastError;
}

// ─── Fal.ai SDK Client ─────────────────────────────────────────────

function getFalClient() {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    throw new Error('FAL_API_KEY environment variable is not set');
  }
  return createFalClient({ credentials: falKey });
}

interface FalInput {
  control_image_url?: string;
  guidance_scale?: number;
  image_url?: string;
  mask_url?: string;
  num_inference_steps?: number;
  prompt?: string;
  seed?: number;
  strength?: number;
}

interface FalOutput {
  image?: { url: string };
  images?: Array<{ url: string }>;
  seed?: number;
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Execute an AI rendering operation via Fal.ai SDK with retry logic.
 */
export async function render(request: RenderRequest): Promise<RenderResult> {
  const startTime = Date.now();
  const modelId = selectModel(request.operation);
  const prompt = buildPrompt(request);
  const seed = request.seed ?? Math.floor(Math.random() * 2_147_483_647);

  const guidanceScale = request.guidanceScale ?? 7.5;
  const numInferenceSteps = request.numInferenceSteps ?? 30;
  const strength = request.strength ?? 0.75;

  try {
    const input: FalInput = {
      guidance_scale: guidanceScale,
      num_inference_steps: numInferenceSteps,
      prompt,
      seed,
      strength,
    };

    // Set image fields based on operation
    if (request.operation === 'upscale') {
      // Esrgan only needs image_url — no prompt/steps/guidance needed
      const fal = getFalClient();
      const result = await withRetry(
        () => fal.subscribe(modelId, { input: { image_url: request.imageUrl } }) as Promise<{ data: FalOutput }>,
      );
      const imageUrl = result.data.image?.url ?? result.data.images?.[0]?.url;
      if (!imageUrl) throw new Error('No image returned from Fal.ai upscale');
      return {
        duration: Date.now() - startTime,
        imageUrl,
        metadata: { dimensions: { height: 0, width: 0 }, model: modelId, parameters: { guidanceScale, numInferenceSteps, strength } },
        operation: request.operation,
        seed,
        success: true,
      };
    } else if (request.operation === 'inpainting') {
      input.image_url = request.imageUrl;
      input.mask_url = request.maskUrl;
    } else {
      // ControlNet operations use control_image_url
      input.control_image_url = request.imageUrl;
      input.image_url = request.imageUrl;
    }

    const fal = getFalClient();
    const result = await withRetry(
      () => fal.subscribe(modelId, { input }) as Promise<{ data: FalOutput }>,
    );

    const imageUrl = result.data.images?.[0]?.url ?? result.data.image?.url;
    if (!imageUrl) {
      throw new Error('No image returned from Fal.ai');
    }

    const metadata: RenderMetadata = {
      dimensions: {
        height: request.height ?? 1024,
        width: request.width ?? 1024,
      },
      model: modelId,
      parameters: {
        guidanceScale,
        numInferenceSteps,
        strength,
      },
    };

    if (request.roomType) {
      metadata.detectedRoomType = request.roomType;
    }
    if (request.furnitureStyle) {
      metadata.detectedFurnitureStyle = request.furnitureStyle;
    }

    return {
      duration: Date.now() - startTime,
      imageUrl,
      metadata,
      operation: request.operation,
      seed: result.data.seed ?? seed,
      success: true,
    };
  } catch (error) {
    return {
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown rendering error',
      imageUrl: '',
      metadata: {
        dimensions: { height: 0, width: 0 },
        model: modelId,
        parameters: { guidanceScale, numInferenceSteps, strength },
      },
      operation: request.operation,
      seed,
      success: false,
    };
  }
}

/**
 * Render with image-to-image ControlNet (preserves spatial layout).
 */
export async function imageToImage(
  imageUrl: string,
  renderStyle: RenderStyle,
  prompt?: string,
): Promise<RenderResult> {
  return render({
    imageUrl,
    operation: 'image-to-image',
    prompt,
    renderStyle,
  });
}

/**
 * Inpaint a masked region of an image.
 */
export async function inpaint(
  imageUrl: string,
  maskUrl: string,
  prompt: string,
  renderStyle?: RenderStyle,
): Promise<RenderResult> {
  return render({
    imageUrl,
    maskUrl,
    operation: 'inpainting',
    prompt,
    renderStyle,
  });
}

/**
 * Upscale an image using Real-ESRGAN.
 */
export async function upscale(imageUrl: string): Promise<RenderResult> {
  return render({
    imageUrl,
    operation: 'upscale',
  });
}
