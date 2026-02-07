import { auth } from '@clerk/nextjs/server';

import { llmEnv } from '@/envs/llm';

// Use Node.js runtime for file upload support (Edge has ~4MB body size limit)
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Voice clone file upload constraints
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  'audio/flac',
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'audio/x-wav',
]);

/**
 * Simple in-memory rate limiter for voice clone
 * Max 5 clone operations per user per hour
 */
const cloneRateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkCloneRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = cloneRateMap.get(userId);

  if (!entry || now > entry.resetAt) {
    cloneRateMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

/**
 * Helper: require ElevenLabs API key
 */
function getApiKeyOrError(): { apiKey?: string; error?: Response } {
  const apiKey = llmEnv.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return {
      error: new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY is not set' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      }),
    };
  }
  return { apiKey };
}

/**
 * Helper: require authenticated user
 */
async function requireAuth(): Promise<{ error?: Response; userId?: string }> {
  const { userId } = await auth();
  if (!userId) {
    return {
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      }),
    };
  }
  return { userId };
}

// ─────────────────────────────────────────────
// GET — List voices
// ─────────────────────────────────────────────
export const GET = async () => {
  try {
    const { error: authErr } = await requireAuth();
    if (authErr) return authErr;

    const { apiKey, error: keyErr } = getApiKeyOrError();
    if (keyErr) return keyErr;

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey! },
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

// ─────────────────────────────────────────────
// POST — Clone a voice (with validation)
// ─────────────────────────────────────────────
export const POST = async (req: Request) => {
  try {
    const { userId, error: authErr } = await requireAuth();
    if (authErr) return authErr;

    const { apiKey, error: keyErr } = getApiKeyOrError();
    if (keyErr) return keyErr;

    // Rate limit
    if (!checkCloneRateLimit(userId!)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded — max 5 clone operations per hour' }),
        { headers: { 'Content-Type': 'application/json' }, status: 429 },
      );
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

    // Validate each uploaded file
    for (const file of files) {
      if (!(file instanceof File)) continue;

      // Size check
      if (file.size > MAX_FILE_SIZE) {
        return new Response(
          JSON.stringify({
            error: `File "${file.name}" exceeds 10 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 400 },
        );
      }

      // MIME type check
      if (!ALLOWED_TYPES.has(file.type)) {
        return new Response(
          JSON.stringify({
            allowedTypes: [...ALLOWED_TYPES],
            error: `File "${file.name}" has unsupported type "${file.type}". Use WAV, MP3, or OGG.`,
          }),
          { headers: { 'Content-Type': 'application/json' }, status: 400 },
        );
      }
    }

    // Reconstruct FormData for ElevenLabs API
    const elevenLabsFormData = new FormData();
    elevenLabsFormData.append('name', name as string);

    for (const file of files) {
      if (file instanceof File) {
        elevenLabsFormData.append('files', file, file.name);
      }
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      body: elevenLabsFormData,
      headers: { 'xi-api-key': apiKey! },
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
        { headers: { 'Content-Type': 'application/json' }, status: response.status },
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

// ─────────────────────────────────────────────
// DELETE — Remove a cloned voice
// ─────────────────────────────────────────────
export const DELETE = async (req: Request) => {
  try {
    const { error: authErr } = await requireAuth();
    if (authErr) return authErr;

    const { searchParams } = new URL(req.url);
    const voiceId = searchParams.get('voice_id');

    const { apiKey, error: keyErr } = getApiKeyOrError();
    if (keyErr) return keyErr;

    if (!voiceId) {
      return new Response(JSON.stringify({ error: 'voice_id is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      headers: { 'xi-api-key': apiKey! },
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
