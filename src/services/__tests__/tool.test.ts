import { beforeEach, describe, expect, it, vi } from 'vitest';


import { toolService } from '../tool';
import openAPIV3 from './openai/OpenAPI_V3.json';
import OpenAIPlugin from './openai/plugin.json';

// Mocking modules and functions

vi.mock('@/store/global/helpers', () => ({
  globalHelpers: {
    getCurrentLanguage: vi.fn(),
  },
}));

vi.mock('@/libs/trpc/client', () => ({
  edgeClient: {
    market: {
      getLegacyPluginList: {
        query: vi.fn(),
      },
    },
  },
}));

beforeEach(() => {
  vi.resetAllMocks();
});

describe('ToolService', () => {
  describe('getToolManifest', () => {
    it('should return manifest', async () => {
      const manifestUrl = 'http://fake-url.com/manifest.json';

      const fakeManifest = {
        $schema: '../node_modules/@lobehub/chat-plugin-sdk/schema.json',
        api: [
          {
            description: '获取当前天气情况',
            name: 'fetchCurrentWeather',
            parameters: {
              properties: {
                city: {
                  description: '城市名称',
                  type: 'string',
                },
              },
              required: ['city'],
              type: 'object',
            },
            url: 'https://realtime-weather.chat-plugin.lobehub.com/api/v1',
          },
        ],
        author: 'LobeHub',
        createAt: '2023-08-12',
        homepage: 'https://github.com/lobehub/chat-plugin-realtime-weather',
        identifier: 'realtime-weather',
        meta: {
          avatar: '🌈',
          description: 'Get realtime weather information',
          tags: ['weather', 'realtime'],
          title: 'Realtime Weather',
        },
        ui: {
          height: 310,
          url: 'https://realtime-weather.chat-plugin.lobehub.com/iframe',
        },
        version: '1',
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(fakeManifest),
          ok: true,
        }),
      ) as any;

      const manifest = await toolService.getToolManifest(manifestUrl);

      expect(fetch).toHaveBeenCalledWith(manifestUrl);
      expect(manifest).toEqual(fakeManifest);
    });

    it('should return error on noManifest', async () => {
      try {
        await toolService.getToolManifest();
      } catch (e) {
        expect(e).toEqual(new TypeError('noManifest'));
      }
    });

    it('should return error on manifestInvalid', async () => {
      const fakeManifest = { name: 'TestPlugin', version: '1.0.0' };
      const manifestUrl = 'http://fake-url.com/manifest.json';
      global.fetch = vi.fn(() =>
        Promise.resolve({
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(fakeManifest),
          ok: true,
        }),
      ) as any;

      try {
        await toolService.getToolManifest(manifestUrl);
      } catch (e) {
        expect(e).toEqual(new TypeError('manifestInvalid'));
      }
    });

    it('should return error on fetchError', async () => {
      const manifestUrl = 'http://fake-url.com/manifest.json';
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      try {
        await toolService.getToolManifest(manifestUrl);
      } catch (e) {
        expect(e).toEqual(new TypeError('fetchError'));
      }
      expect(fetch).toHaveBeenCalledWith(manifestUrl);
    });

    it('should return error on manifestInvalid', async () => {
      const fakeManifest = { name: 'TestPlugin', version: '1.0.0' };
      const manifestUrl = 'http://fake-url.com/manifest.json';
      global.fetch = vi.fn(() =>
        Promise.resolve({
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(fakeManifest),
          ok: false,
        }),
      ) as any;

      try {
        await toolService.getToolManifest(manifestUrl);
      } catch (e) {
        expect(e).toEqual(new TypeError('fetchError'));
      }
    });

    describe('support OpenAPI manifest', () => {
      it('should get plugin manifest', async () => {
        const manifestUrl = 'http://fake-url.com/manifest.json';
        const openapiUrl = 'http://fake-url.com/openapiUrl.json';

        const fakeManifest = {
          $schema: '../node_modules/@lobehub/chat-plugin-sdk/schema.json',
          api: [],
          author: 'LobeHub',
          createAt: '2023-08-12',
          homepage: 'https://github.com/lobehub/chat-plugin-realtime-weather',
          identifier: 'realtime-weather',
          meta: {
            avatar: '🌈',
            description: 'Get realtime weather information',
            tags: ['weather', 'realtime'],
            title: 'Realtime Weather',
          },
          openapi: openapiUrl,
          ui: {
            height: 310,
            url: 'https://realtime-weather.chat-plugin.lobehub.com/iframe',
          },
          version: '1',
        };

        global.fetch = vi.fn((url) =>
          Promise.resolve({
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve(url === openapiUrl ? openAPIV3 : fakeManifest),
            ok: true,
          }),
        ) as any;

        const manifest = await toolService.getToolManifest(manifestUrl);

        expect(manifest).toMatchSnapshot();
      });

      it('should return error on openAPIInvalid', async () => {
        const openapiUrl = 'http://fake-url.com/openapiUrl.json';
        const manifestUrl = 'http://fake-url.com/manifest.json';
        const fakeManifest = {
          $schema: '../node_modules/@lobehub/chat-plugin-sdk/schema.json',
          api: [],
          author: 'LobeHub',
          createAt: '2023-08-12',
          homepage: 'https://github.com/lobehub/chat-plugin-realtime-weather',
          identifier: 'realtime-weather',
          meta: {
            avatar: '🌈',
            description: 'Get realtime weather information',
            tags: ['weather', 'realtime'],
            title: 'Realtime Weather',
          },
          openapi: openapiUrl,
          ui: {
            height: 310,
            url: 'https://realtime-weather.chat-plugin.lobehub.com/iframe',
          },
          version: '1',
        };

        global.fetch = vi.fn((url) =>
          Promise.resolve({
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve(url === openapiUrl ? [] : fakeManifest),
            ok: true,
          }),
        ) as any;

        try {
          await toolService.getToolManifest(manifestUrl);
        } catch (e) {
          expect(e).toEqual(new TypeError('openAPIInvalid'));
        }
      });
    });
  });

  it('can parse the OpenAI plugin', async () => {
    const manifest = toolService['convertOpenAIManifestToLobeManifest'](OpenAIPlugin as any);

    expect(manifest).toMatchSnapshot();
  });
});
