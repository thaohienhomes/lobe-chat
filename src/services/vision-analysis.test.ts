import { beforeEach, describe, expect, it, vi } from 'vitest';

import { VisionAnalysisService } from './vision-analysis';

// Mock the server-side ModelRuntime module
vi.mock('@/server/modules/ModelRuntime', () => ({
  initModelRuntimeWithUserPayload: vi.fn(),
}));

const VALID_AI_RESPONSE = JSON.stringify({
  context: 'A chest X-ray showing normal anatomy',
  image_type: 'anatomy',
  regions: [
    {
      bounds: { h: 55, w: 35, x: 10, y: 15 },
      color: '#4ECDC4',
      details: { finding: 'Normal', opacity: 'Clear' },
      follow_ups: ['What does a normal lung look like?', 'Any abnormalities?'],
      id: 'right-lung',
      label: 'Right Lung',
    },
    {
      bounds: { h: 55, w: 35, x: 55, y: 15 },
      color: '#FF6B6B',
      details: { finding: 'Normal' },
      follow_ups: ['What about the left lung?'],
      id: 'left-lung',
      label: 'Left Lung',
    },
  ],
});

function createMockRuntime(responseText: string) {
  // Return a plain string — streamToText handles strings directly (bypass SSE parsing)
  return {
    chat: vi.fn().mockImplementation(() => Promise.resolve(responseText)),
  };
}

describe('VisionAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeImage', () => {
    it('should parse a valid vision AI response into InteractiveRegions', async () => {
      const { initModelRuntimeWithUserPayload } = await import(
        '@/server/modules/ModelRuntime'
      );
      vi.mocked(initModelRuntimeWithUserPayload).mockResolvedValue(
        createMockRuntime(VALID_AI_RESPONSE) as any,
      );

      const result = await VisionAnalysisService.analyzeImage('https://example.com/xray.jpg');

      expect(result.success).toBe(true);
      expect(result.data).not.toBeNull();
      expect(result.data!.image_type).toBe('anatomy');
      expect(result.data!.context).toBe('A chest X-ray showing normal anatomy');
      expect(result.data!.regions).toHaveLength(2);
    });

    it('should parse regions with correct percentage bounds', async () => {
      const { initModelRuntimeWithUserPayload } = await import(
        '@/server/modules/ModelRuntime'
      );
      vi.mocked(initModelRuntimeWithUserPayload).mockResolvedValue(
        createMockRuntime(VALID_AI_RESPONSE) as any,
      );

      const result = await VisionAnalysisService.analyzeImage('https://example.com/xray.jpg');
      const region = result.data!.regions[0];

      expect(region.id).toBe('right-lung');
      expect(region.label).toBe('Right Lung');
      expect(region.bounds).toEqual({ h: 55, w: 35, x: 10, y: 15 });
      expect(region.color).toBe('#4ECDC4');
      expect(region.details).toEqual({ finding: 'Normal', opacity: 'Clear' });
      expect(region.follow_ups).toEqual([
        'What does a normal lung look like?',
        'Any abnormalities?',
      ]);
    });

    it('should handle response wrapped in markdown code fences', async () => {
      const wrappedResponse = '```json\n' + VALID_AI_RESPONSE + '\n```';
      const { initModelRuntimeWithUserPayload } = await import(
        '@/server/modules/ModelRuntime'
      );
      vi.mocked(initModelRuntimeWithUserPayload).mockResolvedValue(
        createMockRuntime(wrappedResponse) as any,
      );

      const result = await VisionAnalysisService.analyzeImage('https://example.com/img.jpg');

      expect(result.success).toBe(true);
      expect(result.data!.regions).toHaveLength(2);
    });

    it('should handle response with extra text around JSON', async () => {
      const responseWithExtra = 'Here is the analysis:\n' + VALID_AI_RESPONSE + '\nDone.';
      const { initModelRuntimeWithUserPayload } = await import(
        '@/server/modules/ModelRuntime'
      );
      vi.mocked(initModelRuntimeWithUserPayload).mockResolvedValue(
        createMockRuntime(responseWithExtra) as any,
      );

      const result = await VisionAnalysisService.analyzeImage('https://example.com/img.jpg');

      expect(result.success).toBe(true);
      expect(result.data!.image_type).toBe('anatomy');
    });

    it('should clamp out-of-range bound values', async () => {
      const outOfRange = JSON.stringify({
        context: 'Test',
        image_type: 'photo',
        regions: [
          {
            bounds: { h: 150, w: -5, x: 200, y: -10 },
            color: '#FF0000',
            details: {},
            follow_ups: [],
            id: 'test',
            label: 'Test',
          },
        ],
      });
      const { initModelRuntimeWithUserPayload } = await import(
        '@/server/modules/ModelRuntime'
      );
      vi.mocked(initModelRuntimeWithUserPayload).mockResolvedValue(
        createMockRuntime(outOfRange) as any,
      );

      const result = await VisionAnalysisService.analyzeImage('https://example.com/img.jpg');

      expect(result.success).toBe(true);
      const bounds = result.data!.regions[0].bounds;
      expect(bounds.x).toBeLessThanOrEqual(100);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.w).toBeGreaterThanOrEqual(1);
      expect(bounds.h).toBeLessThanOrEqual(100);
    });

    it('should default invalid image_type to photo', async () => {
      const invalidType = JSON.stringify({
        context: 'Test',
        image_type: 'invalid_type',
        regions: [],
      });
      const { initModelRuntimeWithUserPayload } = await import(
        '@/server/modules/ModelRuntime'
      );
      vi.mocked(initModelRuntimeWithUserPayload).mockResolvedValue(
        createMockRuntime(invalidType) as any,
      );

      const result = await VisionAnalysisService.analyzeImage('https://example.com/img.jpg');

      expect(result.success).toBe(true);
      expect(result.data!.image_type).toBe('photo');
    });

    it('should filter out regions missing required fields', async () => {
      const incompleteRegions = JSON.stringify({
        context: 'Test',
        image_type: 'photo',
        regions: [
          { bounds: { h: 10, w: 10, x: 0, y: 0 }, color: '#FF0000', id: 'valid', label: 'Valid' },
          { color: '#00FF00', id: 'no-bounds', label: 'No Bounds' },
          { bounds: { h: 10, w: 10, x: 50, y: 50 }, color: '#0000FF', id: 'no-label' },
          null,
        ],
      });
      const { initModelRuntimeWithUserPayload } = await import(
        '@/server/modules/ModelRuntime'
      );
      vi.mocked(initModelRuntimeWithUserPayload).mockResolvedValue(
        createMockRuntime(incompleteRegions) as any,
      );

      const result = await VisionAnalysisService.analyzeImage('https://example.com/img.jpg');

      expect(result.success).toBe(true);
      expect(result.data!.regions).toHaveLength(1);
      expect(result.data!.regions[0].id).toBe('valid');
    });

    it('should default invalid color to fallback hex', async () => {
      const badColor = JSON.stringify({
        context: 'Test',
        image_type: 'photo',
        regions: [
          {
            bounds: { h: 10, w: 10, x: 0, y: 0 },
            color: 'not-a-color',
            details: {},
            follow_ups: [],
            id: 'r1',
            label: 'Region',
          },
        ],
      });
      const { initModelRuntimeWithUserPayload } = await import(
        '@/server/modules/ModelRuntime'
      );
      vi.mocked(initModelRuntimeWithUserPayload).mockResolvedValue(
        createMockRuntime(badColor) as any,
      );

      const result = await VisionAnalysisService.analyzeImage('https://example.com/img.jpg');

      expect(result.data!.regions[0].color).toBe('#4ECDC4');
    });

    it('should return failure when all models fail', async () => {
      const { initModelRuntimeWithUserPayload } = await import(
        '@/server/modules/ModelRuntime'
      );
      vi.mocked(initModelRuntimeWithUserPayload).mockRejectedValue(new Error('Model unavailable'));

      const result = await VisionAnalysisService.analyzeImage('https://example.com/img.jpg');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });

  describe('isValidImageSource', () => {
    it('should accept https URLs', () => {
      expect(VisionAnalysisService.isValidImageSource('https://example.com/img.jpg')).toBe(true);
    });

    it('should accept http URLs', () => {
      expect(VisionAnalysisService.isValidImageSource('http://example.com/img.jpg')).toBe(true);
    });

    it('should accept base64 data URIs', () => {
      expect(VisionAnalysisService.isValidImageSource('data:image/png;base64,abc123')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(VisionAnalysisService.isValidImageSource('')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(VisionAnalysisService.isValidImageSource('not-a-url')).toBe(false);
    });
  });
});
