/**
 * Agent 4A: ReactArtifactGenerator
 * Generates complete React functional components (.jsx) from storyboards
 * for rendering in the Pho.Chat Artifact engine.
 * Output matches GeneratedCode interface with track='artifact', language='jsx'.
 */

import type { GeneratedCode } from '../types/generated-code';
import type { Storyboard } from '../types/storyboard';

/**
 * LLM call function signature — injected by the orchestrator.
 */
export type LlmCallFn = (systemPrompt: string, userMessage: string) => Promise<string>;

/**
 * System prompt for ReactArtifactGenerator — EXACT copy from PRD section 2.4.
 */
export const REACT_ARTIFACT_GENERATOR_PROMPT = `Generate a complete React functional component that visualizes the storyboard.

CODE STANDARDS:
- Single file, default export, no required props
- Tailwind CSS only (no custom CSS imports)
- useState/useEffect hooks for state and animation
- requestAnimationFrame or CSS transitions for smooth animations
- Mobile responsive (touch support)
- Dark theme (#0F172A family)
- Step-by-step controls (Previous / Next / Play / Pause)
- KaTeX for equations (render as SVG text)
- Hover + click states on all interactive elements
- ARIA labels for accessibility

STRUCTURE:
1. State: currentScene, isPlaying, selectedElement
2. Scene renderer: switch on currentScene
3. Animation controller: step-through or auto-play
4. Detail panel: info on click (Phase 1 InteractiveImage pattern)
5. Navigation: scene dots + prev/next buttons

NEVER use localStorage, sessionStorage, or browser storage APIs.
NEVER import external CSS files.

AVAILABLE LIBRARIES (already in Artifacts):
- React 18+ with hooks
- Tailwind CSS utility classes
- D3.js, Recharts, Chart.js
- Three.js r128
- Lucide React, Lodash, MathJS

OUTPUT: Return ONLY the complete JSX code. No markdown fences. No explanation.
The code must be a self-contained React component with a default export.`;

/**
 * Available libraries in the Artifact engine runtime.
 */
const ARTIFACT_DEPENDENCIES = [
  'react',
  'tailwindcss',
];

/**
 * Build user message describing the storyboard for code generation.
 */
function buildUserMessage(storyboard: Storyboard): string {
  let message = `## Storyboard to Implement

**Concept ID:** ${storyboard.conceptId}
**Render Track:** ${storyboard.renderTrack}
**Target Audience:** ${storyboard.targetAudience}
**Language:** ${storyboard.language}
**Estimated Duration:** ${storyboard.estimatedDuration}s
**Total Scenes:** ${storyboard.scenes.length}

### Scenes:
`;

  for (const scene of storyboard.scenes) {
    message += `\n#### Scene ${scene.sceneNumber}: ${scene.title}
**Purpose:** ${scene.purpose}
**Narration:** ${scene.narration}
**Transition:** ${scene.transitionToNext || 'none'}

**Visual Elements:**
`;
    for (const el of scene.visualElements) {
      message += `- [${el.type}] ${el.description} at (${el.position.x}, ${el.position.y})`;
      if (el.animation) message += ` — animation: ${el.animation}`;
      if (el.timing) message += ` — timing: ${el.timing.start}s + ${el.timing.duration}s`;
      message += '\n';
    }

    if (scene.interactionPoints && scene.interactionPoints.length > 0) {
      message += '\n**Interaction Points:**\n';
      for (const ip of scene.interactionPoints) {
        message += `- [${ip.action}] on "${ip.elementId}": ${ip.response}\n`;
      }
    }
  }

  return message;
}

/**
 * Extract code from LLM response, stripping markdown fences if present.
 */
function extractCode(response: string): string {
  return response
    .replace(/^```(?:jsx|javascript|tsx|js)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

/**
 * Detect additional dependencies used in generated code.
 */
function detectDependencies(code: string): string[] {
  const deps = [...ARTIFACT_DEPENDENCIES];

  if (/\bimport\b.*\bfrom\s+["']d3["']/.test(code) || /\bd3\./.test(code)) deps.push('d3');
  if (/\bimport\b.*\bfrom\s+["']recharts["']/.test(code)) deps.push('recharts');
  if (/\bimport\b.*\bfrom\s+["']chart\.js["']/.test(code)) deps.push('chart.js');
  if (/\bimport\b.*\bfrom\s+["']three["']/.test(code) || /\bTHREE\./.test(code)) deps.push('three');
  if (/\bimport\b.*\bfrom\s+["']lucide-react["']/.test(code)) deps.push('lucide-react');
  if (/\bimport\b.*\bfrom\s+["']lodash["']/.test(code)) deps.push('lodash');
  if (/\bimport\b.*\bfrom\s+["']mathjs["']/.test(code)) deps.push('mathjs');

  return [...new Set(deps)];
}

/**
 * Estimate render time based on scene count and visual elements.
 */
function estimateRenderTime(storyboard: Storyboard): number {
  const baseTime = 0.5; // 500ms base
  const perScene = 0.2;
  const elementCount = storyboard.scenes.reduce(
    (sum, s) => sum + s.visualElements.length,
    0,
  );
  const perElement = 0.05;

  return Math.round((baseTime + storyboard.scenes.length * perScene + elementCount * perElement) * 100) / 100;
}

/**
 * Generate React Artifact code for a single storyboard.
 *
 * @param storyboard - Storyboard from Agent 3 (VisualizationPlanner)
 * @param llmCall - LLM function injected by the orchestrator
 * @returns GeneratedCode with track='artifact', language='jsx'
 */
export async function generateReactArtifact(
  storyboard: Storyboard,
  llmCall: LlmCallFn,
): Promise<GeneratedCode> {
  const userMessage = buildUserMessage(storyboard);
  const response = await llmCall(REACT_ARTIFACT_GENERATOR_PROMPT, userMessage);
  const code = extractCode(response);

  return {
    code,
    conceptId: storyboard.conceptId,
    dependencies: detectDependencies(code),
    estimatedRenderTime: estimateRenderTime(storyboard),
    language: 'jsx',
    narrationScript: storyboard.scenes.map((s) => s.narration).join('\n\n'),
    track: 'artifact',
  };
}

/**
 * Generate React Artifact code with error context for retry attempts.
 *
 * @param storyboard - Original storyboard
 * @param errors - Error messages from previous validation attempt
 * @param attempt - Current attempt number (2 or 3)
 * @param llmCall - LLM function
 * @returns GeneratedCode with fixes applied
 */
export async function generateReactArtifactWithRetry(
  storyboard: Storyboard,
  errors: string[],
  attempt: number,
  llmCall: LlmCallFn,
): Promise<GeneratedCode> {
  let userMessage = buildUserMessage(storyboard);

  userMessage += `\n\n### PREVIOUS ATTEMPT FAILED (Attempt ${attempt}/3)
Fix the following errors from the previous generation:

${errors.map((e) => `- ${e}`).join('\n')}
`;

  if (attempt >= 3) {
    userMessage += `\n### SIMPLIFICATION REQUIRED
This is the FINAL attempt. Simplify the visualization:
- Reduce animations to basic fadeIn only
- Use simple SVG shapes instead of complex graphics
- Minimize interaction points
- Focus on correctly rendering content over visual polish`;
  }

  const response = await llmCall(REACT_ARTIFACT_GENERATOR_PROMPT, userMessage);
  const code = extractCode(response);

  return {
    code,
    conceptId: storyboard.conceptId,
    dependencies: detectDependencies(code),
    estimatedRenderTime: estimateRenderTime(storyboard),
    language: 'jsx',
    narrationScript: storyboard.scenes.map((s) => s.narration).join('\n\n'),
    track: 'artifact',
  };
}

/**
 * Run ReactArtifactGenerator on all artifact-track storyboards.
 *
 * @param storyboards - Storyboards from Agent 3, filtered to artifact/both track
 * @param llmCall - LLM function
 * @returns Array of GeneratedCode for artifact track
 */
export async function runReactArtifactGenerator(
  storyboards: Storyboard[],
  llmCall: LlmCallFn,
): Promise<GeneratedCode[]> {
  const artifactStoryboards = storyboards.filter(
    (sb) => sb.renderTrack === 'artifact' || sb.renderTrack === 'both',
  );

  const results: GeneratedCode[] = [];
  for (const storyboard of artifactStoryboards) {
    const code = await generateReactArtifact(storyboard, llmCall);
    results.push(code);
  }

  return results;
}
