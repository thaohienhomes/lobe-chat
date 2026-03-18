'use client';

import { Suspense, lazy, memo, useEffect, useState } from 'react';

// React.lazy creates a separate webpack chunk for DeferredStores and all its
// store imports (agent, aiInfra, user, model-bank). This prevents ~200KB+ of
// store code from being parsed/evaluated during the critical rendering path.
const LazyDeferredStores = lazy(() => import('./DeferredStores'));

/**
 * Phase 2: Deferred Store Initialization
 *
 * These stores are NOT needed for the initial visual render (sidebar, chat layout).
 * They are loaded after a short idle delay to avoid blocking FCP/LCP.
 *
 * Includes:
 * - Agent store (inbox agent config)
 * - AI Provider runtime state (model lists, provider key vaults)
 * - User state (user preferences, settings)
 *
 * This follows the pattern used by ChatGPT/Gemini where AI model configs
 * and user data are lazy-loaded after the initial shell renders.
 */
const DeferredStoreInitialization = memo(() => {
  const [shouldInit, setShouldInit] = useState(false);

  useEffect(() => {
    // Use requestIdleCallback to defer initialization until the browser is idle
    // This prevents store hydration from competing with the critical render path
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(
        () => {
          setShouldInit(true);
        },
        { timeout: 2000 }, // Max 2s delay even if browser stays busy
      );
      return () => cancelIdleCallback(id);
    }

    // Fallback for browsers without requestIdleCallback
    const timer = setTimeout(() => {
      setShouldInit(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!shouldInit) return null;

  return (
    <Suspense>
      <LazyDeferredStores />
    </Suspense>
  );
});

DeferredStoreInitialization.displayName = 'DeferredStoreInitialization';

export default DeferredStoreInitialization;
