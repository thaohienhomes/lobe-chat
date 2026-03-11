/**
 * Text parser: LLM-based section detection for raw text and topic-based content generation.
 * Uses Claude Sonnet for structured extraction.
 */

import type { ContentSection, DifficultyLevel, ParsedContent, ParsedEquation } from '../types/parsed-content';

const LATEX_INLINE_REGEX = /\$([^$]+)\$/g;
const LATEX_BLOCK_REGEX = /\$\$([^$]+)\$\$/g;
const HEADING_REGEX = /^(#{1,4})\s+(.+)$/gm;

/**
 * System prompt for LLM-based text structuring.
 */
export const TEXT_STRUCTURING_PROMPT = `You are a content structuring agent for Pho.Chat Content Visualizer.
Given raw text, identify and structure it into logical sections.

OUTPUT FORMAT (JSON):
{
  "title": "detected or inferred title",
  "abstract": "brief summary if applicable",
  "language": "en" or "vi",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "sections": [
    {
      "title": "section heading",
      "content": "section content in markdown with LaTeX preserved"
    }
  ]
}

RULES:
- Preserve all LaTeX equations exactly as-is (both $inline$ and $$block$$)
- Detect natural section breaks (topic shifts, heading patterns, numbered sections)
- If text has no clear structure, create 2-4 logical sections by topic
- Detect language from content (Vietnamese vs English)
- Estimate difficulty from vocabulary and concept complexity`;

/**
 * System prompt for topic-based content generation.
 */
export const TOPIC_GENERATION_PROMPT = `You are an educational content generator for Pho.Chat Content Visualizer.
Given a topic, generate comprehensive educational content suitable for visualization.

OUTPUT FORMAT (JSON):
{
  "title": "topic title",
  "abstract": "brief overview",
  "language": "en" or "vi" (match user's language),
  "difficulty": "beginner" | "intermediate" | "advanced",
  "sections": [
    {
      "title": "section heading",
      "content": "detailed educational content in markdown with LaTeX equations"
    }
  ]
}

RULES:
- Generate 3-6 sections covering the topic comprehensively
- Include LaTeX equations where relevant ($$block$$ and $inline$)
- Write in a clear, educational style suitable for visualization
- Include concrete examples and analogies
- Each section should have a distinct focus area
- Content should build progressively from fundamentals to advanced concepts`;

/**
 * Represents the structured output from LLM parsing.
 */
interface LlmStructuredOutput {
  abstract?: string;
  difficulty: DifficultyLevel;
  language: 'en' | 'vi' | string;
  sections: Array<{
    content: string;
    title: string;
  }>;
  title: string;
}

/**
 * Extract LaTeX equations from text content.
 */
function extractEquations(text: string): ParsedEquation[] {
  const equations: ParsedEquation[] = [];
  let index = 0;

  for (const match of text.matchAll(LATEX_BLOCK_REGEX)) {
    index++;
    equations.push({
      context: text.slice(Math.max(0, (match.index || 0) - 100), (match.index || 0) + match[0].length + 100).trim(),
      id: `eq-${index}`,
      latex: match[1].trim(),
    });
  }

  for (const match of text.matchAll(LATEX_INLINE_REGEX)) {
    index++;
    equations.push({
      context: text.slice(Math.max(0, (match.index || 0) - 100), (match.index || 0) + match[0].length + 100).trim(),
      id: `eq-${index}`,
      latex: match[1].trim(),
    });
  }

  return equations;
}

/**
 * Convert LLM output to ContentSection array.
 */
function toContentSections(sections: LlmStructuredOutput['sections']): ContentSection[] {
  return sections.map((section, i) => ({
    content: section.content,
    equations: extractEquations(section.content),
    figures: [],
    id: `sec-${i + 1}`,
    tables: [],
    title: section.title,
  }));
}

/**
 * Heuristic-based text parsing when LLM is unavailable.
 * Splits by markdown headings or double newlines.
 */
function parseTextHeuristic(text: string): ContentSection[] {
  const headings: Array<{ index: number; title: string }> = [];

  for (const match of text.matchAll(HEADING_REGEX)) {
    headings.push({ index: match.index || 0, title: match[2].trim() });
  }

  if (headings.length > 0) {
    return headings.map((heading, i) => {
      const start = heading.index;
      const end = i + 1 < headings.length ? headings[i + 1].index : text.length;
      const content = text.slice(start, end).trim();
      return {
        content,
        equations: extractEquations(content),
        figures: [],
        id: `sec-${i + 1}`,
        tables: [],
        title: heading.title,
      };
    });
  }

  // Split by double newlines into paragraphs, group into sections
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const PARAGRAPHS_PER_SECTION = 3;
  const sections: ContentSection[] = [];

  for (let i = 0; i < paragraphs.length; i += PARAGRAPHS_PER_SECTION) {
    const chunk = paragraphs.slice(i, i + PARAGRAPHS_PER_SECTION);
    const content = chunk.join('\n\n');
    const sectionIndex = Math.floor(i / PARAGRAPHS_PER_SECTION) + 1;
    sections.push({
      content,
      equations: extractEquations(content),
      figures: [],
      id: `sec-${sectionIndex}`,
      tables: [],
      title: `Section ${sectionIndex}`,
    });
  }

  return sections.length > 0 ? sections : [{
    content: text.trim(),
    equations: extractEquations(text),
    figures: [],
    id: 'sec-1',
    tables: [],
    title: 'Content',
  }];
}

/**
 * Detect language from text (simple heuristic).
 */
function detectLanguage(text: string): 'en' | 'vi' {
  const viChars = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/gi;
  const viCount = (text.match(viChars) || []).length;
  return viCount > text.length * 0.01 ? 'vi' : 'en';
}

/**
 * Parse raw text into structured ParsedContent using heuristic fallback.
 * In production, the ContentIngestion agent calls LLM with TEXT_STRUCTURING_PROMPT
 * and passes the result through `fromLlmOutput`.
 */
export function parseText(text: string): ParsedContent {
  const sections = parseTextHeuristic(text);
  const firstLine = text.split('\n').find((l) => l.trim().length > 0) || 'Untitled';
  const title = firstLine.trim().slice(0, 100);

  return {
    metadata: {
      difficulty: 'intermediate',
      language: detectLanguage(text),
      source: 'text',
      title,
    },
    sections,
  };
}

/**
 * Convert LLM-structured output into ParsedContent.
 * Used when the ContentIngestion agent receives structured JSON from the LLM.
 */
export function fromLlmOutput(output: LlmStructuredOutput, source: 'text' | 'topic'): ParsedContent {
  return {
    abstract: output.abstract,
    metadata: {
      difficulty: output.difficulty,
      language: output.language,
      source,
      title: output.title,
    },
    sections: toContentSections(output.sections),
  };
}
