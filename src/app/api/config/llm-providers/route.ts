import { NextResponse } from 'next/server';

/**
 * All llm-provider-* flags we care about.
 * If a flag doesn't exist in PostHog, it defaults to TRUE (fail-open).
 */
const LLM_PROVIDER_FLAGS = [
  'llm-provider-vertexai',
  'llm-provider-vercelaigateway',
  'llm-provider-anthropic',
  'llm-provider-openai',
  'llm-provider-google',
  'llm-provider-deepseek',
  'llm-provider-xai',
  'llm-provider-meta-llama',
  'llm-provider-groq',
];

interface LlmProvidersResponse {
  debug?: any;
  providers: Record<string, boolean>;
}

const POSTHOG_HOST = 'https://us.i.posthog.com';

/** Safety: if >60% flags are false, treat as misconfiguration */
const MISCONFIGURATION_THRESHOLD = 0.6;

/**
 * Ensure the server-side person exists in PostHog with correct properties.
 * This is fire-and-forget — doesn't block the response.
 * After the first call, PostHog processes the identify event (~5-10s),
 * and subsequent /decide calls work correctly.
 */
function ensurePersonExists(posthogKey: string, environment: string): void {
  fetch(`${POSTHOG_HOST}/capture/`, {
    body: JSON.stringify({
      api_key: posthogKey,
      distinct_id: `server-${environment}`,
      event: '$identify',
      properties: {
        $set: { environment },
      },
      timestamp: new Date().toISOString(),
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  }).catch(() => {
    // Fire-and-forget: don't fail the main request
  });
}

/**
 * GET /api/config/llm-providers
 *
 * Evaluates PostHog feature flags server-side.
 * On first call, identifies the server person to PostHog.
 * After ~10 seconds, subsequent calls get correct flag evaluations.
 *
 * FAIL-OPEN: all providers enabled by default.
 * Add ?debug=1 for troubleshooting.
 */
export async function GET(request: Request): Promise<NextResponse<LlmProvidersResponse>> {
  const url = new URL(request.url);
  const showDebug = url.searchParams.get('debug') === '1';
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || 'development';

  // Default: all providers enabled (fail-open)
  const defaults: Record<string, boolean> = {};
  for (const flag of LLM_PROVIDER_FLAGS) {
    defaults[flag] = true;
  }

  if (!posthogKey) {
    return NextResponse.json({
      ...(showDebug && { debug: { reason: 'no_posthog_key' } }),
      providers: defaults,
    });
  }

  // Always ensure the person exists (fire-and-forget)
  ensurePersonExists(posthogKey, environment);

  try {
    const response = await fetch(`${POSTHOG_HOST}/decide?v=3`, {
      body: JSON.stringify({
        api_key: posthogKey,
        distinct_id: `server-${environment}`,
        person_properties: { environment },
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      return NextResponse.json({
        ...(showDebug && { debug: { reason: 'posthog_error', status: response.status } }),
        providers: defaults,
      });
    }

    const data = await response.json();
    const featureFlags: Record<string, boolean | string> = data.featureFlags || {};

    // Build provider map
    const providers: Record<string, boolean> = { ...defaults };
    let falseCount = 0;
    let definedCount = 0;

    for (const flag of LLM_PROVIDER_FLAGS) {
      if (flag in featureFlags) {
        definedCount++;
        const value = !!featureFlags[flag];
        providers[flag] = value;
        if (!value) falseCount++;
      }
    }

    // Safety: if too many flags are false, likely misconfiguration or person not yet identified
    if (definedCount > 0 && falseCount / definedCount > MISCONFIGURATION_THRESHOLD) {
      return NextResponse.json({
        ...(showDebug && {
          debug: {
            action: 'safety_fallback',
            definedCount,
            environment,
            falseCount,
            hint: 'Person may not be identified yet. Wait ~30s and try again.',
            posthogResponse: featureFlags,
          },
        }),
        providers: defaults,
      });
    }

    return NextResponse.json({
      ...(showDebug && {
        debug: {
          definedCount,
          environment,
          falseCount,
          posthogResponse: featureFlags,
          status: 'ok',
        },
      }),
      providers,
    });
  } catch (error) {
    return NextResponse.json({
      ...(showDebug && { debug: { error: String(error), reason: 'exception' } }),
      providers: defaults,
    });
  }
}
