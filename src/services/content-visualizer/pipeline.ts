/**
 * Content Visualizer Pipeline Orchestrator
 * Main pipeline: input -> ContentIngestion -> ConceptAnalyzer -> VisualizationPlanner
 * -> ReactArtifactGenerator -> QualityValidator -> AssemblyOrchestrator -> output
 */

import type { ContentVisualizerArtifact } from './types/content-visualizer-artifact';
import type { ConceptMap } from './types/concept-map';
import type { GeneratedCode } from './types/generated-code';
import type { ParsedContent } from './types/parsed-content';
import type { Storyboard } from './types/storyboard';

import { runConceptAnalyzer } from './agents/concept-analyzer';
import { type ContentIngestionInput, runContentIngestion } from './agents/content-ingestion';
import { runQualityValidator } from './agents/quality-validator';
import { runVisualizationPlanner } from './agents/visualization-planner';
import { type AssemblyInput, runAssemblyOrchestrator } from './agents/assembly-orchestrator';

/**
 * LLM call function signature — injected by the caller.
 */
export type LlmCallFn = (systemPrompt: string, userMessage: string) => Promise<string>;

/**
 * Pipeline progress stages.
 */
export type PipelineStage =
  | 'analysis'
  | 'assembling'
  | 'generating'
  | 'ingestion'
  | 'planning'
  | 'validating';

/**
 * Progress callback for pipeline status updates.
 */
export type ProgressCallback = (stage: PipelineStage, percent: number) => void;

/**
 * Pipeline input — wraps ContentIngestionInput with pipeline options.
 */
export interface PipelineInput extends ContentIngestionInput {
  /** Use LLM judge for quality scoring (slower, more accurate) */
  useAsyncScoring?: boolean;
}

/**
 * Pipeline output with intermediate results for debugging.
 */
export interface PipelineOutput {
  artifact: ContentVisualizerArtifact;
  codeResults: GeneratedCode[];
  conceptMaps: ConceptMap[];
  parsedContent: ParsedContent;
  storyboards: Storyboard[];
}

/**
 * Run the full Content Visualizer pipeline.
 *
 * @param input - Pipeline input (URL, PDF, text, or topic)
 * @param llmCall - LLM function for agents that need it
 * @param onProgress - Optional progress callback
 * @returns PipelineOutput with final artifact and intermediate results
 */
export async function runPipeline(
  input: PipelineInput,
  llmCall: LlmCallFn,
  onProgress?: ProgressCallback,
): Promise<PipelineOutput> {
  // Stage 1: Content Ingestion
  onProgress?.('ingestion', 5);
  const parsedContent = await runContentIngestion(input, llmCall);

  // Stage 2: Concept Analysis (across all sections)
  onProgress?.('analysis', 15);
  const conceptMaps = await runConceptAnalyzer(parsedContent, llmCall);

  // Stage 3: Visualization Planning
  onProgress?.('planning', 30);
  const language = parsedContent.metadata.language || input.language || 'en';
  const difficulty = parsedContent.metadata.difficulty || 'intermediate';
  const storyboards = await runVisualizationPlanner(
    conceptMaps,
    language,
    difficulty,
    llmCall,
  );

  // Stage 4+5: Code Generation + Quality Validation (combined in QualityValidator)
  onProgress?.('validating', 50);
  const validationResults = await runQualityValidator(
    storyboards,
    llmCall,
    input.useAsyncScoring,
  );

  // Extract validated code results
  const codeResults = validationResults.map((vr) => vr.code);

  // Stage 6: Assembly
  onProgress?.('assembling', 90);
  const assemblyInput: AssemblyInput = {
    codeResults,
    conceptMaps,
    parsedContent,
  };
  const artifact = runAssemblyOrchestrator(assemblyInput);

  onProgress?.('assembling', 100);

  return {
    artifact,
    codeResults,
    conceptMaps,
    parsedContent,
    storyboards,
  };
}
