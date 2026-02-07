import { llmEnv } from '@/envs/llm';

// Use Node.js runtime for file upload support (Edge has ~4MB body size limit)
export const runtime = 'nodejs';

// Increase body size limit for audio uploads (default is 1MB)
export const maxDuration = 30;

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

    const incomingFormData = await req.formData();

    // Validate required fields
    const name = incomingFormData.get('name');
    const files = incomingFormData.getAll('files');

    if (!name || files.length === 0) {
      return new Response(JSON.stringify({ error: 'name and files are required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Reconstruct FormData for ElevenLabs API
    // ElevenLabs expects: name (string), files (File[])
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append('name', name as string);

    for (const file of files) {
      if (file instanceof File) {
        elevenLabsFormData.append('files', file, file.name);
      }
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      body: elevenLabsFormData,
      headers: {
        'xi-api-key': apiKey,
      },
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('ElevenLabs voice clone error:', data);
      return new Response(
        JSON.stringify({
          error: data?.detail?.message || data?.detail || 'Failed to clone voice',
          status: response.status,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: response.status,
        },
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('Voice clone route error:', e);
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
