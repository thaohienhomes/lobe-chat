import { LobeChatPluginManifest } from '@lobehub/chat-plugin-sdk';
import { describe, expect, it } from 'vitest';

import { initialState , ToolStoreState } from '../initialState';

import { toolSelectors } from './tool';

const mockState = {
  ...initialState,
  builtinTools: [
    {
      identifier: 'builtin-1',
      manifest: {
        api: [{ name: 'builtin-api-1' }],
        identifier: 'builtin-1',
        meta: { description: 'Builtin 1 description', title: 'Builtin 1' },
      } as LobeChatPluginManifest,
      type: 'builtin',
    },
  ],
  installedPlugins: [
    {
      identifier: 'plugin-1',
      manifest: {
        api: [{ name: 'api-1' }],
        identifier: 'plugin-1',
        meta: { description: 'Plugin 1 description', title: 'Plugin 1' },
      } as LobeChatPluginManifest,
      type: 'plugin',
    },
    {
      identifier: 'plugin-2',
      manifest: {
        api: [{ name: 'api-2' }],
        identifier: 'plugin-2',
      } as LobeChatPluginManifest,
      type: 'plugin',
    },
    {
      identifier: 'plugin-3',
      manifest: {
        api: [
          {
            description: '123123',
            name: 'api-3',
            parameters: { properties: { a: { type: 'string' } }, type: 'object' },
            url: 'bac',
          },
        ],
        identifier: 'plugin-3',
      },
      type: 'customPlugin',
    },
  ],
  pluginInstallLoading: {
    'plugin-1': false,
    'plugin-2': true,
  },
} as ToolStoreState;

describe('toolSelectors', () => {
  describe('enabledSchema', () => {
    it('enabledSchema should return correct ChatCompletionFunctions array', () => {
      const result = toolSelectors.enabledSchema(['plugin-1', 'plugin-2'])(mockState);
      expect(result).toEqual([
        {
          function: {
            name: 'plugin-1____api-1',
          },
          type: 'function',
        },
        {
          function: {
            name: 'plugin-2____api-2',
          },
          type: 'function',
        },
      ]);
    });

    it('enabledSchema should return with standalone plugin', () => {
      const result = toolSelectors.enabledSchema(['plugin-4'])({
        ...mockState,
        installedPlugins: [
          ...mockState.installedPlugins,
          {
            identifier: 'plugin-4',
            manifest: {
              api: [{ name: 'api-4' }],
              identifier: 'plugin-4',
              type: 'standalone',
            },
            type: 'plugin',
          },
        ],
      } as ToolStoreState);
      expect(result).toEqual([
        {
          function: {
            name: 'plugin-4____api-4____standalone',
          },
          type: 'function',
        },
      ]);
    });

    it('enabledSchema should return md5 hash apiName', () => {
      const result = toolSelectors.enabledSchema(['long-long-plugin-with-id'])({
        ...mockState,
        installedPlugins: [
          ...mockState.installedPlugins,
          {
            identifier: 'long-long-plugin-with-id',
            manifest: {
              api: [{ name: 'long-long-manifest-long-long-apiName' }],
              identifier: 'long-long-plugin-with-id',
            },
            type: 'plugin',
          },
        ],
      } as ToolStoreState);
      expect(result).toEqual([
        {
          function: {
            name: 'long-long-plugin-with-id____MD5HASH_396eae4c671da3fb',
          },
          type: 'function',
        },
      ]);
    });

    it('enabledSchema should return empty', () => {
      const result = toolSelectors.enabledSchema([])(mockState);
      expect(result).toEqual([]);
    });

    // fix https://github.com/lobehub/lobe-chat/issues/2036
    it('should not contain url', () => {
      const result = toolSelectors.enabledSchema(['plugin-3'])(mockState);
      expect(result[0].function).toEqual({
        description: '123123',
        name: 'plugin-3____api-3',
        parameters: {
          properties: {
            a: {
              type: 'string',
            },
          },
          type: 'object',
        },
      });

      expect(result[0].function).not.toHaveProperty('url');
    });
  });

  describe('getToolManifestLoadingStatus', () => {
    it('should return "loading" if the plugin manifest is being loaded', () => {
      const result = toolSelectors.getManifestLoadingStatus('plugin-2')(mockState);
      expect(result).toBe('loading');
    });

    it('should return "error" if the plugin manifest is not found', () => {
      const result = toolSelectors.getManifestLoadingStatus('non-existing-plugin')(mockState);
      expect(result).toBe('error');
    });

    it('should return "success" if the plugin manifest is loaded', () => {
      const result = toolSelectors.getManifestLoadingStatus('plugin-1')(mockState);
      expect(result).toBe('success');
    });
  });

  describe('metaList and getMetaById', () => {
    it('should return the correct list of tool metadata', () => {
      const result = toolSelectors.metaList()(mockState);
      expect(result).toEqual([
        {
          author: 'LobeHub',
          identifier: 'builtin-1',
          meta: { description: 'Builtin 1 description', title: 'Builtin 1' },
          type: 'builtin',
        },
        {
          description: 'Plugin 1 description',
          identifier: 'plugin-1',
          meta: { description: 'Plugin 1 description', title: 'Plugin 1' },
          title: 'Plugin 1',
          type: 'plugin',
        },
        {
          identifier: 'plugin-2',
          meta: undefined,
          type: 'plugin',
        },
        {
          identifier: 'plugin-3',
          type: 'customPlugin',
        },
      ]);
    });

    it('should return the correct metadata by identifier', () => {
      const result = toolSelectors.getMetaById('plugin-1')(mockState);
      expect(result).toEqual({ description: 'Plugin 1 description', title: 'Plugin 1' });
    });

    it('should return undefined for non-existent identifier', () => {
      const result = toolSelectors.getMetaById('non-existent')(mockState);
      expect(result).toBeUndefined();
    });
  });

  describe('getManifestById and getManifestLoadingStatus', () => {
    it('should return the correct manifest by identifier', () => {
      const result = toolSelectors.getManifestById('plugin-1')(mockState);
      expect(result).toEqual({
        api: [{ name: 'api-1' }],
        identifier: 'plugin-1',
        meta: { description: 'Plugin 1 description', title: 'Plugin 1' },
      });
    });

    it('should return undefined for non-existent identifier', () => {
      const result = toolSelectors.getManifestById('non-existent')(mockState);
      expect(result).toBeUndefined();
    });

    it('should return the correct loading status for a plugin', () => {
      expect(toolSelectors.getManifestLoadingStatus('plugin-1')(mockState)).toBe('success');
      expect(toolSelectors.getManifestLoadingStatus('plugin-2')(mockState)).toBe('loading');
      expect(toolSelectors.getManifestLoadingStatus('non-existent')(mockState)).toBe('error');
    });
  });

  describe('isToolHasUI', () => {
    it('should return false if the tool has no UI', () => {
      expect(toolSelectors.isToolHasUI('plugin-1')(mockState)).toBe(false);
    });

    it('should return true if the tool has UI', () => {
      expect(toolSelectors.isToolHasUI('builtin-1')(mockState)).toBe(true);
    });

    it('should return false if the tool does not exist', () => {
      expect(toolSelectors.isToolHasUI('non-existent')(mockState)).toBe(false);
    });
  });
});
