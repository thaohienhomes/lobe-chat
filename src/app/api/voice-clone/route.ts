import { llmEnv } from '@/envs/llm';

export const runtime = 'edge';

/**
 * Handle Voice Cloning (Add Voice, List Voices, Delete Voice)
 */

export const GET = async () => {
  try {
    const apiKey = llmEnv.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY is not set' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    const data = await response.json();

    // Filter for custom voices only if needed, or return all
    // Standard ElevenLabs free tier has 3 voice slots
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

export const POST = async (req: Request) => {
  try {
    const apiKey = llmEnv.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY is not set' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const formData = await req.formData();

    // Validate required fields
    if (!formData.has('name') || !formData.has('files')) {
      return new Response(JSON.stringify({ error: 'name and files are required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      body: formData,
      headers: {
        'xi-api-key': apiKey,
      },
      method: 'POST',
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: response.status,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

export const DELETE = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const voiceId = searchParams.get('voice_id');
    const apiKey = llmEnv.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY is not set' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    if (!voiceId) {
      return new Response(JSON.stringify({ error: 'voice_id is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      headers: {
        'xi-api-key': apiKey,
      },
      method: 'DELETE',
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: response.status,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};
