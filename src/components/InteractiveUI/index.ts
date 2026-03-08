/**
 * Interactive UI — Phase 1 & 2 Components
 *
 * Public API for the InteractiveUI component library.
 * See docs/prd/prd-interactive-generative-ui.md for full specification.
 */

// Phase 1: Interactive Images
export { default as InteractiveImage } from './InteractiveImage';

// Phase 2: Generative Diagrams
export { AnimationController, DiagramRenderer } from './GenerativeDiagram';

// Shared components
export { default as ComparisonSlider } from './shared/ComparisonSlider';
export { default as LegendBar } from './shared/LegendBar';
export { default as LoadingState } from './shared/LoadingState';

// Phase 1 Types
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

// Phase 2 Types
export type {
  AnimationControllerProps,
  AnimationStep,
  ComparisonItem,
  DiagramData,
  DiagramEdge,
  DiagramNode,
  DiagramRendererProps,
  DiagramType,
  PlaybackState,
  SimulationParam,
  TimelineEvent,
} from './GenerativeDiagram/types';
