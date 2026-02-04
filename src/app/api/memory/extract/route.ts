/**
 * Memory Extraction API Endpoint
 * Uses LLM to extract user memories from chat messages
 */
import { NextRequest, NextResponse } from 'next/server';

import { getLLMConfig } from '@/envs/llm';

export async function POST(request: NextRequest) {
  try {
    const { messages, prompt } = await request.json();

    if (!messages || typeof messages !== 'string') {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    const { OPENAI_API_KEY } = getLLMConfig();

    if (!OPENAI_API_KEY) {
      // Return empty memories if no API key configured
      return NextResponse.json({ memories: [] });
    }

    // Call LLM for extraction using OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      body: JSON.stringify({
        messages: [
          { content: prompt, role: 'system' },
          { content: messages, role: 'user' },
        ],
        model: 'gpt-4o-mini', // Use fast, cheap model for extraction
        response_format: { type: 'json_object' },
        temperature: 0.3, // Low temperature for consistent extraction
      }),
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Memory Extraction] LLM call failed:', error);
      // Return empty memories on failure
      return NextResponse.json({ memories: [] });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{"memories": []}';

    return new NextResponse(content, {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('[Memory Extraction] Error:', error);
    // Return empty memories on error
    return NextResponse.json({ memories: [] });
  }
}
