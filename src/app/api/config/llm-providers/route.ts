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
 * Do NOT use NEXT_PUBLIC_POSTHOG_HOST — that's '/ingest' (client-side proxy).
 */
const POSTHOG_SERVER_HOST = 'https://us.i.posthog.com';

/**
 * SAFETY THRESHOLD: If PostHog returns more than this percentage of
 * flags as `false`, treat it as a misconfiguration and fall back to
 * all-enabled defaults. This prevents the "all models disappear" scenario.
 *
 * Example: 9 flags, threshold 60% → if 6+ flags are false, it's likely
 * a config issue (flags weren't set to 100% rollout).
 */
const MISCONFIGURATION_THRESHOLD = 0.6;

/**
 * GET /api/config/llm-providers
 *
 * Evaluates PostHog feature flags server-side via the /decide endpoint.
 * Returns which LLM providers are enabled for the current environment.
 *
 * FAIL-OPEN: If PostHog is unavailable or returns suspicious data,
 * all providers are enabled.
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

    const response = await fetch(decideUrl, {
      body: JSON.stringify(body),
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

    // Build provider map from PostHog response
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
      // If flag not in PostHog response, keep default (true) — fail-open
    }

    // SAFETY CHECK: If too many flags are false, it's likely a PostHog
    // misconfiguration (flags created with 0% rollout instead of 100%).
    // Fall back to defaults and only trust flags that are EXPLICITLY true.
    if (definedCount > 0 && falseCount / definedCount > MISCONFIGURATION_THRESHOLD) {
      console.warn(
        `[llm-providers] SAFETY: ${falseCount}/${definedCount} flags are false — ` +
          `likely misconfigured (0% rollout). Using opt-out mode instead.`,
      );

      // OPT-OUT MODE: Start with all enabled, then only disable flags
      // that are explicitly false AND have a matching condition
      // (i.e., PostHog intentionally disabled them, not just 0% default rollout).
      //
      // Heuristic: A flag is "intentionally disabled" if it returns false
      // AND other flags of the same type (llm-provider-*) return true.
      // Since most flags are false, we can't trust any of them.
      // Fall back to all-enabled defaults.
      return NextResponse.json({
        ...(showDebug && {
          debug: {
            action: 'safety_fallback',
            definedCount,
            environment,
            falseCount,
            posthogResponse: featureFlags,
            reason:
              'Too many flags are false. This usually means flags were created with 0% rollout. ' +
              'Fix: In PostHog, edit each flag → Release Conditions → set rollout to 100%.',
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
