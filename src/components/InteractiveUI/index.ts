/**
 * Interactive UI — Phase 1: Interactive Images (Tap-to-Explore)
 *
 * Public API for the InteractiveUI component library.
 * See docs/prd/prd-interactive-generative-ui.md for full specification.
 */

// Components
export { default as InteractiveImage } from './InteractiveImage';

// Shared components
export { default as ComparisonSlider } from './shared/ComparisonSlider';
export { default as LegendBar } from './shared/LegendBar';
export { default as LoadingState } from './shared/LoadingState';

// Types — consumed by both components and services
export type {
  DetailPanelProps,
  FollowUpChipsProps,
  ImageType,
  InteractiveImageProps,
  InteractiveRegion,
  InteractiveRegions,
  LegendBarProps,
  OverlayLayerProps,
  RegionBounds,
  RegionLabelProps,
  VisionAnalysisOptions,
  VisionAnalysisResult,
} from './types';
