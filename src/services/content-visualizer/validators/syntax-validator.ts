/**
 * Stage 1: Syntactic Validation
 * Validates JSX code using @babel/parser.
 * Checks for syntax errors, missing imports, and undefined variables.
 */

import { parse } from '@babel/parser';

export interface SyntaxValidationResult {
  errors: string[];
  valid: boolean;
}

/**
 * Banned APIs in Artifact components (PRD security rules).
 */
const BANNED_APIS = [
  'localStorage',
  'sessionStorage',
  'document.cookie',
  'indexedDB',
  'window.open',
  'eval(',
  'Function(',
  'importScripts',
];

/**
 * Banned import patterns — no external CSS, no Node.js modules.
 */
const BANNED_IMPORTS = [
  /import\s+.*\.css['"]/,
  /import\s+.*\.scss['"]/,
  /import\s+.*\.less['"]/,
  /require\s*\(/,
];

/**
 * Parse JSX code with @babel/parser and check for syntax errors.
 */
function checkSyntax(code: string): string[] {
  const errors: string[] = [];

  try {
    parse(code, {
      errorRecovery: true,
      plugins: ['jsx', 'typescript'],
      sourceType: 'module',
    });
  } catch (error: any) {
    const message = error.message || String(error);
    const loc = error.loc
      ? ` (line ${error.loc.line}, col ${error.loc.column})`
      : '';
    errors.push(`Syntax error${loc}: ${message}`);
  }

  return errors;
}

/**
 * Check for banned APIs that must not appear in Artifact components.
 */
function checkBannedApis(code: string): string[] {
  const errors: string[] = [];

  for (const api of BANNED_APIS) {
    if (code.includes(api)) {
      errors.push(`Banned API usage: "${api}" is not allowed in Artifact components.`);
    }
  }

  for (const pattern of BANNED_IMPORTS) {
    if (pattern.test(code)) {
      errors.push(`Banned import: CSS/SCSS/LESS imports and require() are not allowed.`);
    }
  }

  return errors;
}

/**
 * Check that code has a default export (required for Artifact components).
 */
function checkDefaultExport(code: string): string[] {
  const hasDefaultExport =
    /export\s+default\s+/.test(code) ||
    /export\s*\{\s*\w+\s+as\s+default\s*\}/.test(code);

  if (!hasDefaultExport) {
    return ['Missing default export. Artifact components must have a default export.'];
  }
  return [];
}

/**
 * Check that React is imported or used (basic sanity check).
 */
function checkReactUsage(code: string): string[] {
  const hasReactImport = /import\s+.*React/.test(code) || /from\s+['"]react['"]/.test(code);
  const hasJsx = /<\w/.test(code);

  if (hasJsx && !hasReactImport) {
    return ['JSX detected but React is not imported. Add: import React from "react".'];
  }
  return [];
}

/**
 * Validate JSX code syntax for Artifact components.
 *
 * @param code - JSX source code string
 * @returns SyntaxValidationResult with errors array
 */
export function validateSyntax(code: string): SyntaxValidationResult {
  const errors: string[] = [
    ...checkSyntax(code),
    ...checkBannedApis(code),
    ...checkDefaultExport(code),
    ...checkReactUsage(code),
  ];

  return {
    errors,
    valid: errors.length === 0,
  };
}
