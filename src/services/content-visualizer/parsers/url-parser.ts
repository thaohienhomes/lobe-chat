/**
 * URL parser: extracts clean article content from web pages using @mozilla/readability.
 * Falls back to raw HTML text extraction via cheerio.
 */

import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

import type { ContentSection, ParsedContent, ParsedEquation, ParsedFigure, ParsedTable } from '../types/parsed-content';

const HEADING_REGEX = /^(#{1,4})\s+(.+)$/gm;
const LATEX_INLINE_REGEX = /\$([^$]+)\$/g;
const LATEX_BLOCK_REGEX = /\$\$([^$]+)\$\$/g;

/**
 * Fetch and extract readable article from a URL using Readability.
 */
async function fetchWithReadability(url: string): Promise<{
  content: string;
  textContent: string;
  title: string;
}> {
  const response = await fetch(url, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'User-Agent': 'Mozilla/5.0 (compatible; PhoChatBot/1.0)',
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) throw new Error(`URL fetch failed: ${response.status} ${response.statusText}`);

  const html = await response.text();
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();

  if (!article) {
    // Fallback: extract text using cheerio
    const $ = cheerio.load(html);
    $('script, style, nav, header, footer, aside').remove();
    const textContent = $('body').text().replaceAll(/\s+/g, ' ').trim();
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
    return { content: html, textContent, title };
  }

  return {
    content: article.content || '',
    textContent: article.textContent || '',
    title: article.title || 'Untitled',
  };
}

/**
 * Extract equations from text content.
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
 * Extract figures from HTML content.
 */
function extractFigures(htmlContent: string, baseUrl: string): ParsedFigure[] {
  const $ = cheerio.load(htmlContent);
  const figures: ParsedFigure[] = [];
  let index = 0;

  $('img').each((_i, el) => {
    const img = $(el);
    const src = img.attr('src');
    if (!src) return;

    index++;
    const resolvedUrl = src.startsWith('http') ? src : new URL(src, baseUrl).href;
    figures.push({
      caption: img.attr('alt') || img.attr('title') || `Figure ${index}`,
      id: `fig-${index}`,
      url: resolvedUrl,
    });
  });

  return figures;
}

/**
 * Extract tables from HTML content.
 */
function extractTables(htmlContent: string): ParsedTable[] {
  const $ = cheerio.load(htmlContent);
  const tables: ParsedTable[] = [];
  let index = 0;

  $('table').each((_i, el) => {
    const tableEl = $(el);
    const headers: string[] = [];
    tableEl.find('thead th, thead td').each((_j, th) => {
      headers.push($(th).text().trim());
    });

    const rows: string[][] = [];
    tableEl.find('tbody tr').each((_j, tr) => {
      const row: string[] = [];
      $(tr).find('td, th').each((_k, td) => {
        row.push($(td).text().trim());
      });
      if (row.length > 0) rows.push(row);
    });

    if (headers.length > 0 || rows.length > 0) {
      index++;
      tables.push({
        caption: tableEl.attr('aria-label') || `Table ${index}`,
        headers,
        id: `tbl-${index}`,
        rows,
      });
    }
  });

  return tables;
}

/**
 * Split text content into sections based on HTML headings.
 */
function splitIntoSections(htmlContent: string, textContent: string): ContentSection[] {
  const $ = cheerio.load(htmlContent);
  const sections: ContentSection[] = [];

  // Try to split by headings in the HTML
  const headingElements = $('h1, h2, h3, h4');

  if (headingElements.length === 0) {
    // No headings — use markdown heading detection on text
    const headings: Array<{ index: number; title: string }> = [];
    for (const match of textContent.matchAll(HEADING_REGEX)) {
      headings.push({ index: match.index || 0, title: match[2].trim() });
    }

    if (headings.length === 0) {
      return [{
        content: textContent.trim(),
        equations: extractEquations(textContent),
        figures: [],
        id: 'sec-1',
        tables: [],
        title: 'Content',
      }];
    }

    for (let i = 0; i < headings.length; i++) {
      const start = headings[i].index;
      const end = i + 1 < headings.length ? headings[i + 1].index : textContent.length;
      const content = textContent.slice(start, end).trim();
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

  // Split by HTML headings
  let sectionIndex = 0;
  headingElements.each((_i, el) => {
    const heading = $(el);
    const title = heading.text().trim();
    if (!title) return;

    // Collect content until next heading
    const contentParts: string[] = [];
    let next = heading.next();
    while (next.length > 0 && !next.is('h1, h2, h3, h4')) {
      contentParts.push(next.text().trim());
      next = next.next();
    }

    const content = contentParts.join('\n\n');
    if (!content) return;

    sectionIndex++;
    sections.push({
      content,
      equations: extractEquations(content),
      figures: [],
      id: `sec-${sectionIndex}`,
      tables: [],
      title,
    });
  });

  return sections.length > 0 ? sections : [{
    content: textContent.trim(),
    equations: extractEquations(textContent),
    figures: [],
    id: 'sec-1',
    tables: [],
    title: 'Content',
  }];
}

/**
 * Detect language from text content (simple heuristic).
 */
function detectLanguage(text: string): 'en' | 'vi' | string {
  // Vietnamese character detection
  const viChars = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
  const viCount = (text.match(viChars) || []).length;
  if (viCount > text.length * 0.01) return 'vi';
  return 'en';
}

/**
 * Parse a web URL into structured ParsedContent.
 */
export async function parseUrl(url: string): Promise<ParsedContent> {
  const { content, textContent, title } = await fetchWithReadability(url);
  const sections = splitIntoSections(content, textContent);
  const figures = extractFigures(content, url);
  const tables = extractTables(content);

  // Distribute figures and tables into first section if not already mapped
  if (sections.length > 0 && figures.length > 0) {
    sections[0].figures = figures;
  }
  if (sections.length > 0 && tables.length > 0) {
    sections[0].tables = tables;
  }

  return {
    metadata: {
      difficulty: 'intermediate',
      language: detectLanguage(textContent),
      source: 'url',
      sourceUrl: url,
      title,
    },
    sections,
  };
}
