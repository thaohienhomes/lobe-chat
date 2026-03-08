/**
 * ContentVisualizerArtifact — final output from Agent 7: AssemblyOrchestrator.
 * Combines all pipeline outputs into a scrollytelling Artifact structure.
 */

import type { ContentMetadata } from './parsed-content';

export type ArtifactLayout = 'explorer' | 'presentation' | 'scrollytelling';

export interface VisualizationEntry {
  artifactCode?: string;
  audioUrl?: string;
  conceptId: string;
  isInteractive: boolean;
  narration?: string;
  videoUrl?: string;
}

export interface ArtifactSection {
  contentHtml: string;
  sectionId: string;
  title: string;
  visualizations: VisualizationEntry[];
}

export interface QuizQuestion {
  correctIndex: number;
  explanation: string;
  options: string[];
  question: string;
  relatedConceptId: string;
}

export interface ContentVisualizerArtifact {
  layout: ArtifactLayout;
  metadata: ContentMetadata;
  quizQuestions?: QuizQuestion[];
  sections: ArtifactSection[];
}
