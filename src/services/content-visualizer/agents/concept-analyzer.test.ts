import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ParsedContent } from '../types/parsed-content';

import { type LlmCallFn, analyzeSection, runConceptAnalyzer } from './concept-analyzer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeSection = (
  id: string,
  title: string,
  content: string,
  subsections?: ParsedContent['sections'],
) => ({
  content,
  equations: [] as any[],
  figures: [] as any[],
  id,
  subsections,
  tables: [] as any[],
  title,
});

const makeParsedContent = (
  sections: ParsedContent['sections'],
): ParsedContent => ({
  metadata: {
    difficulty: 'intermediate',
    language: 'en',
    source: 'text',
    title: 'Test Content',
  },
  sections,
});

const highScoreConcept = (overrides: Record<string, any> = {}) => ({
  description: 'How the heart pumps blood',
  id: 'concept-1',
  scores: {
    complexity: 8,
    feasibility: 8,
    interactivityValue: 8,
    visualBenefit: 8,
  },
  sourceText: 'The circulatory system...',
  title: 'Circulatory System',
  vizType: 'structural_diagram',
  ...overrides,
});

const lowScoreConcept = (overrides: Record<string, any> = {}) => ({
  description: 'A simple note',
  id: 'concept-2',
  scores: {
    complexity: 3,
    feasibility: 4,
    interactivityValue: 2,
    visualBenefit: 3,
  },
  sourceText: 'Notes...',
  title: 'Simple Text',
  vizType: 'comparison_chart',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConceptAnalyzer', () => {
  let mockLlm: LlmCallFn;

  beforeEach(() => {
    mockLlm = vi.fn();
  });

  // --------------------------------
  // Score threshold >= 7
  // --------------------------------
  describe('score threshold filtering', () => {
    it('keeps concepts with average score >= 7', async () => {
      (mockLlm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        JSON.stringify({ concepts: [highScoreConcept()] }),
      );

      const section = makeSection('s1', 'Heart', 'The circulatory system...');
      const result = await analyzeSection(section, mockLlm);

      expect(result.sectionId).toBe('s1');
      expect(result.concepts).toHaveLength(1);
      expect(result.concepts[0].title).toBe('Circulatory System');
    });

    it('filters out concepts with average score < 7', async () => {
      (mockLlm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        JSON.stringify({ concepts: [lowScoreConcept()] }),
      );

      const section = makeSection('s1', 'Notes', 'Some notes...');
      const result = await analyzeSection(section, mockLlm);

      expect(result.concepts).toHaveLength(0);
    });

    it('keeps only qualifying concepts from mixed set', async () => {
      (mockLlm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        JSON.stringify({
          concepts: [highScoreConcept(), lowScoreConcept()],
        }),
      );

      const section = makeSection('s1', 'Mixed', 'Mixed content...');
      const result = await analyzeSection(section, mockLlm);

      expect(result.concepts).toHaveLength(1);
      expect(result.concepts[0].id).toBe('concept-1');
    });

    it('filters concept at exactly score 7 boundary (keeps it)', async () => {
      const borderlineConcept = highScoreConcept({
        id: 'border',
        scores: { complexity: 7, feasibility: 7, interactivityValue: 7, visualBenefit: 7 },
      });

      (mockLlm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        JSON.stringify({ concepts: [borderlineConcept] }),
      );

      const section = makeSection('s1', 'Border', 'Content...');
      const result = await analyzeSection(section, mockLlm);

      expect(result.concepts).toHaveLength(1);
    });

    it('filters concept just below score 7 (6.75 avg)', async () => {
      const belowThreshold = highScoreConcept({
        id: 'below',
        scores: { complexity: 7, feasibility: 7, interactivityValue: 7, visualBenefit: 6 },
      });

      (mockLlm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        JSON.stringify({ concepts: [belowThreshold] }),
      );

      const section = makeSection('s1', 'Below', 'Content...');
      const result = await analyzeSection(section, mockLlm);

      expect(result.concepts).toHaveLength(0);
    });
  });

  // --------------------------------
  // Render track decision logic
  // --------------------------------
  describe('render track determination', () => {
    it('assigns artifact track for structural_diagram', async () => {
      (mockLlm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        JSON.stringify({
          concepts: [highScoreConcept({ vizType: 'structural_diagram' })],
        }),
      );

      const section = makeSection('s1', 'Struct', 'Content...');
      const result = await analyzeSection(section, mockLlm);

      expect(result.concepts[0].renderTrack).toBe('artifact');
    });

    it('assigns manim track for mathematical_proof', async () => {
      (mockLlm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        JSON.stringify({
          concepts: [
            highScoreConcept({
              scores: { complexity: 8, feasibility: 8, interactivityValue: 6, visualBenefit: 8 },
              vizType: 'mathematical_proof',
            }),
          ],
        }),
      );

      const section = makeSection('s1', 'Math', 'Content...');
      const result = await analyzeSection(section, mockLlm);

      expect(result.concepts[0].renderTrack).toBe('manim');
    });

    it('assigns both track for mathematical_proof with high interactivity (>= 8)', async () => {
      (mockLlm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        JSON.stringify({
          concepts: [
            highScoreConcept({
              scores: { complexity: 8, feasibility: 8, interactivityValue: 9, visualBenefit: 8 },
              vizType: 'mathematical_proof',
            }),
          ],
        }),
      );

      const section = makeSection('s1', 'Math', 'Content...');
      const result = await analyzeSection(section, mockLlm);

      expect(result.concepts[0].renderTrack).toBe('both');
    });

    it('assigns both track for artifact types with very high complexity + visualBenefit (>= 9)', async () => {
      (mockLlm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        JSON.stringify({
          concepts: [
            highScoreConcept({
              scores: { complexity: 9, feasibility: 8, interactivityValue: 8, visualBenefit: 9 },
              vizType: 'comparison_chart',
            }),
          ],
        }),
      );

      const section = makeSection('s1', 'Complex', 'Content...');
      const result = await analyzeSection(section, mockLlm);

      expect(result.concepts[0].renderTrack).toBe('both');
    });

    it('respects LLM-provided renderTrack over computed track', async () => {
      (mockLlm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        JSON.stringify({
          concepts: [
            highScoreConcept({
              renderTrack: 'manim',
              vizType: 'structural_diagram',
            }),
          ],
        }),
      );

      const section = makeSection('s1', 'Override', 'Content...');
      const result = await analyzeSection(section, mockLlm);

      // LLM explicitly said manim, even though structural_diagram defaults to artifact
      expect(result.concepts[0].renderTrack).toBe('manim');
    });
  });

  // --------------------------------
  // runConceptAnalyzer (multi-section + subsections)
  // --------------------------------
  describe('runConceptAnalyzer', () => {
    it('processes all sections and returns only non-empty concept maps', async () => {
      const fn = mockLlm as ReturnType<typeof vi.fn>;

      // Section 1: has qualifying concept
      fn.mockResolvedValueOnce(
        JSON.stringify({ concepts: [highScoreConcept()] }),
      );
      // Section 2: no qualifying concepts
      fn.mockResolvedValueOnce(
        JSON.stringify({ concepts: [lowScoreConcept()] }),
      );

      const content = makeParsedContent([
        makeSection('s1', 'Heart', 'Circulatory system...'),
        makeSection('s2', 'Notes', 'Simple notes...'),
      ]);

      const results = await runConceptAnalyzer(content, mockLlm);

      expect(results).toHaveLength(1);
      expect(results[0].sectionId).toBe('s1');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('recursively analyzes subsections', async () => {
      const fn = mockLlm as ReturnType<typeof vi.fn>;

      // Parent section
      fn.mockResolvedValueOnce(
        JSON.stringify({ concepts: [highScoreConcept({ id: 'parent-c' })] }),
      );
      // Subsection
      fn.mockResolvedValueOnce(
        JSON.stringify({ concepts: [highScoreConcept({ id: 'sub-c' })] }),
      );

      const content = makeParsedContent([
        makeSection('s1', 'Parent', 'Parent content', [
          makeSection('s1-1', 'Child', 'Child content'),
        ]),
      ]);

      const results = await runConceptAnalyzer(content, mockLlm);

      expect(results).toHaveLength(2);
      expect(results[0].sectionId).toBe('s1');
      expect(results[1].sectionId).toBe('s1-1');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('handles LLM response wrapped in markdown code fences', async () => {
      (mockLlm as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        '```json\n' + JSON.stringify({ concepts: [highScoreConcept()] }) + '\n```',
      );

      const content = makeParsedContent([
        makeSection('s1', 'Test', 'Content...'),
      ]);

      const results = await runConceptAnalyzer(content, mockLlm);

      expect(results).toHaveLength(1);
    });

    it('includes equations and figures in user message to LLM', async () => {
      const fn = mockLlm as ReturnType<typeof vi.fn>;
      fn.mockResolvedValueOnce(JSON.stringify({ concepts: [] }));

      const section = {
        content: 'Physics content',
        equations: [{ context: 'Force equation', id: 'eq1', latex: 'F = ma' }],
        figures: [{ caption: 'Force diagram', id: 'fig1' }],
        id: 's1',
        tables: [{ caption: 'Results', headers: ['Force', 'Mass'], id: 'tbl1', rows: [] }],
        title: 'Forces',
      };

      const content = makeParsedContent([section]);
      await runConceptAnalyzer(content, mockLlm);

      const callArgs = fn.mock.calls[0];
      const userMessage = callArgs[1] as string;
      expect(userMessage).toContain('F = ma');
      expect(userMessage).toContain('Force diagram');
      expect(userMessage).toContain('Force, Mass');
    });
  });
});
