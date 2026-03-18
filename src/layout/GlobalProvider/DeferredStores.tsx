'use client';

import { memo } from 'react';

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
 *
 * This is in a separate file so that React.lazy() creates a separate webpack chunk
 * for all the store imports (agent, aiInfra, user) — avoiding main thread blocking
 * during initial page load.
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

export default DeferredStores;
