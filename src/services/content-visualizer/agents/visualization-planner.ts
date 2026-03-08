/**
 * Agent 3: VisualizationPlanner
 * Creates detailed storyboard with scene breakdowns, visual elements,
 * narration, and interaction points from concept maps.
 * Output matches Storyboard interface from types/storyboard.ts.
 */

import type { Concept, ConceptMap, RenderTrack } from '../types/concept-map';
import type { DifficultyLevel } from '../types/parsed-content';
import type { Scene, Storyboard, TargetAudience } from '../types/storyboard';

/**
 * LLM call function signature — injected by the orchestrator.
 */
export type LlmCallFn = (systemPrompt: string, userMessage: string) => Promise<string>;

/**
 * BANNED narration phrases — meta-commentary, not teaching (PRD section 2.3).
 */
const BANNED_PHRASES = [
  'now we display',
  'watch as',
  "let's see",
  'as shown above',
  'in this diagram',
  'the figure shows',
  'the diagram shows',
  'as we can see',
  'looking at the',
  'as illustrated',
];

/**
 * REQUIRED narration patterns — actual teaching (PRD section 2.3).
 */
const REQUIRED_PATTERNS = [
  'the key insight is',
  'this works because',
  'think of it as',
  'imagine you are',
  'the reason this matters is',
];

/**
 * System prompt for VisualizationPlanner.
 */
export const VISUALIZATION_PLANNER_PROMPT = `You are an expert educational visualization planner for Pho.Chat.
Given a concept to visualize, create a detailed storyboard with scenes, visual elements,
narration, and interaction points.

OUTPUT FORMAT: JSON matching the Storyboard schema with fields:
- conceptId: string
- renderTrack: 'artifact' | 'manim' | 'both'
- targetAudience: 'highschool' | 'undergraduate' | 'graduate' | 'professional'
- language: 'vi' | 'en'
- estimatedDuration: number (seconds)
- scenes: array of scene objects

Each scene has:
- sceneNumber, title, purpose (pedagogical goal)
- visualElements: array of { type, description, position: {x, y}, animation?, timing? }
- narration: string that TEACHES, not DESCRIBES
- interactionPoints?: array of { elementId, action, response }
- transitionToNext?: 'fade' | 'slide' | 'morph' | 'none'

PEDAGOGICAL RULES (CRITICAL):

BANNED narration phrases (meta-commentary, NOT teaching):
✘ "Now we display..." / "Watch as..." / "Let's see..."
✘ "As shown above..." / "In this diagram..." / "The figure shows..."

REQUIRED narration patterns (actual teaching):
✔ "The key insight is..." / "This works because..." / "Think of it as..."
✔ "Imagine you are..." / "The reason this matters is..."
✔ Use analogies and real-world examples
✔ Explain WHY, not just WHAT

LANGUAGE RULE: Use Vietnamese narration for Vietnamese content.
Default: explain like a curious high-school student would understand.

Aim for 3-7 scenes per concept. Each scene should build on the previous one.`;

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
 * Map content difficulty to target audience level.
 */
function difficultyToAudience(difficulty: DifficultyLevel): TargetAudience {
  switch (difficulty) {
    case 'advanced': {
      return 'graduate';
    }
    case 'beginner': {
      return 'highschool';
    }
    case 'intermediate': {
      return 'undergraduate';
    }
  }
}

/**
 * Check if narration text contains any banned phrases.
 * Returns the first banned phrase found, or null if clean.
 */
function findBannedPhrase(narration: string): string | null {
  const lower = narration.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}

/**
 * Validate that at least one scene's narration uses a required teaching pattern.
 */
function hasRequiredPattern(scenes: Scene[]): boolean {
  for (const scene of scenes) {
    const lower = scene.narration.toLowerCase();
    for (const pattern of REQUIRED_PATTERNS) {
      if (lower.includes(pattern)) return true;
    }
  }
  return false;
}

/**
 * Validate storyboard narration against pedagogical rules.
 * Returns array of violation messages (empty = valid).
 */
export function validateNarration(scenes: Scene[]): string[] {
  const violations: string[] = [];

  for (const scene of scenes) {
    const banned = findBannedPhrase(scene.narration);
    if (banned) {
      violations.push(
        `Scene ${scene.sceneNumber}: Contains banned phrase "${banned}". ` +
        'Narration must TEACH, not describe visuals.',
      );
    }
  }

  if (!hasRequiredPattern(scenes)) {
    violations.push(
      'No scene uses required teaching patterns. Include at least one of: ' +
      '"The key insight is...", "This works because...", "Think of it as...", ' +
      '"Imagine you are...", "The reason this matters is..."',
    );
  }

  return violations;
}

/**
 * Build user message for a single concept visualization planning.
 */
function buildUserMessage(
  concept: Concept,
  language: string,
  difficulty: DifficultyLevel,
): string {
  let message = `## Concept to Visualize

**Title:** ${concept.title}
**Description:** ${concept.description}
**Source Text:** ${concept.sourceText}
**Visualization Type:** ${concept.vizType}
**Render Track:** ${concept.renderTrack}
**Target Audience:** ${difficultyToAudience(difficulty)}
**Language:** ${language}`;

  if (concept.equations && concept.equations.length > 0) {
    message += '\n\n### Related Equations:\n';
    for (const eq of concept.equations) {
      message += `- ${eq}\n`;
    }
  }

  if (concept.relatedConcepts && concept.relatedConcepts.length > 0) {
    message += '\n\n### Related Concepts:\n';
    for (const rc of concept.relatedConcepts) {
      message += `- ${rc}\n`;
    }
  }

  message += `\n\n### Scores:
- Visual Benefit: ${concept.scores.visualBenefit}/10
- Complexity: ${concept.scores.complexity}/10
- Interactivity Value: ${concept.scores.interactivityValue}/10
- Feasibility: ${concept.scores.feasibility}/10`;

  return message;
}

/**
 * Plan visualization for a single concept.
 * Validates narration against pedagogical rules and retries if violations found (max 1 retry).
 */
export async function planConcept(
  concept: Concept,
  language: string,
  difficulty: DifficultyLevel,
  llmCall: LlmCallFn,
): Promise<Storyboard> {
  const userMessage = buildUserMessage(concept, language, difficulty);
  let response = await llmCall(VISUALIZATION_PLANNER_PROMPT, userMessage);
  let storyboard = parseLlmJson<Storyboard>(response);

  // Ensure required fields
  storyboard.conceptId = concept.id;
  storyboard.renderTrack = concept.renderTrack;
  storyboard.language = (language === 'vi' ? 'vi' : 'en') as 'en' | 'vi';
  storyboard.targetAudience = storyboard.targetAudience || difficultyToAudience(difficulty);

  // Validate narration against pedagogical rules
  const violations = validateNarration(storyboard.scenes);
  if (violations.length > 0) {
    // Retry once with explicit violation feedback
    const retryMessage = `${userMessage}\n\n### NARRATION VIOLATIONS FOUND — FIX THESE:\n${violations.map((v) => `- ${v}`).join('\n')}\n\nRegenerate the storyboard with corrected narration.`;
    response = await llmCall(VISUALIZATION_PLANNER_PROMPT, retryMessage);
    storyboard = parseLlmJson<Storyboard>(response);
    storyboard.conceptId = concept.id;
    storyboard.renderTrack = concept.renderTrack;
    storyboard.language = (language === 'vi' ? 'vi' : 'en') as 'en' | 'vi';
    storyboard.targetAudience = storyboard.targetAudience || difficultyToAudience(difficulty);
  }

  return storyboard;
}

/**
 * Run VisualizationPlanner agent on all concept maps.
 *
 * @param conceptMaps - ConceptMaps from Agent 2 (ConceptAnalyzer)
 * @param language - Content language ('vi' | 'en')
 * @param difficulty - Content difficulty level
 * @param llmCall - LLM function injected by the orchestrator
 * @returns Array of Storyboards, one per qualifying concept
 */
export async function runVisualizationPlanner(
  conceptMaps: ConceptMap[],
  language: string,
  difficulty: DifficultyLevel,
  llmCall: LlmCallFn,
): Promise<Storyboard[]> {
  const storyboards: Storyboard[] = [];

  for (const conceptMap of conceptMaps) {
    for (const concept of conceptMap.concepts) {
      const storyboard = await planConcept(concept, language, difficulty, llmCall);
      storyboards.push(storyboard);
    }
  }

  return storyboards;
}
