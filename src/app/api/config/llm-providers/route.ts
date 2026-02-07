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
  providers: Record<string, boolean>;
}

/**
 * GET /api/config/llm-providers
 *
 * Evaluates PostHog feature flags server-side and returns
 * which LLM providers are enabled for the current environment.
 *
 * FAIL-OPEN: If PostHog is unavailable, all providers are enabled.
 */
export async function GET(): Promise<NextResponse<LlmProvidersResponse>> {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  const environment = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV || 'development';

  // Default: all providers enabled (fail-open)
  const defaults: Record<string, boolean> = {};
  for (const flag of LLM_PROVIDER_FLAGS) {
    defaults[flag] = true;
  }

  if (!posthogKey) {
    console.warn('[llm-providers] PostHog key not configured, returning all providers enabled');
    return NextResponse.json(
      { providers: defaults },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    );
  }

  try {
    // Use PostHog's /decide endpoint to evaluate flags server-side
    // See: https://posthog.com/docs/api/decide
    const response = await fetch(`${posthogHost}/decide?v=3`, {
      body: JSON.stringify({
        api_key: posthogKey,
        distinct_id: `server-${environment}`,
        person_properties: {
          environment,
        },
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      console.error(`[llm-providers] PostHog /decide returned ${response.status}`);
      return NextResponse.json(
        { providers: defaults },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        },
      );
    }

    const data = await response.json();
    const featureFlags: Record<string, boolean> = data.featureFlags || {};

    // Build provider map: only override defaults for flags that exist in PostHog
    const providers: Record<string, boolean> = { ...defaults };
    for (const flag of LLM_PROVIDER_FLAGS) {
      if (flag in featureFlags) {
        providers[flag] = !!featureFlags[flag];
      }
      // If flag not in PostHog response, keep default (true) — fail-open
    }

    console.info('[llm-providers] Flags evaluated:', { environment, providers });

    return NextResponse.json(
      { providers },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      },
    );
  } catch (error) {
    console.error('[llm-providers] Failed to evaluate PostHog flags:', error);
    return NextResponse.json(
      { providers: defaults },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      },
    );
  }
}
