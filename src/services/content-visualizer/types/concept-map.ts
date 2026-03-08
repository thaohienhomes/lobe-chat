/**
 * Concept map output from Agent 2: ConceptAnalyzer.
 * Identifies visualizable concepts and determines best visualization type per section.
 */

export type VisualizationType =
  | 'comparison_chart'
  | 'data_visualization'
  | 'flowchart'
  | 'interactive_simulation'
  | 'mathematical_proof'
  | 'process_animation'
  | 'spatial_map'
  | 'structural_diagram'
  | 'timeline';

export type RenderTrack = 'artifact' | 'both' | 'manim';

export interface ConceptScores {
  complexity: number;
  feasibility: number;
  interactivityValue: number;
  visualBenefit: number;
}

export interface Concept {
  description: string;
  equations?: string[];
  id: string;
  relatedConcepts?: string[];
  renderTrack: RenderTrack;
  scores: ConceptScores;
  sourceText: string;
  title: string;
  vizType: VisualizationType;
}

export interface ConceptMap {
  concepts: Concept[];
  sectionId: string;
}
