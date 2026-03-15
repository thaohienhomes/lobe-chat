import { describe, expect, it } from 'vitest';

import { FeatureFlagsSchema, mapFeatureFlagsEnvToState } from './schema';

describe('FeatureFlagsSchema', () => {
  it('should validate correct feature flags', () => {
    const result = FeatureFlagsSchema.safeParse({
      ai_image: true,
      create_session: true,
      dalle: true,
      edit_agent: false,
      language_model_settings: false,
      openai_api_key: true,
      openai_proxy_url: false,
      webrtc_sync: true,
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid feature flags', () => {
    const result = FeatureFlagsSchema.safeParse({
      edit_agent: 'yes', // Invalid type, should be boolean
    });

    expect(result.success).toBe(false);
  });
});

describe('mapFeatureFlagsEnvToState', () => {
  it('should correctly map feature flags to state', () => {
    const config = {
      ai_image: true,
      check_updates: true,
      create_session: true,
      dalle: true,
      edit_agent: false,
      language_model_settings: false,
      openai_api_key: true,
      openai_proxy_url: false,
      webrtc_sync: true,
      welcome_suggest: true,
    };

    const expectedState = {
      enableCheckUpdates: true,
      isAgentEditable: false,
      showAiImage: true,
      showCreateSession: true,
      showDalle: true,
      showLLM: false,
      showOpenAIApiKey: true,
      showOpenAIProxyUrl: false,
      showWelcomeSuggest: true,
    };

    const mappedState = mapFeatureFlagsEnvToState(config);

    expect(mappedState).toEqual(expectedState);
  });
});
