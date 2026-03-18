/**
 * ModuleManager — resolves module names to their guideline content.
 *
 * Used by `visualizer_read_me` handler in action.ts to return
 * rich, per-module guidelines to the LLM based on requested modules.
 */

// General modules
import { artModule } from './general/art';
import { chartModule } from './general/chart';
import { diagramModule } from './general/diagram';
import { interactiveModule } from './general/interactive';
import { mockupModule } from './general/mockup';

// Medical modules
import { consortModule } from './medical/consort';
import { drugInteractionModule } from './medical/drug-interaction';
import { forestPlotModule } from './medical/forest-plot';
import { kaplanMeierModule } from './medical/kaplan-meier';
import { prismaModule } from './medical/prisma';
import { robAssessmentModule } from './medical/rob-assessment';

// Academic modules
import { citationNetworkModule } from './academic/citation-network';
import { methodologyFlowModule } from './academic/methodology-flow';
import { statsDashboardModule } from './academic/stats-dashboard';

// Education modules
import { mathPlotModule } from './education/math-plot';
import { quizModule } from './education/quiz';
import { stepByStepModule } from './education/step-by-step';

interface VisualizerModule {
  category: string;
  content: string;
  name: string;
}

/** Registry of all available modules keyed by name */
const MODULE_REGISTRY: Record<string, VisualizerModule> = {
  // General
  art: artModule,
  chart: chartModule,
  
// Academic
'citation-network': citationNetworkModule,
  

// Medical
consort: consortModule,
  

diagram: diagramModule,
  
  
'drug-interaction': drugInteractionModule,
  
'forest-plot': forestPlotModule,
  
interactive: interactiveModule,
  
'kaplan-meier': kaplanMeierModule,
  
// Education
'math-plot': mathPlotModule,
  

'methodology-flow': methodologyFlowModule,
  
  
mockup: mockupModule,
  
prisma: prismaModule,
  
quiz: quizModule,
  
  'rob-assessment': robAssessmentModule,
  'stats-dashboard': statsDashboardModule,
  'step-by-step': stepByStepModule,
};

/** Base guidelines included with every module request */
const BASE_GUIDELINES = `# Visualizer Design Guidelines

## General Rules
- Keep background transparent (use CSS variables for theming)
- Use CSS variables: var(--color-text), var(--color-bg), var(--color-accent), var(--color-surface), var(--color-border), var(--color-text-secondary)
- Structure: <style> → HTML content → <script> (script LAST)
- No DOCTYPE, html, head, or body tags — only the inner content
- Use sendPrompt(text) for user interaction back to AI
- Max code size: 500KB
- Always read CSS variables at runtime via getComputedStyle()

## CDN Libraries Available
- Chart.js: https://cdn.jsdelivr.net/npm/chart.js
- D3.js: https://cdn.jsdelivr.net/npm/d3
- Three.js: https://cdn.jsdelivr.net/npm/three
- Mermaid: https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js
- Plotly: https://cdn.jsdelivr.net/npm/plotly.js-dist-min
- KaTeX: https://cdn.jsdelivr.net/npm/katex
- Any library from: cdnjs.cloudflare.com, cdn.jsdelivr.net, unpkg.com, esm.sh

## Theme Integration
Read CSS variables at runtime (not at parse time):
\`\`\`js
var textColor = getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim();
\`\`\`
This ensures correct theming in both light and dark modes.
`;

/**
 * Get combined guideline content for the requested modules.
 * Always includes base guidelines, then appends per-module content.
 */
export function getModuleContent(modules: string[]): string {
  const parts: string[] = [BASE_GUIDELINES];

  for (const name of modules) {
    const mod = MODULE_REGISTRY[name];
    if (mod) {
      parts.push(`\n---\n${mod.content}`);
    }
  }

  if (modules.length === 0) {
    // If no specific modules requested, include all general modules
    for (const mod of Object.values(MODULE_REGISTRY)) {
      if (mod.category === 'general') {
        parts.push(`\n---\n${mod.content}`);
      }
    }
  }

  return parts.join('\n');
}

/** Get list of all available module names */
export function getAvailableModules(): string[] {
  return Object.keys(MODULE_REGISTRY);
}
