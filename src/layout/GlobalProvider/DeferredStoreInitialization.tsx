'use client';

import { memo, useEffect, useState } from 'react';

import { enableNextAuth } from '@/const/auth';
import { useAgentStore } from '@/store/agent';
import { useAiInfraStore } from '@/store/aiInfra';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
import { useServerConfigStore } from '@/store/serverConfig';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

/**
 * Inner component that actually initializes the deferred stores.
 * Only mounts after the browser signals idle time.
 */
const DeferredStores = memo(() => {
  const { serverConfig } = useServerConfigStore();

  const [isLogin, isSignedIn, useInitUserState] = useUserStore((s) => [
    authSelectors.isLogin(s),
    s.isSignedIn,
    s.useInitUserState,
  ]);

  const useInitAgentStore = useAgentStore((s) => s.useInitInboxAgentStore);
  const useInitAiProviderKeyVaults = useAiInfraStore((s) => s.useFetchAiProviderRuntimeState);

  const isDBInited = useGlobalStore(systemStatusSelectors.isDBInited);
  const isLoginOnInit = isDBInited && (enableNextAuth ? isSignedIn : isLogin);

  // init inbox agent and default agent config
  useInitAgentStore(isLoginOnInit, serverConfig.defaultAgent?.config);

  // init user provider key vaults (heavy — imports model-bank dynamically)
  useInitAiProviderKeyVaults(isLoginOnInit);

  // init user state
  useInitUserState(isLoginOnInit, serverConfig);

  return null;
});

DeferredStores.displayName = 'DeferredStores';

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

  return <DeferredStores />;
});

DeferredStoreInitialization.displayName = 'DeferredStoreInitialization';

export default DeferredStoreInitialization;
