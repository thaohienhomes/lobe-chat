/**
 * Generative Diagram — Phase 2: Text-to-Interactive
 *
 * Public API for the GenerativeDiagram component library.
 * See docs/prd/prd-interactive-generative-ui.md Section 5.2.
 */

export { default as AnimationController } from './AnimationController';
export { default as DiagramRenderer } from './DiagramRenderer';

// Templates
export { ComparisonTemplate } from './templates';
export { MapBasedTemplate } from './templates';
export { ProcessFlowTemplate } from './templates';
export { SimulationTemplate } from './templates';
export { StructuralTemplate } from './templates';
export { TimelineTemplate } from './templates';

// Types
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
} from './types';
