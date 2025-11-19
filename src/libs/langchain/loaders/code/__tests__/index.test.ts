// @vitest-environment node
import * as fs from 'node:fs';
import { join } from 'node:path';

import { CodeLoader } from '../index';

describe('CodeLoader', () => {
  it('split simple code', async () => {
    const jsCode = `function helloWorld() {
  console.log("Hello, World!");
}
// Call the function
helloWorld();`;

    const result = await CodeLoader(jsCode, 'js');

    expect(result).toEqual([
      {
        pageContent:
          'function helloWorld() {\n  console.log("Hello, World!");\n}\n// Call the function\nhelloWorld();',
        metadata: { loc: { lines: { from: 1, to: 5 } } },
      },
    ]);
  });

  it('split long', async () => {
    const code = fs.readFileSync(join(__dirname, `./long.txt`), 'utf-8');

    const result = await CodeLoader(code, 'js');

    // Should produce multiple non-empty chunks
    expect(result.length).toBeGreaterThan(1);
    expect(result.every((doc) => doc.pageContent.trim().length > 0)).toBe(true);

    // Combined content should contain key parts of the original code
    const combined = result.map((doc) => doc.pageContent).join('\n');

    expect(combined).toContain('internal_createMessage');
    expect(combined).toContain('internal_fetchMessages');
  });
});
