'use client';

import { useEffect } from 'react';

/**
 * SSOCallbackWatchdog
 *
 * Detects when the user is stuck on a Clerk SSO callback URL
 * (e.g., /chat#/sso-callback?...) and hasn't been redirected
 * after a timeout. This happens when:
 *   - Clerk JS fails to load (CDN timeout, network issues)
 *   - The SSO callback processing encounters an error
 *   - Browser blocks the Clerk script
 *
 * After TIMEOUT_MS (15s), it strips the hash fragment and
 * navigates the user to the intended redirect URL or falls
 * back to the homepage.
 */

const SSO_HASH_PATTERN = /^#\/sso-callback/;
const TIMEOUT_MS = 15_000; // 15 seconds

const SSOCallbackWatchdog = () => {
  useEffect(() => {
    const hash = window.location.hash;

    // Only activate if we're on an SSO callback URL
    if (!SSO_HASH_PATTERN.test(hash)) return;

    console.warn(
      `[SSOCallbackWatchdog] Detected SSO callback hash: ${hash}. Starting ${TIMEOUT_MS / 1000}s watchdog timer.`,
    );

    const timer = setTimeout(() => {
      // Still on SSO callback after timeout → Clerk failed to process
      if (!SSO_HASH_PATTERN.test(window.location.hash)) {
        console.log('[SSOCallbackWatchdog] SSO callback resolved normally, no action needed.');
        return;
      }

      console.error(
        '[SSOCallbackWatchdog] SSO callback stuck! Redirecting user to recover.',
      );

      // Try to extract the intended redirect URL from the hash params
      try {
        const hashParams = new URLSearchParams(hash.replace('#/sso-callback?', ''));
        const redirectUrl =
          hashParams.get('sign_in_fallback_redirect_url') ||
          hashParams.get('after_sign_in_url') ||
          hashParams.get('redirect_url');

        if (redirectUrl) {
          // Parse the redirect URL — if it's the same origin, navigate there
          const target = new URL(redirectUrl, window.location.origin);
          if (target.origin === window.location.origin) {
            window.location.href = target.pathname + target.search;
            return;
          }
        }
      } catch {
        // URL parsing failed, fall through to default
      }

      // Default: navigate to homepage (strips the stuck hash)
      window.location.href = '/';
    }, TIMEOUT_MS);

    // If the hash changes (Clerk processes the callback), cancel the timer
    const handleHashChange = () => {
      if (!SSO_HASH_PATTERN.test(window.location.hash)) {
        console.log('[SSOCallbackWatchdog] SSO callback resolved via hash change.');
        clearTimeout(timer);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return null; // Render nothing — pure side-effect component
};

export default SSOCallbackWatchdog;
