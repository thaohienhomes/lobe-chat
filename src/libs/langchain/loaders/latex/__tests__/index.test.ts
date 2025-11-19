// @vitest-environment node
import * as fs from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';

import { LatexLoader } from '../index';

describe('LatexLoader', () => {
  it('should run', async () => {
    const content = fs.readFileSync(join(__dirname, `./demo.tex`), 'utf-8');

    const data = await LatexLoader(content);

    expect(data.length).toBeGreaterThan(1);

    const combined = data.map((doc) => doc.pageContent).join('\n');

    expect(combined).toContain('\\section{Introduction}');
    expect(combined).toContain('\\section{Tables}');
    expect(combined).toContain('\\section{Figures}');
  });
});
