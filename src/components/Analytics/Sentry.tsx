'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Sentry error tracking component
 * Initializes Sentry on the client side and sets up error boundary
 */
const SentryComponent = () => {
  useEffect(() => {
    // Sentry is already initialized in sentry.client.config.ts
    // This component just ensures it's loaded on the client
    if (process.env.NEXT_PUBLIC_ENABLE_SENTRY === 'true') {
      console.debug('[Sentry] Error tracking enabled');
    }
  }, []);

  return null;
};

export default SentryComponent;

