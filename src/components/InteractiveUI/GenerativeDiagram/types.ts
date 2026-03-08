/**
 * Generative Diagram — Type Definitions
 *
 * Matches schemas defined in docs/prd/prd-interactive-generative-ui.md (Section 5.2).
 * These types define the contract between AI-generated diagram code and the
 * DiagramRenderer / AnimationController components.
 */

// ─── Diagram Type Classification ────────────────────────────────────

export type DiagramType =
  | 'comparison'
  | 'map_based'
  | 'process_flow'
  | 'simulation'
  | 'structural'
  | 'timeline';

// ─── Diagram Node / Element ─────────────────────────────────────────

/** A single element in a structural or process diagram */
export interface DiagramNode {
  /** CSS colour for the node */
  color: string;
  /** Detailed description shown on click */
  description?: string;
  /** Unique node id */
  id: string;
  /** Display label */
  label: string;
  /** Position (percentage-based, 0-100) */
  position: { x: number; y: number };
  /** Optional size override */
  size?: { height: number; width: number };
}

/** A connection between two nodes (for process/flow diagrams) */
export interface DiagramEdge {
  /** Arrow colour */
  color?: string;
  /** Source node id */
  from: string;
  /** Unique edge id */
  id: string;
  /** Optional label on the edge */
  label?: string;
  /** Target node id */
  to: string;
}

// ─── Animation Step ─────────────────────────────────────────────────

/** A single step in an animated diagram sequence */
export interface AnimationStep {
  /** Description of what happens in this step */
  description: string;
  /** Duration in milliseconds (default: 1000) */
  duration?: number;
  /** IDs of edges highlighted in this step */
  highlightEdges?: string[];
  /** IDs of nodes highlighted in this step */
  highlightNodes?: string[];
  /** Step index (0-based) */
  index: number;
  /** Step title shown in controls */
  title: string;
}

// ─── Comparison Item ────────────────────────────────────────────────

/** A single item in a comparison diagram */
export interface ComparisonItem {
  /** CSS colour for the item card */
  color: string;
  /** Unique item id */
  id: string;
  /** Display label */
  label: string;
  /** Key-value properties to compare */
  properties: Record<string, string | number>;
}

// ─── Timeline Event ─────────────────────────────────────────────────

/** A single event in a timeline diagram */
export interface TimelineEvent {
  /** CSS colour for the event marker */
  color: string;
  /** Date label (free text, e.g. "1945", "March 2024") */
  date: string;
  /** Event description */
  description: string;
  /** Unique event id */
  id: string;
  /** Event title */
  title: string;
}

// ─── Simulation Parameter ───────────────────────────────────────────

/** A tunable parameter in a simulation diagram */
export interface SimulationParam {
  /** Unique param id */
  id: string;
  /** Display label */
  label: string;
  /** Maximum value */
  max: number;
  /** Minimum value */
  min: number;
  /** Step increment */
  step: number;
  /** Unit label (e.g. "VND", "%", "units") */
  unit?: string;
  /** Current/default value */
  value: number;
}

// ─── Top-level Diagram Data ─────────────────────────────────────────

/** Structured data for a generative diagram */
export interface DiagramData {
  /** Animation steps (for process_flow & structural with animation) */
  animationSteps?: AnimationStep[];
  /** Comparison items (for comparison type) */
  comparisonItems?: ComparisonItem[];
  /** Free-text description for accessibility */
  context: string;
  /** Edges/connections between nodes */
  edges?: DiagramEdge[];
  /** SVG/React code string to render (when AI generates raw code) */
  generatedCode?: string;
  /** Nodes/elements in the diagram */
  nodes?: DiagramNode[];
  /** Simulation parameters (for simulation type) */
  simulationParams?: SimulationParam[];
  /** Timeline events (for timeline type) */
  timelineEvents?: TimelineEvent[];
  /** Diagram title */
  title: string;
  /** Classification of the diagram */
  type: DiagramType;
}

// ─── Component Props ────────────────────────────────────────────────

/** Props for the DiagramRenderer component */
export interface DiagramRendererProps {
  /** The diagram data to render */
  data: DiagramData;
  /** Callback when a node is clicked */
  onNodeClick?: (node: DiagramNode) => void;
}

/** Props for the AnimationController component */
export interface AnimationControllerProps {
  /** Whether to auto-play on mount */
  autoPlay?: boolean;
  /** Callback when active step changes */
  onStepChange?: (step: AnimationStep) => void;
  /** Animation steps to control */
  steps: AnimationStep[];
}

/** Playback state for animation controls */
export type PlaybackState = 'idle' | 'paused' | 'playing';
