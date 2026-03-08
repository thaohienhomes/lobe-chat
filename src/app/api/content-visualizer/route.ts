import { NextResponse } from 'next/server';

import type { PipelineInput } from '@/services/content-visualizer/pipeline';
import { runPipeline } from '@/services/content-visualizer/pipeline';

/**
 * POST /api/content-visualizer
 *
 * Accepts content input and returns a ContentVisualizerArtifact.
 *
 * Request body:
 *   PipelineInput (url?, filePath?, text?, topic?, language?, useAsyncScoring?)
 *
 * Response:
 *   { success: boolean, artifact?: ContentVisualizerArtifact, error?: string }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as PipelineInput & { llmConfig?: Record<string, unknown> };
    const { filePath, language, text, topic, url, useAsyncScoring } = body;

    // Validate at least one input source is provided
    if (!url && !filePath && !text && !topic) {
      return NextResponse.json(
        { error: 'At least one input source (url, filePath, text, or topic) is required', success: false },
        { status: 400 },
      );
    }

    // LLM call stub — to be replaced with actual LLM integration
    // The orchestrator layer should inject the real LLM call function
    const llmCall = async (_systemPrompt: string, _userMessage: string): Promise<string> => {
      return JSON.stringify({
        error: 'LLM integration not yet configured. Connect your LLM provider in the orchestrator.',
      });
    };

    const input: PipelineInput = {
      filePath,
      language,
      text,
      topic,
      url,
      useAsyncScoring,
    };

    const result = await runPipeline(input, llmCall);

    return NextResponse.json({
      artifact: result.artifact,
      success: true,
    });
  } catch (error) {
    console.error('[ContentVisualizer/pipeline] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
      },
      { status: 500 },
    );
  }
}
