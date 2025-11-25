// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import { POST as UniverseRoute } from '../[provider]/route';
import { POST } from './route';

vi.mock('../[provider]/route', () => ({
  POST: vi.fn().mockResolvedValue('mocked response'),
}));

// NOTE: Runtime configuration test removed because this route now uses Node.js runtime
// (not edge) due to subscription validation requiring database access

describe('Groq POST function tests', () => {
  it('should call UniverseRoute with correct parameters', async () => {
    const mockRequest = new Request('https://example.com', { method: 'POST' });
    await POST(mockRequest);
    expect(UniverseRoute).toHaveBeenCalledWith(mockRequest, {
      params: Promise.resolve({ provider: 'azureai' }),
    });
  });
});
