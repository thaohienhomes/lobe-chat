import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Storyboard } from '../types/storyboard';
import {
  type ValidationResult,
  runQualityValidator,
  runValidationPipeline,
  validateWithRetry,
} from './quality-validator';
import { generateReactArtifact, generateReactArtifactWithRetry } from './react-artifact-generator';

// ---------------------------------------------------------------------------
// Mock external modules
// ---------------------------------------------------------------------------

vi.mock('./react-artifact-generator', () => ({
  generateReactArtifact: vi.fn(),
  generateReactArtifactWithRetry: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_JSX_CODE = `import React from 'react';

export default function Visualization() {
  const [selected, setSelected] = React.useState(null);

  const handleClick = () => setSelected('item');

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 p-8 text-slate-100">
      <h1 className="text-2xl font-bold" aria-label="Title">Visualization</h1>
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="50" fill="red" />
        <text x="100" y="110">Label</text>
      </svg>
      <button onClick={handleClick} aria-label="Select item">Click me</button>
    </div>
  );
}`;

const INVALID_SYNTAX_CODE = `import React from 'react';
export default function Broken() {
  return (<div className="p-4">
    <p>Missing closing tag
  </div>);
}`;

const BANNED_API_CODE = `import React from 'react';
export default function Bad() {
  localStorage.setItem('key', 'value');
  return (<div className="p-4"><p>Content</p></div>);
}`;

const NO_DEFAULT_EXPORT_CODE = `import React from 'react';
function Hidden() {
  return (<div className="p-4"><p>Content</p></div>);
}`;

const makeStoryboard = (overrides?: Partial<Storyboard>): Storyboard => ({
  conceptId: 'concept-1',
  estimatedDuration: 30,
  language: 'en',
  renderTrack: 'artifact',
  scenes: [
    {
      narration: 'The key insight is that cells divide to grow.',
      purpose: 'Introduce cell division',
      sceneNumber: 1,
      title: 'Cell Division',
      transitionToNext: 'fade',
      visualElements: [
        {
          description: 'A cell splitting',
          position: { x: '50%', y: '50%' },
          timing: { duration: 2, start: 0 },
          type: 'shape',
        },
      ],
    },
    {
      narration: 'Think of it as a factory producing copies.',
      purpose: 'Explain mechanism',
      sceneNumber: 2,
      title: 'Mechanism',
      visualElements: [
        {
          description: 'Factory analogy',
          position: { x: '50%', y: '50%' },
          timing: { duration: 2, start: 0 },
          type: 'shape',
        },
      ],
    },
  ],
  targetAudience: 'undergraduate',
  ...overrides,
});

const makeGeneratedCode = (code: string) => ({
  code,
  conceptId: 'concept-1',
  dependencies: ['react', 'tailwindcss'],
  estimatedRenderTime: 1.0,
  language: 'jsx' as const,
  narrationScript: 'The key insight is...',
  track: 'artifact' as const,
});

type LlmCallFn = (systemPrompt: string, userMessage: string) => Promise<string>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('QualityValidator', () => {
  let mockLlm: LlmCallFn;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLlm = vi.fn();
  });

  // --------------------------------
  // 4-stage validation pipeline
  // --------------------------------
  describe('runValidationPipeline', () => {
    it('runs all 4 stages on valid code', () => {
      const code = makeGeneratedCode(VALID_JSX_CODE);
      const { allErrors, stages } = runValidationPipeline(code);

      expect(stages).toHaveLength(4);
      expect(stages[0].stage).toBe('syntax');
      expect(stages[1].stage).toBe('spatial');
      expect(stages[2].stage).toBe('content');
      expect(stages[3].stage).toBe('render');
      expect(allErrors).toHaveLength(0);
    });

    it('detects syntax errors in stage 1', () => {
      const code = makeGeneratedCode(INVALID_SYNTAX_CODE);
      const { stages } = runValidationPipeline(code);

      const syntaxStage = stages.find((s) => s.stage === 'syntax');
      expect(syntaxStage!.valid).toBe(false);
      expect(syntaxStage!.errors.length).toBeGreaterThan(0);
    });

    it('detects banned APIs in stage 1', () => {
      const code = makeGeneratedCode(BANNED_API_CODE);
      const { stages } = runValidationPipeline(code);

      const syntaxStage = stages.find((s) => s.stage === 'syntax');
      expect(syntaxStage!.errors.some((e) => e.includes('localStorage'))).toBe(true);
    });

    it('detects missing default export in stage 3 (content heuristic)', () => {
      const code = makeGeneratedCode(NO_DEFAULT_EXPORT_CODE);
      const { stages } = runValidationPipeline(code);

      const contentStage = stages.find((s) => s.stage === 'content');
      expect(contentStage!.valid).toBe(false);
      expect(contentStage!.errors.some((e) => e.includes('default export'))).toBe(true);
    });

    it('validates spatial positioning in stage 2', () => {
      const outOfBoundsCode = `import React from 'react';
export default function OOB() {
  return (
    <div className="p-4" style={{position: 'absolute'}}>
      <div style={{top: '200%', left: '50%'}} className="text-white">
        <p>Content</p>
      </div>
    </div>
  );
}`;
      const code = makeGeneratedCode(outOfBoundsCode);
      const { stages } = runValidationPipeline(code);

      const spatialStage = stages.find((s) => s.stage === 'spatial');
      expect(spatialStage!.errors.length).toBeGreaterThan(0);
    });

    it('validates render output in stage 4', () => {
      const noJsxCode = `import React from 'react';
export default function Empty() {
  console.log('no return');
}`;
      const code = makeGeneratedCode(noJsxCode);
      const { stages } = runValidationPipeline(code);

      const renderStage = stages.find((s) => s.stage === 'render');
      expect(renderStage!.valid).toBe(false);
      expect(renderStage!.errors.some((e) => e.includes('return JSX'))).toBe(true);
    });
  });

  // --------------------------------
  // Retry logic (max 3 attempts)
  // --------------------------------
  describe('validateWithRetry', () => {
    it('succeeds on first attempt with valid code', async () => {
      (generateReactArtifact as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        makeGeneratedCode(VALID_JSX_CODE),
      );

      const storyboard = makeStoryboard();
      const result = await validateWithRetry(storyboard, mockLlm);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1);
      expect(generateReactArtifact).toHaveBeenCalledTimes(1);
      expect(generateReactArtifactWithRetry).not.toHaveBeenCalled();
    });

    it('retries on first failure, succeeds on attempt 2', async () => {
      // Attempt 1: fails (no default export)
      (generateReactArtifact as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        makeGeneratedCode(NO_DEFAULT_EXPORT_CODE),
      );
      // Attempt 2: succeeds
      (generateReactArtifactWithRetry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        makeGeneratedCode(VALID_JSX_CODE),
      );

      const storyboard = makeStoryboard();
      const result = await validateWithRetry(storyboard, mockLlm);

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(generateReactArtifact).toHaveBeenCalledTimes(1);
      expect(generateReactArtifactWithRetry).toHaveBeenCalledTimes(1);
    });

    it('retries up to 3 times then returns fallback', async () => {
      const badCode = makeGeneratedCode(NO_DEFAULT_EXPORT_CODE);

      (generateReactArtifact as ReturnType<typeof vi.fn>).mockResolvedValueOnce(badCode);
      (generateReactArtifactWithRetry as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce(badCode) // attempt 2
        .mockResolvedValueOnce(badCode); // attempt 3

      const storyboard = makeStoryboard();
      const result = await validateWithRetry(storyboard, mockLlm);

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      // Fallback code should contain text summary
      expect(result.code.code).toContain('ContentVisualization');
      expect(result.code.code).toContain('could not be generated');
    });

    it('passes accumulated errors to retry attempts', async () => {
      (generateReactArtifact as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        makeGeneratedCode(BANNED_API_CODE),
      );
      (generateReactArtifactWithRetry as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
        makeGeneratedCode(VALID_JSX_CODE),
      );

      const storyboard = makeStoryboard();
      await validateWithRetry(storyboard, mockLlm);

      const retryCall = (generateReactArtifactWithRetry as ReturnType<typeof vi.fn>).mock.calls[0];
      const errors = retryCall[1] as string[];
      expect(errors.some((e) => e.includes('localStorage'))).toBe(true);
    });
  });

  // --------------------------------
  // Fallback to static text
  // --------------------------------
  describe('fallback artifact', () => {
    it('creates fallback with scene titles and narration', async () => {
      const badCode = makeGeneratedCode(NO_DEFAULT_EXPORT_CODE);
      (generateReactArtifact as ReturnType<typeof vi.fn>).mockResolvedValue(badCode);
      (generateReactArtifactWithRetry as ReturnType<typeof vi.fn>).mockResolvedValue(badCode);

      const storyboard = makeStoryboard();
      const result = await validateWithRetry(storyboard, mockLlm);

      expect(result.success).toBe(false);
      expect(result.code.track).toBe('artifact');
      expect(result.code.language).toBe('jsx');
      expect(result.code.conceptId).toBe('concept-1');
      expect(result.code.code).toContain('Cell Division');
      expect(result.code.code).toContain('Mechanism');
    });
  });

  // --------------------------------
  // runQualityValidator (filters by render track)
  // --------------------------------
  describe('runQualityValidator', () => {
    it('only validates artifact and both track storyboards', async () => {
      (generateReactArtifact as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ...makeGeneratedCode(VALID_JSX_CODE), conceptId: 'c1' })
        .mockResolvedValueOnce({ ...makeGeneratedCode(VALID_JSX_CODE), conceptId: 'c3' });

      const storyboards: Storyboard[] = [
        makeStoryboard({ conceptId: 'c1', renderTrack: 'artifact' }),
        makeStoryboard({ conceptId: 'c2', renderTrack: 'manim' }),
        makeStoryboard({ conceptId: 'c3', renderTrack: 'both' }),
      ];

      const results = await runQualityValidator(storyboards, mockLlm);

      // manim-only storyboard should be skipped
      expect(results).toHaveLength(2);
      expect(results[0].code.conceptId).toBe('c1');
      expect(results[1].code.conceptId).toBe('c3');
    });

    it('returns empty array when no storyboards match artifact track', async () => {
      const storyboards: Storyboard[] = [makeStoryboard({ renderTrack: 'manim' })];

      const results = await runQualityValidator(storyboards, mockLlm);

      expect(results).toHaveLength(0);
    });
  });
});
