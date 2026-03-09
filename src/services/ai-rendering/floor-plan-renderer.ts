/**
 * Floor Plan Renderer
 *
 * Converts 2D floor plan images into 3D-like rendered rooms
 * using ControlNet depth conditioning.
 *
 * Phase 3: "See Your Space"
 */

import { render } from './fal-client';
import type { FloorPlanRenderOptions, RenderResult, RenderStyle } from './types';

// ─── Camera Angle Prompts ───────────────────────────────────────────

const CAMERA_PROMPTS: Record<NonNullable<FloorPlanRenderOptions['cameraAngle']>, string> = {
  'birds-eye': 'top-down birds eye view, isometric perspective, architectural visualization',
  'corner': 'corner view, wide angle, interior architectural photography, two-point perspective',
  'eye-level': 'eye-level perspective, interior photography, natural viewpoint, one-point perspective',
};

// ─── Lighting Prompts ───────────────────────────────────────────────

const LIGHTING_PROMPTS: Record<NonNullable<FloorPlanRenderOptions['lighting']>, string> = {
  day: 'bright natural daylight, sun streaming through windows, warm natural tones',
  evening: 'warm evening light, golden hour, ambient table lamps, cozy atmosphere',
  night: 'nighttime interior, warm artificial lighting, city view through windows, ambient mood',
};

// ─── Floor Plan Rendering ───────────────────────────────────────────

/**
 * Build the full prompt for floor plan → rendered room conversion.
 */
function buildFloorPlanPrompt(options: FloorPlanRenderOptions): string {
  const cameraAngle = options.cameraAngle ?? 'corner';
  const lighting = options.lighting ?? 'day';

  const parts = [
    'photorealistic interior render from floor plan',
    CAMERA_PROMPTS[cameraAngle],
    LIGHTING_PROMPTS[lighting],
    'furnished room, realistic materials and textures',
    'professional architectural visualization, 8k, ultra-detailed',
  ];

  if (options.targetRoom) {
    parts.push(`focus on the ${options.targetRoom}`);
  }

  return parts.join(', ');
}

/**
 * Render a floor plan into a 3D-like room visualization
 * using ControlNet depth conditioning.
 */
export async function renderFloorPlan(
  floorPlanUrl: string,
  options: FloorPlanRenderOptions,
): Promise<RenderResult> {
  const prompt = buildFloorPlanPrompt(options);

  return render({
    furnitureStyle: options.furnitureStyle,
    imageUrl: floorPlanUrl,
    operation: 'floor-plan-to-room',
    prompt,
    renderStyle: options.viewStyle,
    strength: 0.85, // Higher strength for floor plan → room transformation
  });
}

/**
 * Quick render with sensible defaults.
 */
export async function quickRenderFloorPlan(
  floorPlanUrl: string,
  viewStyle: RenderStyle = 'modern',
): Promise<RenderResult> {
  return renderFloorPlan(floorPlanUrl, {
    cameraAngle: 'corner',
    lighting: 'day',
    viewStyle,
  });
}
