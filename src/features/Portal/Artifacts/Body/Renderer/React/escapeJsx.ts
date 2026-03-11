/**
 * Pre-process JSX/TSX code to escape special characters in JSX text content.
 *
 * Handles the common case where AI-generated code contains bare `>` or `<`
 * inside JSX text nodes, which causes parse errors like:
 *   "The character '>' is not valid inside a JSX element"
 *
 * Uses a lightweight state machine to distinguish JSX text content from
 * JS code, strings, comments, and JSX expressions.
 */

type State = 'code' | 'tag-open' | 'tag-close' | 'jsx-text' | 'jsx-expr' | 'string' | 'template';

// Keywords after which `<` starts JSX (not a generic type parameter)
const JSX_KEYWORDS = new Set([
  'return',
  'case',
  'default',
  'yield',
  'throw',
  'void',
  'typeof',
  'delete',
  'new',
]);

/**
 * Check if `<` at position `i` is the start of a JSX element (vs a generic
 * type parameter or comparison operator).
 *
 * Heuristic: if the previous non-whitespace token is an identifier that is
 * NOT a keyword that precedes JSX, treat it as a generic: `Array<T>`,
 * `useState<string>()`.
 */
function isJsxStart(code: string, i: number, next: string): boolean {
  // Must be followed by a letter (tag name) or `>` (fragment <>)
  if (!(/[A-Za-z]/.test(next) || next === '>')) return false;

  // Look back to find the previous non-whitespace character
  let j = i - 1;
  while (j >= 0 && /\s/.test(code[j])) j--;

  if (j < 0) return true; // start of file → JSX

  const prevChar = code[j];

  // After operators / punctuation → definitely JSX
  if (/[!%&(*+,/:;=?[^{|~\-]/.test(prevChar)) return true;
  // After `>` could be chained JSX or `>>` — treat as JSX for safety
  if (prevChar === '>') return true;

  // After a word character → might be generic. Extract the word.
  if (/\w/.test(prevChar)) {
    let wordEnd = j + 1;
    while (j >= 0 && /\w/.test(code[j])) j--;
    const word = code.slice(j + 1, wordEnd);
    return JSX_KEYWORDS.has(word);
  }

  // After `)` or `]` → likely generic or comparison, not JSX
  if (prevChar === ')' || prevChar === ']') return false;

  return true;
}

export function escapeJsxTextContent(code: string): string {
  const result: string[] = [];
  let state: State = 'code';
  const stateStack: State[] = [];
  const jsxReturnStack: State[] = [];
  let parentBeforeTag: State = 'code';
  let stringDelim = '';
  let braceDepth = 0;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1] || '';

    switch (state) {
      // ── JavaScript / TypeScript code ──────────────────────────────────
      case 'code': {
        if (ch === '/' && next === '/') {
          const end = code.indexOf('\n', i);
          const slice = end >= 0 ? code.slice(i, end) : code.slice(i);
          result.push(slice);
          i = end >= 0 ? end - 1 : code.length - 1;
        } else if (ch === '/' && next === '*') {
          const end = code.indexOf('*/', i + 2);
          if (end >= 0) {
            result.push(code.slice(i, end + 2));
            i = end + 1;
          } else {
            result.push(code.slice(i));
            i = code.length - 1;
          }
        } else if (ch === '"' || ch === "'" || ch === '`') {
          stateStack.push('code');
          state = ch === '`' ? 'template' : 'string';
          stringDelim = ch;
          result.push(ch);
        } else if (ch === '<' && isJsxStart(code, i, next)) {
          parentBeforeTag = 'code';
          state = 'tag-open';
          result.push(ch);
        } else {
          result.push(ch);
        }
        break;
      }

      // ── Inside a JSX opening / self-closing tag ───────────────────────
      case 'tag-open': {
        switch (ch) {
        case '"': 
        case "'": {
          stateStack.push('tag-open');
          state = 'string';
          stringDelim = ch;
          result.push(ch);
        
        break;
        }
        case '`': {
          stateStack.push('tag-open');
          state = 'template';
          result.push(ch);
        
        break;
        }
        case '{': {
          stateStack.push('tag-open');
          state = 'jsx-expr';
          braceDepth = 1;
          result.push(ch);
        
        break;
        }
        default: { if (ch === '/' && next === '>') {
          // Self-closing: <Tag />
          result.push('/>');
          i++;
          state = parentBeforeTag;
        } else if (ch === '>') {
          result.push(ch);
          jsxReturnStack.push(parentBeforeTag);
          state = 'jsx-text';
        } else {
          result.push(ch);
        }
        }
        }
        break;
      }

      // ── Inside a JSX closing tag </Tag> ───────────────────────────────
      case 'tag-close': {
        if (ch === '>') {
          result.push(ch);
          state = jsxReturnStack.pop() || 'code';
        } else {
          result.push(ch);
        }
        break;
      }

      // ── JSX text content (between tags) — THIS IS WHERE WE ESCAPE ────
      case 'jsx-text': {
        switch (ch) {
        case '<': {
          if (next === '/') {
            // Closing tag: </Tag> or fragment </>
            state = 'tag-close';
            result.push(ch);
          } else if (/[A-Za-z]/.test(next) || next === '>') {
            // Child element or fragment
            parentBeforeTag = 'jsx-text';
            state = 'tag-open';
            result.push(ch);
          } else {
            // Bare `<` in text content → escape
            result.push('&lt;');
          }
        
        break;
        }
        case '{': {
          stateStack.push('jsx-text');
          state = 'jsx-expr';
          braceDepth = 1;
          result.push(ch);
        
        break;
        }
        case '>': {
          // Bare `>` in text content → ESCAPE
          result.push('&gt;');
        
        break;
        }
        default: {
          result.push(ch);
        }
        }
        break;
      }

      // ── Inside a JSX expression { ... } ───────────────────────────────
      case 'jsx-expr': {
        switch (ch) {
        case '"': 
        case "'": 
        case '`': {
          stateStack.push('jsx-expr');
          state = ch === '`' ? 'template' : 'string';
          stringDelim = ch;
          result.push(ch);
        
        break;
        }
        case '{': {
          braceDepth++;
          result.push(ch);
        
        break;
        }
        case '}': {
          braceDepth--;
          result.push(ch);
          if (braceDepth === 0) {
            state = stateStack.pop() || 'code';
          }
        
        break;
        }
        default: { if (ch === '<' && (/[A-Za-z]/.test(next) || next === '>')) {
          // JSX inside expression: {flag && <Tag>...</Tag>}
          parentBeforeTag = 'jsx-expr';
          state = 'tag-open';
          result.push(ch);
        } else if (ch === '/' && next === '/') {
          const end = code.indexOf('\n', i);
          const slice = end >= 0 ? code.slice(i, end) : code.slice(i);
          result.push(slice);
          i = end >= 0 ? end - 1 : code.length - 1;
        } else if (ch === '/' && next === '*') {
          const end = code.indexOf('*/', i + 2);
          if (end >= 0) {
            result.push(code.slice(i, end + 2));
            i = end + 1;
          } else {
            result.push(code.slice(i));
            i = code.length - 1;
          }
        } else {
          result.push(ch);
        }
        }
        }
        break;
      }

      // ── String literal ("..." or '...') ───────────────────────────────
      case 'string': {
        result.push(ch);
        if (ch === '\\' && i + 1 < code.length) {
          result.push(next);
          i++;
        } else if (ch === stringDelim) {
          state = stateStack.pop() || 'code';
        }
        break;
      }

      // ── Template literal (`...`) ──────────────────────────────────────
      case 'template': {
        result.push(ch);
        if (ch === '\\' && i + 1 < code.length) {
          result.push(next);
          i++;
        } else if (ch === '`') {
          state = stateStack.pop() || 'code';
        } else if (ch === '$' && next === '{') {
          result.push(next);
          i++;
          stateStack.push('template');
          state = 'jsx-expr';
          braceDepth = 1;
        }
        break;
      }
    }
  }

  return result.join('');
}
