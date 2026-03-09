/**
 * Virtual Staging Pipeline
 *
 * Transforms empty/unfurnished room photos into staged previews:
 * 1. Detect room type from the image
 * 2. Select appropriate furniture style
 * 3. Generate staged image via ControlNet
 *
 * Phase 3: "See Your Space"
 */

import { render } from './fal-client';
import type {
  FurnitureStyle,
  RenderResult,
  RenderStyle,
  RoomDetectionResult,
  RoomType,
  StagingConfig,
} from './types';

// ─── Room Type → Suggested Furniture ────────────────────────────────

const ROOM_FURNITURE_MAP: Record<RoomType, FurnitureStyle[]> = {
  'bathroom': ['modern', 'minimal', 'scandinavian'],
  'bedroom': ['scandinavian', 'modern', 'bohemian', 'classic'],
  'dining-room': ['modern', 'scandinavian', 'classic', 'luxury'],
  'kitchen': ['modern', 'scandinavian', 'minimal'],
  'living-room': ['modern', 'scandinavian', 'bohemian', 'classic', 'coastal'],
  'office': ['modern', 'minimal', 'scandinavian'],
  'studio': ['modern', 'minimal', 'bohemian'],
};

// ─── Room-specific Prompts ──────────────────────────────────────────

const ROOM_STAGING_PROMPTS: Record<RoomType, string> = {
  'bathroom': 'staged bathroom with vanity, mirror, towels, plants, clean tiles',
  'bedroom': 'staged bedroom with bed, nightstands, lamps, artwork, throw pillows, area rug',
  'dining-room': 'staged dining room with dining table, chairs, centerpiece, pendant light, sideboard',
  'kitchen': 'staged kitchen with bar stools, pendant lights, countertop accessories, fresh plants',
  'living-room': 'staged living room with sofa, coffee table, area rug, floor lamp, wall art, throw pillows',
  'office': 'staged home office with desk, ergonomic chair, bookshelf, desk lamp, plants',
  'studio': 'staged studio apartment with convertible furniture, room divider, multifunctional space',
};

const FURNITURE_STYLE_PROMPTS: Record<FurnitureStyle, string> = {
  bohemian: 'bohemian eclectic style, colorful textiles, macrame, layered rugs, global accents',
  classic: 'classic traditional style, tufted furniture, dark wood, crown molding, symmetrical layout',
  coastal: 'coastal beach style, white and blue palette, wicker furniture, nautical accents, linen fabrics',
  luxury: 'luxury high-end style, marble surfaces, gold accents, velvet upholstery, statement chandelier',
  minimal: 'minimal style, clean lines, monochrome palette, functional pieces, negative space',
  modern: 'modern contemporary style, sleek furniture, neutral palette, clean geometry, warm accents',
  scandinavian: 'scandinavian style, light wood, white walls, cozy textiles, simple functional design',
};

// ─── Room Detection ─────────────────────────────────────────────────

/**
 * Detect room type from image URL using heuristics.
 * In production, this would call a vision model for classification.
 * For now, returns a default with suggested styles.
 */
export function detectRoomType(roomTypeHint?: RoomType): RoomDetectionResult {
  const roomType = roomTypeHint ?? 'living-room';
  return {
    confidence: roomTypeHint ? 0.95 : 0.7,
    roomType,
    suggestedStyles: ROOM_FURNITURE_MAP[roomType],
  };
}

/**
 * Get suggested furniture styles for a given room type.
 */
export function getSuggestedStyles(roomType: RoomType): FurnitureStyle[] {
  return ROOM_FURNITURE_MAP[roomType] ?? ROOM_FURNITURE_MAP['living-room'];
}

// ─── Staging Pipeline ───────────────────────────────────────────────

/**
 * Build the full prompt for virtual staging.
 */
function buildStagingPrompt(config: StagingConfig): string {
  const detection = detectRoomType(config.roomType);
  const roomPrompt = ROOM_STAGING_PROMPTS[detection.roomType];
  const furniturePrompt = FURNITURE_STYLE_PROMPTS[config.furnitureStyle];

  const parts = [
    roomPrompt,
    furniturePrompt,
    'professional real estate photography',
    'natural lighting, warm tones',
    'photorealistic, 8k, ultra-detailed',
  ];

  if (config.preserveExisting) {
    parts.push('preserve existing furniture and add complementary pieces');
  }

  return parts.join(', ');
}

/**
 * Run the complete virtual staging pipeline:
 * detect room type → select furniture → generate staged image.
 */
export async function stageRoom(
  imageUrl: string,
  config: StagingConfig,
): Promise<RenderResult> {
  const detection = detectRoomType(config.roomType);
  const prompt = buildStagingPrompt(config);

  const result = await render({
    furnitureStyle: config.furnitureStyle,
    imageUrl,
    operation: 'virtual-staging',
    prompt,
    renderStyle: config.renderStyle,
    roomType: detection.roomType,
    strength: 0.65, // Lower strength to preserve room structure
  });

  // Enrich metadata with detection info
  if (result.success) {
    result.metadata.detectedRoomType = detection.roomType;
    result.metadata.detectedFurnitureStyle = config.furnitureStyle;
  }

  return result;
}

/**
 * Quick staging with sensible defaults.
 */
export async function quickStage(
  imageUrl: string,
  renderStyle: RenderStyle = 'modern',
  roomType?: RoomType,
): Promise<RenderResult> {
  const detection = detectRoomType(roomType);
  const furnitureStyle = detection.suggestedStyles[0];

  return stageRoom(imageUrl, {
    furnitureStyle,
    renderStyle,
    roomType: detection.roomType,
  });
}
