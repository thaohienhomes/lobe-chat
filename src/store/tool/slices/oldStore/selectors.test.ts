import { describe, expect, it } from 'vitest';

import { ToolStoreState, initialState } from '../../initialState';
import { pluginStoreSelectors } from './selectors';

const mockState = {
  ...initialState,
  listType: 'old',
  oldPluginItems: [
    {
      author: 'Author 1',
      avatar: 'avatar-url-1',
      createdAt: '2021-01-01',
      homepage: 'http://homepage-1.com',
      identifier: 'plugin-1',
      title: 'Plugin 1',
    },
    {
      author: 'Author 2',
      avatar: 'avatar-url-2',
      createdAt: '2022-02-02',
      homepage: 'http://homepage-2.com',
      identifier: 'plugin-2',
      title: 'Plugin 2',
    },
  ],
} as ToolStoreState;

describe('pluginStoreSelectors', () => {
  describe('onlinePluginStore', () => {
    it('should return the online plugin list', () => {
      const result = pluginStoreSelectors.onlinePluginStore(mockState);
      expect(result).toEqual([
        {
          author: 'Author 1',
          createdAt: '2021-01-01',
          homepage: 'http://homepage-1.com',
          identifier: 'plugin-1',
          meta: { avatar: 'avatar-url-1', title: 'Plugin 1' },
          type: 'plugin',
        },
        {
          author: 'Author 2',
          createdAt: '2022-02-02',
          homepage: 'http://homepage-2.com',
          identifier: 'plugin-2',
          meta: { avatar: 'avatar-url-2', title: 'Plugin 2' },
          type: 'plugin',
        },
      ]);
    });
  });
});
