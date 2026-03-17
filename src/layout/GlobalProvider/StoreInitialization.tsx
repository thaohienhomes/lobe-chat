'use client';

import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { createStoreUpdater } from 'zustand-utils';

import { useIsMobile } from '@/hooks/useIsMobile';
import { useGlobalStore } from '@/store/global';
import { useServerConfigStore } from '@/store/serverConfig';
import { serverConfigSelectors } from '@/store/serverConfig/selectors';
import { useUserStore } from '@/store/user';

/**
 * Phase 1: Critical Store Initialization
 *
 * Only initializes stores needed for the FIRST VISUAL RENDER:
 * - System status (theme mode, language — from localStorage, very fast)
 * - Server config (feature flags, default agent)
 * - OAuth SSO providers (for auth UI)
 * - Mobile detection + router (layout decisions)
 *
 * Non-critical stores (agent, AI provider, user state) are deferred
 * to DeferredStoreInitialization to avoid blocking FCP/LCP.
 */
const StoreInitialization = memo(() => {
  // prefetch error ns to avoid don't show error content correctly
  useTranslation('error');

  const router = useRouter();

  // init the system preference (fast — reads from localStorage)
  const useInitSystemStatus = useGlobalStore((s) => s.useInitSystemStatus);
  useInitSystemStatus();

  // fetch server config (needed for feature flags, auth config)
  const useFetchServerConfig = useServerConfigStore((s) => s.useInitServerConfig);
  useFetchServerConfig();

  // Update NextAuth status (needed for auth UI)
  const useUserStoreUpdater = createStoreUpdater(useUserStore);
  const oAuthSSOProviders = useServerConfigStore(serverConfigSelectors.oAuthSSOProviders);
  useUserStoreUpdater('oAuthSSOProviders', oAuthSSOProviders);

  // Mobile detection + router (needed for layout decisions)
  const useStoreUpdater = createStoreUpdater(useGlobalStore);
  const mobile = useIsMobile();
  useStoreUpdater('isMobile', mobile);
  useStoreUpdater('router', router);

  return null;
});

export default StoreInitialization;
