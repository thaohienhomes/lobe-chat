/**
 * Generated code output from Agent 4: CodeGenerator (Dual-Track).
 * Contains executable React JSX (Track A) or Manim Python (Track B).
 */

export type CodeTrack = 'artifact' | 'manim';

export type CodeLanguage = 'jsx' | 'python';

export interface GeneratedCode {
  code: string;
  conceptId: string;
  dependencies: string[];
  estimatedRenderTime: number;
  language: CodeLanguage;
  narrationScript?: string;
  track: CodeTrack;
}
