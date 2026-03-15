import { LobeChatPluginManifest, LobeChatPluginMeta } from '@lobehub/chat-plugin-sdk';
import { describe, expect, it } from 'vitest';

import { ToolStoreState, initialState } from '../../initialState';
import { customPluginSelectors } from './selectors';

const mockState = {
  ...initialState,
  installedPlugins: [
    {
      identifier: 'plugin-1',
      manifest: {
        api: [{ name: 'api-1' }],
        identifier: 'plugin-1',
        type: 'default',
      } as LobeChatPluginManifest,
      type: 'plugin',
    },
    {
      identifier: 'plugin-2',
      manifest: {
        api: [{ name: 'api-2' }],
        identifier: 'plugin-2',
        type: 'default',
      },
      type: 'plugin',
    },
  ],
  pluginManifestLoading: {
    'plugin-1': false,
    'plugin-2': true,
  },
  pluginStoreList: [
    {
      author: 'Author 1',
      createdAt: '2021-01-01',
      homepage: 'http://homepage-1.com',
      identifier: 'plugin-1',
      meta: { avatar: 'avatar-url-1', title: 'Plugin 1' },
    } as LobeChatPluginMeta,
    {
      author: 'Author 2',
      createdAt: '2022-02-02',
      homepage: 'http://homepage-2.com',
      identifier: 'plugin-2',
      meta: { avatar: 'avatar-url-2', title: 'Plugin 2' },
    },
  ],
} as ToolStoreState;

describe('pluginSelectors', () => {
  describe('isCustomPlugin', () => {
    it('should return false for a non-custom plugin', () => {
      const result = customPluginSelectors.isCustomPlugin('plugin-1')(mockState);
      expect(result).toBe(false);
    });

    it('should return true for a custom plugin', () => {
      const stateWithCustomPlugin = {
        ...mockState,
        installedPlugins: [
          ...mockState.installedPlugins,
          { identifier: 'custom-plugin', type: 'customPlugin' },
        ],
      } as ToolStoreState;
      const result = customPluginSelectors.isCustomPlugin('custom-plugin')(stateWithCustomPlugin);
      expect(result).toBe(true);
    });
  });
});
