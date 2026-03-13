/**
 * Visualizer builtin tool action handlers.
 *
 * These handlers are matched by `transformApiArgumentsToAiState` using the apiName
 * as the key. The key names must match VisualizerApiNames values exactly.
 *
 * - show_widget: Returns confirmation string. Actual rendering is handled client-side
 *   by the VisualizerRenderer component which reads the tool call arguments directly.
 * - visualizer_read_me: Returns design guidelines text for the LLM to follow.
 */
import { StateCreator } from 'zustand/vanilla';

import { ToolStore } from '../../store';

interface ShowWidgetParams {
  i_have_seen_read_me: boolean;
  loading_messages: string[];
  title: string;
  widget_code: string;
}

interface VisualizerReadMeParams {
  modules: string[];
}

const VISUALIZER_GUIDELINES = `# Visualizer Design Guidelines

## General Rules
- Keep background transparent (use CSS variables for theming)
- Use CSS variables: var(--color-text), var(--color-bg), var(--color-accent), var(--color-surface), var(--color-border), var(--color-text-secondary)
- Structure: <style> → HTML content → <script> (script LAST)
- No DOCTYPE, html, head, or body tags
- Use sendPrompt(text) for user interaction back to AI
- Max code size: 500KB

## CDN Libraries Available
- Chart.js: https://cdn.jsdelivr.net/npm/chart.js
- D3.js: https://cdn.jsdelivr.net/npm/d3
- Three.js: https://cdn.jsdelivr.net/npm/three
- Mermaid: https://cdn.jsdelivr.net/npm/mermaid
- Plotly: https://cdn.jsdelivr.net/npm/plotly.js-dist-min
- Any library from: cdnjs.cloudflare.com, cdn.jsdelivr.net, unpkg.com, esm.sh

## Chart Module
- Prefer Chart.js for standard charts (bar, line, pie, doughnut, radar)
- Use responsive: true and maintainAspectRatio: false
- Apply theme colors from CSS variables

## Diagram Module
- Use Mermaid for flowcharts, sequence diagrams, state diagrams
- Or build custom SVG for more control
- Keep text readable (min 12px)

## Interactive Module
- Add hover/click effects for engagement
- Use sendPrompt() for drill-down interactions
- Ensure touch-friendly targets (min 44px)

## Medical Modules (prisma, consort, forest-plot, etc.)
- Follow PRISMA 2020 / CONSORT standards
- Use proper statistical notation
- Include legends and axis labels

## Education Modules (step-by-step, quiz, math-plot)
- Progressive disclosure for step-by-step
- Immediate feedback for quizzes
- MathJax/KaTeX for math rendering

Guidelines loaded for modules: `;

function handleShowWidget(params: ShowWidgetParams) {
  // The actual rendering is done client-side by VisualizerRenderer.
  // This handler just returns a confirmation string that goes back to the LLM
  // as the tool result, so it knows the widget was accepted.
  return `Widget rendered: ${params.title}`;
}

function handleVisualizerReadMe(params: VisualizerReadMeParams) {
  // Return guidelines text as the tool result for the LLM to consume
  return VISUALIZER_GUIDELINES + params.modules.join(', ');
}

export interface VisualizerToolAction {
  // Key names MUST match VisualizerApiNames values
  /* eslint-disable @typescript-eslint/naming-convention */
  show_widget: (params: ShowWidgetParams) => string;
  visualizer_read_me: (params: VisualizerReadMeParams) => string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

export const createVisualizerToolSlice: StateCreator<
  ToolStore,
  [['zustand/devtools', never]],
  [],
  VisualizerToolAction
> = () => ({
  show_widget: handleShowWidget,
  visualizer_read_me: handleVisualizerReadMe,
});
