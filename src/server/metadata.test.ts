// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { BRANDING_NAME } from '@/const/branding';
import { OG_URL } from '@/const/url';

import { Meta } from './metadata';

describe('Metadata', () => {
  const meta = new Meta();

  describe('generate', () => {
    it('should generate metadata with default values', () => {
      const result = meta.generate({
        title: 'Test Title',
        url: 'https://example.com',
      });

      expect(result).toMatchObject({
        description: expect.any(String),
        openGraph: expect.objectContaining({
          description: expect.any(String),
          images: [{ alt: `Test Title · ${BRANDING_NAME}`, url: OG_URL }],
          title: `Test Title · ${BRANDING_NAME}`,
        }),
        title: 'Test Title',
        twitter: expect.objectContaining({
          description: expect.any(String),
          images: [OG_URL],
          title: `Test Title · ${BRANDING_NAME}`,
        }),
      });
    });

    it('should generate metadata with custom values', () => {
      const result = meta.generate({
        alternate: true,
        description: 'Custom description',
        image: 'https://custom-image.com',
        locale: 'fr-FR',
        tags: ['tag1', 'tag2'],
        title: 'Custom Title',
        type: 'article',
        url: 'https://example.com/custom',
      });

      expect(result).toMatchObject({
        alternates: expect.objectContaining({
          languages: expect.any(Object),
        }),
        description: expect.stringContaining('Custom description'),
        openGraph: expect.objectContaining({
          description: 'Custom description',
          images: [{ alt: `Custom Title · ${BRANDING_NAME}`, url: 'https://custom-image.com' }],
          locale: 'fr-FR',
          title: `Custom Title · ${BRANDING_NAME}`,
          type: 'article',
        }),
        title: 'Custom Title',
        twitter: expect.objectContaining({
          description: 'Custom description',
          images: ['https://custom-image.com'],
          title: `Custom Title · ${BRANDING_NAME}`,
        }),
      });
    });
  });

  describe('genAlternateLocales', () => {
    it('should generate alternate locales correctly', () => {
      const result = (meta as any).genAlternateLocales('en', '/test');

      expect(result).toHaveProperty('x-default', expect.stringContaining('/test'));
      expect(result).toHaveProperty('zh-CN', expect.stringContaining('hl=zh-CN'));
      expect(result).not.toHaveProperty('en');
    });
  });

  describe('genTwitter', () => {
    it('should generate Twitter metadata correctly', () => {
      const result = (meta as any).genTwitter({
        description: 'Twitter description',
        image: 'https://twitter-image.com',
        title: 'Twitter Title',
        url: 'https://example.com/twitter',
      });

      expect(result).toEqual({
        card: 'summary_large_image',
        description: 'Twitter description',
        images: ['https://twitter-image.com'],
        site: '@pho_chat',
        title: 'Twitter Title',
        url: 'https://example.com/twitter',
      });
    });
  });

  describe('genOpenGraph', () => {
    it('should generate OpenGraph metadata correctly', () => {
      const result = (meta as any).genOpenGraph({
        alternate: true,
        description: 'OG description',
        image: 'https://og-image.com',
        locale: 'es-ES',
        title: 'OG Title',
        type: 'article',
        url: 'https://example.com/og',
      });

      expect(result).toMatchObject({
        alternateLocale: expect.arrayContaining([
          'ar',
          'bg-BG',
          'de-DE',
          'en-US',
          'es-ES',
          'fr-FR',
          'ja-JP',
          'ko-KR',
          'pt-BR',
          'ru-RU',
          'tr-TR',
          'zh-CN',
          'zh-TW',
          'vi-VN',
        ]),
        description: 'OG description',
        images: [{ alt: 'OG Title', url: 'https://og-image.com' }],
        locale: 'es-ES',
        siteName: 'pho.chat',
        title: 'OG Title',
        type: 'article',
        url: 'https://example.com/og',
      });
    });
  });
});
