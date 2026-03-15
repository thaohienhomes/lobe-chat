import { HotkeyId } from '@/types/hotkey';
import { GlobalLLMProviderKey } from '@/types/user/settings';

import { UserStore } from '../../../store';
import { settingsSelectors } from './settings';

describe('settingsSelectors', () => {
  describe('currentSettings', () => {
    it('should merge DEFAULT_SETTINGS and s.settings correctly', () => {
      const s = {
        settings: {
          avatar: 'avatar.jpg',
          defaultAgent: {
            config: {
              model: 'gpt-3.5-turbo',
              params: {},
              systemRole: '',
              tts: {
                showAllLocaleVoice: false,
                sttLocale: 'auto',
                ttsService: 'openai',
                voice: {
                  openai: 'alloy',
                },
              },
            },
            meta: {
              avatar: 'Default Agent',
              description: 'Default agent for testing',
            },
          },
          fontSize: 14,
          language: 'en-US',
          languageModel: {
            openAI: {
              OPENAI_API_KEY: 'openai-api-key',
              endpoint: 'https://openai-endpoint.com',
              models: ['gpt-3.5-turbo'],
            },
          },
          neutralColor: 'sand',
          password: 'password123',
          primaryColor: 'blue',
          themeMode: 'light',
          tts: {
            openAI: {
              sttModel: 'whisper-1',
              ttsModel: 'tts-1',
            },
            sttAutoStop: true,
            sttServer: 'openai',
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.currentSettings(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('defaultAgent', () => {
    it('should merge DEFAULT_AGENT and s.settings.defaultAgent correctly', () => {
      const s = {
        settings: {
          defaultAgent: {
            config: {
              model: 'gpt-3.5-turbo',
              systemRole: 'user',
            },
            meta: {
              avatar: 'agent-avatar.jpg',
              description: 'Test agent',
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.defaultAgent(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('defaultAgentMeta', () => {
    it('should merge DEFAULT_AGENT_META and defaultAgent(s).meta correctly', () => {
      const s = {
        settings: {
          defaultAgent: {
            meta: {
              avatar: 'agent-avatar.jpg',
              description: 'Test agent',
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.defaultAgentMeta(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('currentTTS', () => {
    it('should merge DEFAULT_TTS_CONFIG and s.settings.tts correctly', () => {
      const s = {
        settings: {
          tts: {
            openAI: {
              sttModel: 'whisper-2',
            },
            sttAutoStop: false,
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.currentTTS(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('dalleConfig', () => {
    it('should return the dalle configuration', () => {
      const s = {
        settings: {
          tool: {
            dalle: {
              apiKey: 'dalle-api-key',
              autoGenerate: true,
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.dalleConfig(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('isDalleAutoGenerating', () => {
    it('should return the autoGenerate flag from dalle configuration', () => {
      const s = {
        settings: {
          tool: {
            dalle: {
              autoGenerate: true,
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.isDalleAutoGenerating(s);

      expect(result).toBe(true);
    });
  });

  describe('getProviderConfigById', () => {
    it('should return the provider config for a given provider id', () => {
      const providerConfig = {
        OPENAI_API_KEY: 'test-key',
        endpoint: 'https://test-endpoint.com',
      };

      const s = {
        settings: {
          languageModel: {
            openAI: providerConfig,
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.providerConfig('openAI')(s);

      expect(result).toEqual(providerConfig);
    });

    it('should return undefined if provider does not exist', () => {
      const s = {
        settings: {
          languageModel: {},
        },
      } as unknown as UserStore;

      const result = settingsSelectors.providerConfig(
        'nonExistentProvider' as GlobalLLMProviderKey,
      )(s);

      expect(result).toBeUndefined();
    });
  });

  describe('defaultAgentConfig', () => {
    it('should merge DEFAULT_AGENT_CONFIG and defaultAgent(s).config correctly', () => {
      const s = {
        settings: {
          defaultAgent: {
            config: {
              model: 'gpt-4',
              params: {
                temperature: 0.7,
              },
              systemRole: 'custom role',
            },
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.defaultAgentConfig(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('exportSettings', () => {
    it('should return the current settings', () => {
      const s = {
        defaultSettings: {
          fontSize: 16,
        },
        settings: {
          fontSize: 14,
          language: 'en-US',
        },
      } as unknown as UserStore;

      const result = settingsSelectors.exportSettings(s);

      expect(result).toEqual({
        fontSize: 14,
        language: 'en-US',
      });
    });
  });

  describe('currentSystemAgent', () => {
    it('should merge DEFAULT_SYSTEM_AGENT_CONFIG and s.settings.systemAgent correctly', () => {
      const s = {
        settings: {
          systemAgent: {
            enableAutoReply: true,
            replyMessage: 'Custom auto reply',
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.currentSystemAgent(s);

      expect(result).toMatchSnapshot();
    });
  });

  describe('getHotkeyById', () => {
    it('should return the hotkey config for a given id', () => {
      const hotkeyConfig = {
        hotkey: 'ctrl+shift+f',
        scope: 'global',
      };

      const s = {
        settings: {
          hotkey: {
            newChat: hotkeyConfig,
          },
        },
      } as unknown as UserStore;

      const result = settingsSelectors.getHotkeyById('newChat' as HotkeyId)(s);

      expect(result).toMatchSnapshot();
    });

    it('should return default hotkey if not defined in settings', () => {
      const s = {
        settings: {
          hotkey: {},
        },
      } as unknown as UserStore;

      const result = settingsSelectors.getHotkeyById('newChat' as HotkeyId)(s);

      expect(result).toMatchSnapshot();
    });
  });
});
