/**
 * Fal.ai Client — AI Rendering Integration
 *
 * Provides ControlNet image-to-image, inpainting, virtual staging,
 * and upscaling via the Fal.ai API.
 *
 * Phase 3: "See Your Space"
 */

import type {
  RenderMetadata,
  RenderOperation,
  RenderRequest,
  RenderResult,
  RenderStyle,
} from './types';

// ─── Fal.ai Model IDs ──────────────────────────────────────────────

const FAL_MODELS = {
  controlnetDepth: 'fal-ai/fast-sdxl-controlnet-depth',
  controlnetInpaint: 'fal-ai/inpaint',
  imageToImage: 'fal-ai/fast-sdxl-controlnet-canny',
  styleTransfer: 'fal-ai/ip-adapter-face-id',
  upscale: 'fal-ai/real-esrgan',
} as const;

// ─── Style → Prompt Mapping ────────────────────────────────────────

const STYLE_PROMPTS: Record<RenderStyle, string> = {
  contemporary: 'contemporary interior design, clean lines, neutral tones, open layout, high-end finishes',
  industrial: 'industrial loft interior, exposed brick, metal beams, concrete floors, Edison bulbs',
  japandi: 'japandi interior design, wabi-sabi aesthetics, natural materials, warm neutrals, minimal furniture',
  'mid-century-modern': 'mid-century modern interior, retro furniture, warm wood tones, geometric patterns',
  minimalist: 'minimalist interior design, white walls, clean surfaces, essential furniture only, natural light',
  modern: 'modern interior design, sleek furniture, warm lighting, neutral palette, photorealistic',
  rustic: 'rustic interior design, reclaimed wood, stone fireplace, cozy textiles, warm ambient lighting',
  scandinavian: 'scandinavian interior design, light wood, white walls, hygge atmosphere, functional furniture',
  traditional: 'traditional interior design, classic furniture, rich fabrics, crown molding, elegant decor',
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
      return FAL_MODELS.imageToImage;
    }
    case 'inpainting': {
      return FAL_MODELS.controlnetInpaint;
    }
    case 'style-transfer': {
      return FAL_MODELS.styleTransfer;
    }
    case 'upscale': {
      return FAL_MODELS.upscale;
    }
  }
}

// ─── Fal.ai API Call ────────────────────────────────────────────────

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

interface FalResponse {
  images?: Array<{ url: string }>;
  image?: { url: string };
  seed?: number;
}

async function callFalApi(modelId: string, input: FalInput): Promise<FalResponse> {
  const falKey = process.env.FAL_KEY;
  if (!falKey) {
    throw new Error('FAL_KEY environment variable is not set');
  }

  const response = await fetch(`https://fal.run/${modelId}`, {
    body: JSON.stringify(input),
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fal.ai API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<FalResponse>;
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Execute an AI rendering operation via Fal.ai.
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
      input.image_url = request.imageUrl;
    } else if (request.operation === 'inpainting') {
      input.image_url = request.imageUrl;
      input.mask_url = request.maskUrl;
    } else {
      // ControlNet operations use control_image_url
      input.control_image_url = request.imageUrl;
      input.image_url = request.imageUrl;
    }

    const result = await callFalApi(modelId, input);

    const imageUrl = result.images?.[0]?.url ?? result.image?.url;
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
      seed: result.seed ?? seed,
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
