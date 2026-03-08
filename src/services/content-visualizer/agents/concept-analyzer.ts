/**
 * Agent 2: ConceptAnalyzer
 * Identifies visualizable concepts per section and determines best visualization type.
 * Outputs ConceptMap matching the schema in types/concept-map.ts.
 */

import type { ContentSection, ParsedContent } from '../types/parsed-content';
import type { Concept, ConceptMap, RenderTrack, VisualizationType } from '../types/concept-map';

/**
 * LLM call function signature — injected by the orchestrator.
 */
export type LlmCallFn = (systemPrompt: string, userMessage: string) => Promise<string>;

/**
 * Minimum average score threshold for concept selection.
 */
const SCORE_THRESHOLD = 7;

/**
 * System prompt for ConceptAnalyzer — copied exactly from PRD section 2.2.
 */
export const CONCEPT_ANALYZER_PROMPT = `You are an expert educational content analyst for Pho.Chat.
Given a section of academic/educational content, identify concepts that benefit from
visual explanation. For each, determine the optimal visualization type.

VISUALIZATION TYPES:
- structural_diagram: Labeled parts of a system (anatomy, cell, architecture)
- process_animation: Step-by-step with transitions (algorithm, biological process)
- mathematical_proof: Equation derivation with visual intuition (3Blue1Brown style)
- comparison_chart: Side-by-side or overlay comparison
- interactive_simulation: User-adjustable parameters (physics, statistics)
- timeline: Chronological events or steps
- spatial_map: Geographic or spatial relationships
- data_visualization: Charts, graphs, heatmaps
- flowchart: Decision trees, pipelines, workflows

SELECTION CRITERIA (rate 1-10):
- Visual Benefit: How much does seeing help vs reading?
- Complexity: How hard to understand from text alone?
- Interactivity Value: Would user interaction deepen understanding?
- Feasibility: Can this be accurately rendered in React/SVG or Manim?

Only select concepts scoring >= 7 average.
Output structured JSON matching ConceptMap schema.`;

/**
 * Parse LLM JSON response, stripping markdown code fences if present.
 */
function parseLlmJson<T>(response: string): T {
  const cleaned = response
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

/**
 * Calculate average score for a concept's selection criteria.
 */
function averageScore(scores: Concept['scores']): number {
  return (scores.visualBenefit + scores.complexity + scores.interactivityValue + scores.feasibility) / 4;
}

/**
 * Determine render track based on visualization type and scores.
 *
 * Track Decision Logic (PRD section 2.2):
 * - artifact (primary): Structural diagrams, comparisons, flowcharts, simulations
 * - manim: Math proofs/derivations, complex step-by-step, 3B1B-style
 * - both: Concepts benefiting from both static exploration AND animated walkthrough
 */
function determineRenderTrack(vizType: VisualizationType, scores: Concept['scores']): RenderTrack {
  const artifactTypes: VisualizationType[] = [
    'comparison_chart',
    'data_visualization',
    'flowchart',
    'interactive_simulation',
    'spatial_map',
    'structural_diagram',
    'timeline',
  ];

  const manimTypes: VisualizationType[] = [
    'mathematical_proof',
    'process_animation',
  ];

  if (manimTypes.includes(vizType)) {
    // High interactivity value suggests "both" — user benefits from exploration + animation
    if (scores.interactivityValue >= 8) return 'both';
    return 'manim';
  }

  if (artifactTypes.includes(vizType)) {
    // High complexity with process elements may benefit from animated walkthrough too
    if (scores.complexity >= 9 && scores.visualBenefit >= 9) return 'both';
    return 'artifact';
  }

  return 'artifact';
}

/**
 * Build the user message for a single section analysis.
 */
function buildUserMessage(section: ContentSection): string {
  let message = `## Section: ${section.title}\n\n${section.content}`;

  if (section.equations.length > 0) {
    message += '\n\n### Equations:\n';
    for (const eq of section.equations) {
      message += `- ${eq.id}: ${eq.latex} (${eq.context})\n`;
    }
  }

  if (section.figures.length > 0) {
    message += '\n\n### Figures:\n';
    for (const fig of section.figures) {
      message += `- ${fig.id}: ${fig.caption}\n`;
    }
  }

  if (section.tables.length > 0) {
    message += '\n\n### Tables:\n';
    for (const table of section.tables) {
      message += `- ${table.id}: ${table.caption} (columns: ${table.headers.join(', ')})\n`;
    }
  }

  return message;
}

/**
 * Filter concepts that meet the minimum average score threshold (>= 7).
 */
function filterByThreshold(concepts: Concept[]): Concept[] {
  return concepts.filter((c) => averageScore(c.scores) >= SCORE_THRESHOLD);
}

/**
 * Analyze a single section to produce a ConceptMap.
 */
export async function analyzeSection(
  section: ContentSection,
  llmCall: LlmCallFn,
): Promise<ConceptMap> {
  const userMessage = buildUserMessage(section);
  const response = await llmCall(CONCEPT_ANALYZER_PROMPT, userMessage);

  const parsed = parseLlmJson<{
    concepts: Array<{
      description: string;
      equations?: string[];
      id: string;
      relatedConcepts?: string[];
      renderTrack?: RenderTrack;
      scores: {
        complexity: number;
        feasibility: number;
        interactivityValue: number;
        visualBenefit: number;
      };
      sourceText: string;
      title: string;
      vizType: VisualizationType;
    }>;
    sectionId?: string;
  }>(response);

  const concepts: Concept[] = parsed.concepts.map((raw) => ({
    description: raw.description,
    equations: raw.equations,
    id: raw.id,
    relatedConcepts: raw.relatedConcepts,
    // Use LLM suggestion if provided, otherwise determine from logic
    renderTrack: raw.renderTrack || determineRenderTrack(raw.vizType, raw.scores),
    scores: raw.scores,
    sourceText: raw.sourceText,
    title: raw.title,
    vizType: raw.vizType,
  }));

  return {
    concepts: filterByThreshold(concepts),
    sectionId: section.id,
  };
}

/**
 * Run ConceptAnalyzer agent on all sections of parsed content.
 *
 * @param content - ParsedContent from Agent 1 (ContentIngestion)
 * @param llmCall - LLM function injected by the orchestrator
 * @returns Array of ConceptMaps, one per section with qualifying concepts
 */
export async function runConceptAnalyzer(
  content: ParsedContent,
  llmCall: LlmCallFn,
): Promise<ConceptMap[]> {
  const results: ConceptMap[] = [];

  for (const section of content.sections) {
    const conceptMap = await analyzeSection(section, llmCall);

    // Only include sections that have qualifying concepts
    if (conceptMap.concepts.length > 0) {
      results.push(conceptMap);
    }

    // Recursively analyze subsections
    if (section.subsections) {
      for (const sub of section.subsections) {
        const subMap = await analyzeSection(sub, llmCall);
        if (subMap.concepts.length > 0) {
          results.push(subMap);
        }
      }
    }
  }

  return results;
}
