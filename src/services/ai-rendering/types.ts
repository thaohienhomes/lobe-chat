/**
 * AI Rendering & Virtual Staging — Type Definitions
 *
 * Phase 3: "See Your Space"
 * See docs/prd/prd-interactive-generative-ui.md Section 5.4
 */

// ─── Render Style ───────────────────────────────────────────────────

/** Supported rendering styles for AI image generation */
export type RenderStyle =
  | 'contemporary'
  | 'industrial'
  | 'japandi'
  | 'mid-century-modern'
  | 'minimalist'
  | 'modern'
  | 'rustic'
  | 'scandinavian'
  | 'traditional';

/** Room types detectable from floor plans or photos */
export type RoomType =
  | 'bathroom'
  | 'bedroom'
  | 'dining-room'
  | 'kitchen'
  | 'living-room'
  | 'office'
  | 'studio';

/** Furniture style presets for virtual staging */
export type FurnitureStyle =
  | 'bohemian'
  | 'classic'
  | 'coastal'
  | 'luxury'
  | 'minimal'
  | 'modern'
  | 'scandinavian';

// ─── Render Request ─────────────────────────────────────────────────

/** The type of rendering operation to perform */
export type RenderOperation =
  | 'floor-plan-to-room'
  | 'image-to-image'
  | 'inpainting'
  | 'style-transfer'
  | 'upscale'
  | 'virtual-staging';

/** Request payload for AI rendering */
export interface RenderRequest {
  /** Furniture style for virtual staging (required for virtual-staging operation) */
  furnitureStyle?: FurnitureStyle;
  /** Guidance scale for diffusion model (1-20, default 7.5) */
  guidanceScale?: number;
  /** Height of the output image in pixels */
  height?: number;
  /** URL of the source image to transform */
  imageUrl: string;
  /** Mask image URL for inpainting (required for inpainting operation) */
  maskUrl?: string;
  /** Number of inference steps (10-50, default 30) */
  numInferenceSteps?: number;
  /** The rendering operation to perform */
  operation: RenderOperation;
  /** Additional text prompt to guide generation */
  prompt?: string;
  /** Target render style */
  renderStyle?: RenderStyle;
  /** Room type hint (auto-detected if not provided) */
  roomType?: RoomType;
  /** Seed for reproducible results */
  seed?: number;
  /** Strength of transformation (0-1, default 0.75) */
  strength?: number;
  /** Width of the output image in pixels */
  width?: number;
}

// ─── Render Result ──────────────────────────────────────────────────

/** Result of an AI rendering operation */
export interface RenderResult {
  /** Duration of the rendering in milliseconds */
  duration: number;
  /** Error message if rendering failed */
  error?: string;
  /** URL of the rendered image */
  imageUrl: string;
  /** Metadata about the rendering */
  metadata: RenderMetadata;
  /** The operation that was performed */
  operation: RenderOperation;
  /** Seed used for generation (for reproducibility) */
  seed: number;
  /** Whether the rendering succeeded */
  success: boolean;
}

/** Metadata attached to a render result */
export interface RenderMetadata {
  /** Detected furniture style (for virtual staging) */
  detectedFurnitureStyle?: FurnitureStyle;
  /** Detected room type */
  detectedRoomType?: RoomType;
  /** Output image dimensions */
  dimensions: { height: number; width: number };
  /** The Fal.ai model used */
  model: string;
  /** Rendering parameters used */
  parameters: {
    guidanceScale: number;
    numInferenceSteps: number;
    strength: number;
  };
}

// ─── Virtual Staging Pipeline ───────────────────────────────────────

/** Configuration for the virtual staging pipeline */
export interface StagingConfig {
  /** Furniture style to use */
  furnitureStyle: FurnitureStyle;
  /** Whether to preserve existing furniture */
  preserveExisting?: boolean;
  /** Render style for the overall room */
  renderStyle: RenderStyle;
  /** Room type (auto-detected if not provided) */
  roomType?: RoomType;
}

/** Result of the room detection step */
export interface RoomDetectionResult {
  /** Confidence score (0-1) */
  confidence: number;
  /** Detected room type */
  roomType: RoomType;
  /** Suggested furniture styles for this room type */
  suggestedStyles: FurnitureStyle[];
}

// ─── Floor Plan Renderer ────────────────────────────────────────────

/** Options for floor plan to rendered room conversion */
export interface FloorPlanRenderOptions {
  /** Camera angle for the render */
  cameraAngle?: 'birds-eye' | 'corner' | 'eye-level';
  /** Furniture style */
  furnitureStyle?: FurnitureStyle;
  /** Time of day for lighting */
  lighting?: 'day' | 'evening' | 'night';
  /** Target room to render (if floor plan has multiple rooms) */
  targetRoom?: string;
  /** Render style */
  viewStyle: RenderStyle;
}

// ─── API Route Types ────────────────────────────────────────────────

/** POST body for /api/ai-render endpoint */
export interface AIRenderRequestBody {
  /** Furniture style for staging */
  furnitureStyle?: FurnitureStyle;
  /** Source image URL */
  imageUrl: string;
  /** Render operation */
  operation?: RenderOperation;
  /** Additional prompt */
  prompt?: string;
  /** Target render style */
  renderStyle: RenderStyle;
  /** Room type hint */
  roomType?: RoomType;
}

/** Response from /api/ai-render endpoint */
export interface AIRenderResponse {
  /** Duration in milliseconds */
  duration?: number;
  /** Error message on failure */
  error?: string;
  /** URL of the rendered image */
  imageUrl?: string;
  /** Whether the request succeeded */
  success: boolean;
}

// ─── BeforeAfterView Props ──────────────────────────────────────────

/** Props for the BeforeAfterView component */
export interface BeforeAfterViewProps {
  /** Alt text for the after image */
  afterAlt?: string;
  /** Label for the after side */
  afterLabel?: string;
  /** URL of the after (rendered) image, null if not yet rendered */
  afterSrc: string | null;
  /** Alt text for the before image */
  beforeAlt?: string;
  /** Label for the before side */
  beforeLabel?: string;
  /** URL of the before (original) image */
  beforeSrc: string;
  /** Callback when render button is clicked */
  onRender?: (style: RenderStyle) => void;
  /** Current render style selection */
  renderStyle?: RenderStyle;
}
