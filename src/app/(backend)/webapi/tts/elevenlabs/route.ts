import { llmEnv } from '@/envs/llm';

export const runtime = 'edge';

export const POST = async (req: Request) => {
  try {
    const {
      text,
      voice_id,
      model_id = 'eleven_multilingual_v2',
      voice_settings,
    } = await req.json();

    const apiKey = llmEnv.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY is not set' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    if (!voice_id) {
      return new Response(JSON.stringify({ error: 'voice_id is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      body: JSON.stringify({
        model_id,
        text,
        voice_settings,
      }),
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      return new Response(JSON.stringify(error), {
        headers: { 'Content-Type': 'application/json' },
        status: response.status,
      });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};
