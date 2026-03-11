/**
 * PDF parser: wrapper around pymupdf4llm (Python) for PDF-to-structured-markdown extraction.
 * Falls back to raw text extraction if pymupdf4llm is unavailable.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import type { ContentSection, ParsedContent, ParsedEquation } from '../types/parsed-content';

const execFileAsync = promisify(execFile);

const LATEX_INLINE_REGEX = /\$([^$]+)\$/g;
const LATEX_BLOCK_REGEX = /\$\$([^$]+)\$\$/g;
const HEADING_REGEX = /^(#{1,4})\s+(.+)$/gm;

/**
 * Python script to extract structured markdown from PDF using pymupdf4llm.
 */
const PYMUPDF_SCRIPT = `
import sys, json
try:
    import pymupdf4llm
    result = pymupdf4llm.to_markdown(sys.argv[1])
    print(json.dumps({"ok": True, "markdown": result}))
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)}))
`;

/**
 * Extract markdown from PDF using pymupdf4llm Python package.
 */
async function extractWithPymupdf(filePath: string): Promise<string> {
  const { stdout } = await execFileAsync('python', ['-c', PYMUPDF_SCRIPT, filePath], {
    maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large PDFs
    timeout: 60_000,
  });

  const result = JSON.parse(stdout.trim()) as { error?: string; markdown?: string; ok: boolean };
  if (!result.ok || !result.markdown) {
    throw new Error(`pymupdf4llm extraction failed: ${result.error || 'unknown error'}`);
  }

  return result.markdown;
}

/**
 * Extract LaTeX equations from markdown text.
 */
function extractEquations(text: string): ParsedEquation[] {
  const equations: ParsedEquation[] = [];
  let index = 0;

  // Block equations
  for (const match of text.matchAll(LATEX_BLOCK_REGEX)) {
    index++;
    const start = Math.max(0, (match.index || 0) - 100);
    const end = Math.min(text.length, (match.index || 0) + match[0].length + 100);
    equations.push({
      context: text.slice(start, end).trim(),
      id: `eq-${index}`,
      latex: match[1].trim(),
    });
  }

  // Inline equations
  for (const match of text.matchAll(LATEX_INLINE_REGEX)) {
    index++;
    const start = Math.max(0, (match.index || 0) - 100);
    const end = Math.min(text.length, (match.index || 0) + match[0].length + 100);
    equations.push({
      context: text.slice(start, end).trim(),
      id: `eq-${index}`,
      latex: match[1].trim(),
    });
  }

  return equations;
}

/**
 * Split markdown text into sections based on headings.
 */
function splitIntoSections(markdown: string): ContentSection[] {
  const sections: ContentSection[] = [];
  const headings: Array<{ index: number; level: number; title: string }> = [];

  for (const match of markdown.matchAll(HEADING_REGEX)) {
    headings.push({
      index: match.index || 0,
      level: match[1].length,
      title: match[2].trim(),
    });
  }

  if (headings.length === 0) {
    // No headings found — treat entire content as one section
    return [{
      content: markdown.trim(),
      equations: extractEquations(markdown),
      figures: [],
      id: 'sec-1',
      tables: [],
      title: 'Content',
    }];
  }

  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index;
    const end = i + 1 < headings.length ? headings[i + 1].index : markdown.length;
    const content = markdown.slice(start, end).trim();

    sections.push({
      content,
      equations: extractEquations(content),
      figures: [],
      id: `sec-${i + 1}`,
      tables: [],
      title: headings[i].title,
    });
  }

  return sections;
}

/**
 * Extract title from the first heading or first line of the markdown.
 */
function extractTitle(markdown: string): string {
  const firstHeading = /^#\s+(.+)$/m.exec(markdown);
  if (firstHeading) return firstHeading[1].trim();

  const firstLine = markdown.split('\n').find((line) => line.trim().length > 0);
  return firstLine?.trim().slice(0, 100) || 'Untitled Document';
}

/**
 * Parse a PDF file into structured ParsedContent.
 */
export async function parsePdf(filePath: string): Promise<ParsedContent> {
  const markdown = await extractWithPymupdf(filePath);
  const title = extractTitle(markdown);
  const sections = splitIntoSections(markdown);

  // Extract abstract if present (common in academic papers)
  const abstractMatch = /(?:^|\n)(?:#+\s*)?abstract\s*\n([\S\s]*?)(?=\n#|\n{3})/i.exec(markdown);

  return {
    abstract: abstractMatch?.[1]?.trim(),
    metadata: {
      difficulty: 'intermediate',
      language: 'en',
      source: 'pdf',
      title,
    },
    sections,
  };
}
