import { describe, expect, it } from 'vitest';

import type { ConceptMap } from '../types/concept-map';
import type { GeneratedCode } from '../types/generated-code';
import type { ParsedContent } from '../types/parsed-content';

import {
  type AssemblyInput,
  type NarrationData,
  type VideoData,
  assembleArtifact,
  runAssemblyOrchestrator,
} from './assembly-orchestrator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeParsedContent = (
  sectionCount: number,
  opts?: { content?: string },
): ParsedContent => ({
  metadata: {
    difficulty: 'intermediate',
    language: 'en',
    source: 'text',
    title: 'Test Content',
  },
  sections: Array.from({ length: sectionCount }, (_, i) => ({
    content: opts?.content || `Section ${i + 1} content with **bold** text.`,
    equations: [],
    figures: [],
    id: `s${i + 1}`,
    tables: [],
    title: `Section ${i + 1}`,
  })),
});

const makeConceptMap = (sectionId: string, conceptIds: string[]): ConceptMap => ({
  concepts: conceptIds.map((id) => ({
    description: `Description of ${id}`,
    id,
    renderTrack: 'artifact' as const,
    scores: { complexity: 8, feasibility: 8, interactivityValue: 8, visualBenefit: 8 },
    sourceText: 'Source text',
    title: `Concept ${id}`,
    vizType: 'structural_diagram' as const,
  })),
  sectionId,
});

const makeCodeResult = (conceptId: string, track: 'artifact' | 'manim' = 'artifact'): GeneratedCode => ({
  code: `export default function Viz_${conceptId}() { return <div>Viz</div>; }`,
  conceptId,
  dependencies: ['react'],
  estimatedRenderTime: 1.0,
  language: 'jsx',
  narrationScript: `Narration for ${conceptId}`,
  track,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AssemblyOrchestrator', () => {
  // --------------------------------
  // Deterministic assembly
  // --------------------------------
  describe('assembleArtifact', () => {
    it('assembles artifact with metadata from parsed content', () => {
      const input: AssemblyInput = {
        codeResults: [],
        conceptMaps: [],
        parsedContent: makeParsedContent(1),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.metadata.title).toBe('Test Content');
      expect(artifact.metadata.source).toBe('text');
      expect(artifact.metadata.language).toBe('en');
    });

    it('creates sections from parsed content', () => {
      const input: AssemblyInput = {
        codeResults: [],
        conceptMaps: [],
        parsedContent: makeParsedContent(3),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.sections).toHaveLength(3);
      expect(artifact.sections[0].sectionId).toBe('s1');
      expect(artifact.sections[0].title).toBe('Section 1');
      expect(artifact.sections[2].sectionId).toBe('s3');
    });

    it('matches visualizations to sections by concept map', () => {
      const input: AssemblyInput = {
        codeResults: [makeCodeResult('c1'), makeCodeResult('c2')],
        conceptMaps: [
          makeConceptMap('s1', ['c1']),
          makeConceptMap('s2', ['c2']),
        ],
        parsedContent: makeParsedContent(2),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.sections[0].visualizations).toHaveLength(1);
      expect(artifact.sections[0].visualizations[0].conceptId).toBe('c1');
      expect(artifact.sections[1].visualizations).toHaveLength(1);
      expect(artifact.sections[1].visualizations[0].conceptId).toBe('c2');
    });

    it('includes artifact code only for artifact track', () => {
      const input: AssemblyInput = {
        codeResults: [makeCodeResult('c1', 'artifact')],
        conceptMaps: [makeConceptMap('s1', ['c1'])],
        parsedContent: makeParsedContent(1),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.sections[0].visualizations[0].artifactCode).toBeDefined();
    });

    it('does not include artifact code for manim track', () => {
      const input: AssemblyInput = {
        codeResults: [makeCodeResult('c1', 'manim')],
        conceptMaps: [makeConceptMap('s1', ['c1'])],
        parsedContent: makeParsedContent(1),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.sections[0].visualizations[0].artifactCode).toBeUndefined();
    });

    it('returns empty visualizations for sections without concepts', () => {
      const input: AssemblyInput = {
        codeResults: [makeCodeResult('c1')],
        conceptMaps: [makeConceptMap('s1', ['c1'])],
        parsedContent: makeParsedContent(2),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.sections[0].visualizations).toHaveLength(1);
      expect(artifact.sections[1].visualizations).toHaveLength(0);
    });

    it('includes narration and video data when provided', () => {
      const narrations: NarrationData[] = [
        { audioUrl: 'https://audio.example.com/c1.mp3', conceptId: 'c1', narrationText: 'Custom narration' },
      ];
      const videos: VideoData[] = [
        { conceptId: 'c1', videoUrl: 'https://video.example.com/c1.mp4' },
      ];

      const input: AssemblyInput = {
        codeResults: [makeCodeResult('c1')],
        conceptMaps: [makeConceptMap('s1', ['c1'])],
        narrations,
        parsedContent: makeParsedContent(1),
        videos,
      };

      const artifact = assembleArtifact(input);
      const viz = artifact.sections[0].visualizations[0];

      expect(viz.narration).toBe('Custom narration');
      expect(viz.audioUrl).toBe('https://audio.example.com/c1.mp3');
      expect(viz.videoUrl).toBe('https://video.example.com/c1.mp4');
    });

    it('falls back to narrationScript from generated code when no narration data', () => {
      const input: AssemblyInput = {
        codeResults: [makeCodeResult('c1')],
        conceptMaps: [makeConceptMap('s1', ['c1'])],
        parsedContent: makeParsedContent(1),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.sections[0].visualizations[0].narration).toBe('Narration for c1');
    });
  });

  // --------------------------------
  // Markdown to HTML conversion
  // --------------------------------
  describe('markdown to HTML conversion', () => {
    it('converts bold text', () => {
      const input: AssemblyInput = {
        codeResults: [],
        conceptMaps: [],
        parsedContent: makeParsedContent(1, { content: 'This is **bold** text.' }),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.sections[0].contentHtml).toContain('<strong>bold</strong>');
    });

    it('converts headers', () => {
      const input: AssemblyInput = {
        codeResults: [],
        conceptMaps: [],
        parsedContent: makeParsedContent(1, { content: '# Heading 1\n\n## Heading 2\n\n### Heading 3' }),
      };

      const artifact = assembleArtifact(input);
      const html = artifact.sections[0].contentHtml;

      expect(html).toContain('<h1>Heading 1</h1>');
      expect(html).toContain('<h2>Heading 2</h2>');
      expect(html).toContain('<h3>Heading 3</h3>');
    });

    it('converts inline code', () => {
      const input: AssemblyInput = {
        codeResults: [],
        conceptMaps: [],
        parsedContent: makeParsedContent(1, { content: 'Use `const x = 1` here.' }),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.sections[0].contentHtml).toContain('<code>const x = 1</code>');
    });

    it('converts LaTeX blocks', () => {
      const input: AssemblyInput = {
        codeResults: [],
        conceptMaps: [],
        parsedContent: makeParsedContent(1, { content: 'Equation: $$E = mc^2$$' }),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.sections[0].contentHtml).toContain('katex-block');
      expect(artifact.sections[0].contentHtml).toContain('E = mc^2');
    });

    it('converts inline LaTeX', () => {
      const input: AssemblyInput = {
        codeResults: [],
        conceptMaps: [],
        parsedContent: makeParsedContent(1, { content: 'Where $F = ma$ is the force.' }),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.sections[0].contentHtml).toContain('katex-inline');
    });
  });

  // --------------------------------
  // Layout detection
  // --------------------------------
  describe('layout detection', () => {
    it('detects scrollytelling for multi-section + interactive viz', () => {
      const input: AssemblyInput = {
        codeResults: [makeCodeResult('c1', 'artifact')],
        conceptMaps: [makeConceptMap('s1', ['c1'])],
        parsedContent: makeParsedContent(3),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.layout).toBe('scrollytelling');
    });

    it('detects presentation for 1-2 sections', () => {
      const input: AssemblyInput = {
        codeResults: [makeCodeResult('c1', 'artifact')],
        conceptMaps: [makeConceptMap('s1', ['c1'])],
        parsedContent: makeParsedContent(2),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.layout).toBe('presentation');
    });

    it('detects explorer for multi-section without interactive viz', () => {
      const input: AssemblyInput = {
        codeResults: [makeCodeResult('c1', 'manim')],
        conceptMaps: [makeConceptMap('s1', ['c1'])],
        parsedContent: makeParsedContent(3),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.layout).toBe('explorer');
    });

    it('uses explicitly provided layout over auto-detection', () => {
      const input: AssemblyInput = {
        codeResults: [makeCodeResult('c1', 'artifact')],
        conceptMaps: [makeConceptMap('s1', ['c1'])],
        layout: 'presentation',
        parsedContent: makeParsedContent(5),
      };

      const artifact = assembleArtifact(input);

      expect(artifact.layout).toBe('presentation');
    });
  });

  // --------------------------------
  // Subsection processing
  // --------------------------------
  describe('subsection processing', () => {
    it('recursively processes subsections', () => {
      const content: ParsedContent = {
        metadata: { difficulty: 'intermediate', language: 'en', source: 'text', title: 'Test' },
        sections: [
          {
            content: 'Parent content',
            equations: [],
            figures: [],
            id: 's1',
            subsections: [
              {
                content: 'Child content',
                equations: [],
                figures: [],
                id: 's1-1',
                tables: [],
                title: 'Subsection 1.1',
              },
            ],
            tables: [],
            title: 'Section 1',
          },
        ],
      };

      const input: AssemblyInput = {
        codeResults: [makeCodeResult('c1'), makeCodeResult('c2')],
        conceptMaps: [
          makeConceptMap('s1', ['c1']),
          makeConceptMap('s1-1', ['c2']),
        ],
        parsedContent: content,
      };

      const artifact = assembleArtifact(input);

      // Parent + child = 2 sections
      expect(artifact.sections).toHaveLength(2);
      expect(artifact.sections[0].sectionId).toBe('s1');
      expect(artifact.sections[0].visualizations[0].conceptId).toBe('c1');
      expect(artifact.sections[1].sectionId).toBe('s1-1');
      expect(artifact.sections[1].visualizations[0].conceptId).toBe('c2');
    });
  });

  // --------------------------------
  // runAssemblyOrchestrator alias
  // --------------------------------
  describe('runAssemblyOrchestrator', () => {
    it('is an alias for assembleArtifact', () => {
      const input: AssemblyInput = {
        codeResults: [],
        conceptMaps: [],
        parsedContent: makeParsedContent(1),
      };

      const result1 = assembleArtifact(input);
      const result2 = runAssemblyOrchestrator(input);

      expect(result1).toEqual(result2);
    });
  });
});
