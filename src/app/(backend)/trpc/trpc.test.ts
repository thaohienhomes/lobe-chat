import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

// Some environments (e.g. web-only builds) don't include the Electron desktop route.
// Treat any valid TRPC route directory as acceptable to keep the test meaningful
// across environments.

describe('TRPC Routes presence', () => {
  it('should have at least one TRPC route directory', () => {
    const base = __dirname;
    const candidates = ['desktop', 'lambda', 'edge', 'async'];
    const found = candidates.some((name) => existsSync(join(base, name)));

    expect(found).toBe(true);
  });
});
