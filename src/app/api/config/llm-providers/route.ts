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

/**
 * PostHog host for SERVER-SIDE calls.
 * IMPORTANT: Do NOT use NEXT_PUBLIC_POSTHOG_HOST here — that is set to '/ingest'
 * (a client-side reverse proxy) which is a relative URL that doesn't work
 * in server-side fetch() calls.
 */
const POSTHOG_SERVER_HOST = 'https://us.i.posthog.com';

/**
 * GET /api/config/llm-providers
 *
 * Evaluates PostHog feature flags server-side via the /decide endpoint.
 * Returns which LLM providers are enabled for the current environment.
 *
 * FAIL-OPEN: If PostHog is unavailable, all providers are enabled.
 *
 * Add ?debug=1 to see raw PostHog response for troubleshooting.
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
    console.warn('[llm-providers] PostHog key not configured, returning all providers enabled');
    return NextResponse.json({
      ...(showDebug && { debug: { reason: 'no_posthog_key' } }),
      providers: defaults,
    });
  }

  try {
    const decideUrl = `${POSTHOG_SERVER_HOST}/decide?v=3`;
    const body = {
      api_key: posthogKey,
      distinct_id: `server-${environment}`,
      person_properties: {
        environment,
      },
    };

    console.info('[llm-providers] Calling PostHog /decide:', {
      environment,
      host: POSTHOG_SERVER_HOST,
      url: decideUrl,
    });

    const response = await fetch(decideUrl, {
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      console.error(`[llm-providers] PostHog /decide returned ${response.status}`);
      return NextResponse.json({
        ...(showDebug && { debug: { reason: 'posthog_error', status: response.status } }),
        providers: defaults,
      });
    }

    const data = await response.json();
    const featureFlags: Record<string, boolean | string> = data.featureFlags || {};

    // Build provider map: only override defaults for flags that PostHog explicitly returns
    const providers: Record<string, boolean> = { ...defaults };
    for (const flag of LLM_PROVIDER_FLAGS) {
      if (flag in featureFlags) {
        providers[flag] = !!featureFlags[flag];
      }
      // If flag not in PostHog response, keep default (true) — fail-open
    }

    console.info('[llm-providers] Flags evaluated:', { environment, featureFlags, providers });

    return NextResponse.json({
      ...(showDebug && {
        debug: {
          distinctId: `server-${environment}`,
          environment,
          posthogResponse: featureFlags,
        },
      }),
      providers,
    });
  } catch (error) {
    console.error('[llm-providers] Failed to evaluate PostHog flags:', error);
    return NextResponse.json({
      ...(showDebug && { debug: { error: String(error), reason: 'exception' } }),
      providers: defaults,
    });
  }
}
