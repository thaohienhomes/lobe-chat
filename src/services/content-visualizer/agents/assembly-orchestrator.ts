/**
 * Agent 7: AssemblyOrchestrator
 * Deterministic assembler (NOT an LLM agent).
 * Combines all pipeline outputs into the final ContentVisualizerArtifact.
 *
 * Input: ParsedContent + GeneratedCode[] + optional narration/video data
 * Output: ContentVisualizerArtifact matching PRD section 2.7 schema
 */

import type {
  ArtifactLayout,
  ArtifactSection,
  ContentVisualizerArtifact,
  VisualizationEntry,
} from '../types/content-visualizer-artifact';
import type { ConceptMap } from '../types/concept-map';
import type { GeneratedCode } from '../types/generated-code';
import type { ContentSection, ParsedContent } from '../types/parsed-content';

/**
 * Narration data for a concept (from Agent 6, optional).
 */
export interface NarrationData {
  audioUrl?: string;
  conceptId: string;
  narrationText: string;
}

/**
 * Video data for a concept (from Manim Track B, optional).
 */
export interface VideoData {
  conceptId: string;
  videoUrl: string;
}

/**
 * Input bundle for assembly.
 */
export interface AssemblyInput {
  codeResults: GeneratedCode[];
  conceptMaps: ConceptMap[];
  layout?: ArtifactLayout;
  narrations?: NarrationData[];
  parsedContent: ParsedContent;
  videos?: VideoData[];
}

/**
 * Convert markdown content to basic HTML.
 * Handles: headers, bold, italic, code blocks, LaTeX blocks, links, lists.
 */
function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');

  // Inline code (`...`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // LaTeX blocks ($$...$$)
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="katex-block">$1</div>');

  // Inline LaTeX ($...$)
  html = html.replace(/\$([^$]+)\$/g, '<span class="katex-inline">$1</span>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Paragraphs (double newline)
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

/**
 * Build visualization entries for a section by matching concept maps with generated code.
 */
function buildVisualizationEntries(
  sectionId: string,
  conceptMaps: ConceptMap[],
  codeResults: GeneratedCode[],
  narrations?: NarrationData[],
  videos?: VideoData[],
): VisualizationEntry[] {
  // Find concepts belonging to this section
  const sectionConcepts = conceptMaps.find((cm) => cm.sectionId === sectionId);
  if (!sectionConcepts) return [];

  const entries: VisualizationEntry[] = [];

  for (const concept of sectionConcepts.concepts) {
    const codeResult = codeResults.find((cr) => cr.conceptId === concept.id);
    const narration = narrations?.find((n) => n.conceptId === concept.id);
    const video = videos?.find((v) => v.conceptId === concept.id);

    if (!codeResult && !video) continue;

    entries.push({
      artifactCode: codeResult?.track === 'artifact' ? codeResult.code : undefined,
      audioUrl: narration?.audioUrl,
      conceptId: concept.id,
      isInteractive: concept.renderTrack === 'artifact' || concept.renderTrack === 'both',
      narration: narration?.narrationText || codeResult?.narrationScript,
      videoUrl: video?.videoUrl,
    });
  }

  return entries;
}

/**
 * Process a single content section into an artifact section.
 */
function processSection(
  section: ContentSection,
  conceptMaps: ConceptMap[],
  codeResults: GeneratedCode[],
  narrations?: NarrationData[],
  videos?: VideoData[],
): ArtifactSection {
  return {
    contentHtml: markdownToHtml(section.content),
    sectionId: section.id,
    title: section.title,
    visualizations: buildVisualizationEntries(
      section.id,
      conceptMaps,
      codeResults,
      narrations,
      videos,
    ),
  };
}

/**
 * Recursively process sections including subsections.
 */
function processSections(
  sections: ContentSection[],
  conceptMaps: ConceptMap[],
  codeResults: GeneratedCode[],
  narrations?: NarrationData[],
  videos?: VideoData[],
): ArtifactSection[] {
  const result: ArtifactSection[] = [];

  for (const section of sections) {
    result.push(processSection(section, conceptMaps, codeResults, narrations, videos));

    if (section.subsections && section.subsections.length > 0) {
      result.push(
        ...processSections(section.subsections, conceptMaps, codeResults, narrations, videos),
      );
    }
  }

  return result;
}

/**
 * Determine optimal layout based on content characteristics.
 */
function determineLayout(
  parsedContent: ParsedContent,
  codeResults: GeneratedCode[],
): ArtifactLayout {
  const hasMultipleSections = parsedContent.sections.length >= 3;
  const hasInteractiveViz = codeResults.some((cr) => cr.track === 'artifact');

  // Scrollytelling for long-form content with visualizations
  if (hasMultipleSections && hasInteractiveViz) return 'scrollytelling';

  // Presentation for shorter content (1-2 sections)
  if (!hasMultipleSections) return 'presentation';

  // Explorer for content without strong narrative flow
  return 'explorer';
}

/**
 * Assemble the final ContentVisualizerArtifact.
 * Deterministic — no LLM calls, purely data transformation.
 *
 * @param input - AssemblyInput with all pipeline outputs
 * @returns ContentVisualizerArtifact ready for rendering
 */
export function assembleArtifact(input: AssemblyInput): ContentVisualizerArtifact {
  const {
    codeResults,
    conceptMaps,
    layout,
    narrations,
    parsedContent,
    videos,
  } = input;

  const sections = processSections(
    parsedContent.sections,
    conceptMaps,
    codeResults,
    narrations,
    videos,
  );

  return {
    layout: layout || determineLayout(parsedContent, codeResults),
    metadata: parsedContent.metadata,
    sections,
  };
}

/**
 * Run AssemblyOrchestrator — main entry point.
 * Alias for assembleArtifact for consistency with other agent exports.
 */
export function runAssemblyOrchestrator(input: AssemblyInput): ContentVisualizerArtifact {
  return assembleArtifact(input);
}
