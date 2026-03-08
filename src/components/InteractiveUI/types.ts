/**
 * Interactive UI — Type Definitions
 *
 * Matches schemas defined in docs/prd/prd-interactive-generative-ui.md (Section 5.1).
 * These types are the contract between VisionAnalysisService output and
 * InteractiveImage component rendering.
 */

// ─── Image Type Classification ──────────────────────────────────────

/**
 * The high-level classification of the analysed image.
 * Vision AI returns this so the UI can pick the right overlay style,
 * colour palette, and detail-panel layout.
 */
export type ImageType =
  | 'anatomy'
  | 'cell_diagram'
  | 'chart'
  | 'floor_plan'
  | 'molecule'
  | 'photo';

// ─── Region (clickable hotspot) ─────────────────────────────────────

/**
 * Percentage-based bounding box.
 * All values are 0-100, relative to the image's natural dimensions.
 * This keeps coordinates resolution-independent across viewports.
 */
export interface RegionBounds {
  /** Height as a percentage of the image height (0-100) */
  h: number;
  /** Width as a percentage of the image width (0-100) */
  w: number;
  /** Left offset as a percentage of the image width (0-100) */
  x: number;
  /** Top offset as a percentage of the image height (0-100) */
  y: number;
}

/**
 * A single interactive region detected by the Vision AI.
 * Each region becomes a clickable hotspot on the SVG overlay.
 */
export interface InteractiveRegion {
  /** Percentage-based bounding box */
  bounds: RegionBounds;
  /** CSS colour for the overlay highlight (hex or named) */
  color: string;
  /** Domain-specific key-value pairs (e.g. room area, organ function, chart value) */
  details: Record<string, unknown>;
  /** Suggested follow-up questions the user can ask about this region */
  follow_ups: string[];
  /** Stable identifier, unique within the regions array */
  id: string;
  /** Human-readable label displayed on the hotspot */
  label: string;
}

// ─── Top-level AI Output ────────────────────────────────────────────

/**
 * Structured output returned by VisionAnalysisService.
 * This is the complete JSON blob that Vision AI produces; the
 * InteractiveImage component consumes it directly.
 *
 * Schema matches PRD Section 5.1 exactly.
 */
export interface InteractiveRegions {
  /** Free-text description of the image for accessibility & context panel */
  context: string;
  /** Classification of the source image */
  image_type: ImageType;
  /** Detected interactive regions (hotspots) */
  regions: InteractiveRegion[];
}

// ─── Component Props ────────────────────────────────────────────────

/** Props for the top-level InteractiveImage component */
export interface InteractiveImageProps {
  /** Alt text for the base image */
  alt?: string;
  /** Callback when a follow-up chip is clicked */
  onFollowUp?: (question: string) => void;
  /** Callback when a region is selected/deselected */
  onRegionSelect?: (region: InteractiveRegion | null) => void;
  /** Structured region data from Vision AI */
  regions: InteractiveRegions;
  /** URL or data-URI of the source image */
  src: string;
}

/** Props for the SVG overlay layer */
export interface OverlayLayerProps {
  /** Currently active (clicked) region id */
  activeRegionId?: string | null;
  /** Currently hovered region id */
  hoveredRegionId?: string | null;
  /** Callback when a region is clicked */
  onRegionClick?: (region: InteractiveRegion) => void;
  /** Callback when hover state changes */
  onRegionHover?: (region: InteractiveRegion | null) => void;
  /** Regions to render as hotspots */
  regions: InteractiveRegion[];
}

/** Props for the slide-out detail panel */
export interface DetailPanelProps {
  /** Callback to close the panel */
  onClose?: () => void;
  /** The region whose details are shown, or null when hidden */
  region: InteractiveRegion | null;
}

/** Props for the follow-up suggestion chips */
export interface FollowUpChipsProps {
  /** Callback when a chip is clicked */
  onSelect?: (question: string) => void;
  /** Suggested questions to display */
  questions: string[];
}

/** Props for a single region label badge on the overlay */
export interface RegionLabelProps {
  /** Whether this label is for the active region */
  active?: boolean;
  /** Colour of the hotspot */
  color: string;
  /** Display text */
  label: string;
}

/** Props for the shared LegendBar component */
export interface LegendBarProps {
  /** Callback when a legend item is clicked */
  onItemClick?: (region: InteractiveRegion) => void;
  /** All regions to list in the legend */
  regions: InteractiveRegion[];
}

// ─── Service Types ──────────────────────────────────────────────────

/** Options passed to VisionAnalysisService.analyzeImage() */
export interface VisionAnalysisOptions {
  /** Additional context provided by the user (e.g. "this is a chest X-ray") */
  context?: string;
  /** Override the image type hint (skip auto-detection) */
  imageTypeHint?: ImageType;
  /** Maximum number of regions to detect (default: 20) */
  maxRegions?: number;
  /** Preferred language for labels and follow-ups (default: 'vi') */
  preferredLanguage?: 'en' | 'vi';
}

/** Result wrapper returned by VisionAnalysisService */
export interface VisionAnalysisResult {
  /** The structured region data, or null on failure */
  data: InteractiveRegions | null;
  /** Error message if analysis failed */
  error?: string;
  /** Model that was used for analysis */
  model: string;
  /** Whether analysis succeeded */
  success: boolean;
}
