import { NextResponse } from 'next/server';

import { VisionAnalysisService } from '@/services/vision-analysis';
import type { VisionAnalysisOptions } from '@/components/InteractiveUI/types';

/**
 * POST /api/interactive-ui/analyze
 *
 * Accepts an image URL and returns structured InteractiveRegions data.
 * Used by the chat UI to detect interactive regions in uploaded images.
 *
 * Request body:
 *   { imageUrl: string, options?: VisionAnalysisOptions }
 *
 * Response:
 *   VisionAnalysisResult
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageUrl, options } = body as {
      imageUrl: string;
      options?: VisionAnalysisOptions;
    };

    if (!imageUrl || !VisionAnalysisService.isValidImageSource(imageUrl)) {
      return NextResponse.json(
        { data: null, error: 'Invalid or missing imageUrl', model: 'none', success: false },
        { status: 400 },
      );
    }

    const result = await VisionAnalysisService.analyzeImage(imageUrl, options || {});

    return NextResponse.json(result, {
      status: result.success ? 200 : 502,
    });
  } catch (error) {
    console.error('[InteractiveUI/analyze] Error:', error);
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : 'Internal server error',
        model: 'none',
        success: false,
      },
      { status: 500 },
    );
  }
}
