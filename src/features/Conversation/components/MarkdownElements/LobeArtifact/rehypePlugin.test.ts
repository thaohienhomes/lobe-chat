import { describe, expect, it } from 'vitest';

import rehypePlugin from './rehypePlugin';

describe('rehypePlugin', () => {
  it('should transform <lobeArtifact> tags with attributes', () => {
    const tree = {
      children: [
        {
          children: [
            {
              type: 'raw',
              value: '<lobeArtifact identifier="test-id" type="image/svg+xml" title="Test Title">',
            },
            { type: 'text', value: 'Artifact content' },
            { type: 'raw', value: '</lobeArtifact>' },
          ],
          tagName: 'p',
          type: 'element',
        },
      ],
      type: 'root',
    };

    const expectedTree = {
      children: [
        {
          children: [{ type: 'text', value: 'Artifact content' }],
          properties: {
            identifier: 'test-id',
            title: 'Test Title',
            type: 'image/svg+xml',
          },
          tagName: 'lobeArtifact',
          type: 'element',
        },
      ],
      type: 'root',
    };

    const plugin = rehypePlugin();
    plugin(tree);

    expect(tree).toEqual(expectedTree);
  });

  it('should handle mixed content with thinking tags and plain text', () => {
    const tree = {
      children: [
        {
          children: [{ type: 'text', value: 'Initial plain text paragraph' }],
          tagName: 'p',
          type: 'element',
        },
        {
          children: [
            { type: 'raw', value: '<lobeThinking>' },
            { type: 'text', value: 'AI is thinking...' },
            { type: 'raw', value: '</lobeThinking>' },
          ],
          tagName: 'p',
          type: 'element',
        },
        {
          children: [
            {
              type: 'raw',
              value: '<lobeArtifact identifier="test-id" type="image/svg+xml" title="Test Title">',
            },
            { type: 'text', value: 'Artifact content' },
            { type: 'raw', value: '</lobeArtifact>' },
          ],
          tagName: 'p',
          type: 'element',
        },
        {
          children: [{ type: 'text', value: 'Final plain text paragraph' }],
          tagName: 'p',
          type: 'element',
        },
      ],
      type: 'root',
    };

    const expectedTree = {
      children: [
        {
          children: [{ type: 'text', value: 'Initial plain text paragraph' }],
          tagName: 'p',
          type: 'element',
        },
        {
          children: [
            { type: 'raw', value: '<lobeThinking>' },
            { type: 'text', value: 'AI is thinking...' },
            { type: 'raw', value: '</lobeThinking>' },
          ],
          tagName: 'p',
          type: 'element',
        },
        {
          children: [{ type: 'text', value: 'Artifact content' }],
          properties: {
            identifier: 'test-id',
            title: 'Test Title',
            type: 'image/svg+xml',
          },
          tagName: 'lobeArtifact',
          type: 'element',
        },
        {
          children: [{ type: 'text', value: 'Final plain text paragraph' }],
          tagName: 'p',
          type: 'element',
        },
      ],
      type: 'root',
    };

    const plugin = rehypePlugin();
    plugin(tree);

    expect(tree).toEqual(expectedTree);
  });
});
