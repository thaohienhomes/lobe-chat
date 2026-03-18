import { describe, expect, it, vi } from 'vitest';

import { featureFlagsSelectors, serverConfigSelectors } from './selectors';
import { initServerConfigStore } from './store';

vi.mock('zustand/traditional');

describe('featureFlagsSelectors', () => {
  it('should return mapped feature flags from store', () => {
    const store = initServerConfigStore({
      featureFlags: {
        edit_agent: false,
        language_model_settings: false,
      },
    });

    const result = featureFlagsSelectors(store.getState());

    expect(result).toEqual({
      enableCheckUpdates: true,
      enableClerkSignUp: true,
      enableKnowledgeBase: true,
      enablePlugins: true,
      enableRAGEval: false,
      enableSTT: true,
      hideDocs: false,
      hideGitHub: true,
      isAgentEditable: false,
      showAiImage: true,
      showApiKeyManage: false,
      showChangelog: true,
      showCloudPromotion: false,
      showCreateSession: true,
      showDalle: true,
      showLLM: false,
      showMarket: true,
      showOpenAIApiKey: false,
      showOpenAIProxyUrl: false,
      showPinList: false,
      showProvider: false,
      showWelcomeSuggest: true,
    });
  });
});

describe('serverConfigSelectors', () => {
  describe('enabledOAuthSSO', () => {
    it('should return enabledOAuthSSO value from store', () => {
      const store = initServerConfigStore({
        serverConfig: {
          aiProvider: {},
          enabledOAuthSSO: true,
          telemetry: {},
        },
      });

      const result = serverConfigSelectors.enabledOAuthSSO(store.getState());

      expect(result).toBe(true);
    });
  });

  describe('enabledTelemetryChat', () => {
    it('should return langfuse value from store when defined', () => {
      const store = initServerConfigStore({
        serverConfig: {
          aiProvider: {},
          telemetry: { langfuse: true },
        },
      });

      const result = serverConfigSelectors.enabledTelemetryChat(store.getState());

      expect(result).toBe(true);
    });

    it('should return false when langfuse is not defined', () => {
      const store = initServerConfigStore({
        serverConfig: {
          aiProvider: {},
          telemetry: {},
        },
      });

      const result = serverConfigSelectors.enabledTelemetryChat(store.getState());

      expect(result).toBe(false);
    });
  });
});
