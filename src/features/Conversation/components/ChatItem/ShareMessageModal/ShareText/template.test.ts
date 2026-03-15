import { describe, expect, it } from 'vitest';

import { LOADING_FLAT } from '@/const/message';
import { ChatMessage } from '@/types/message';

import { generateMarkdown } from './template';

describe('generateMarkdown', () => {
  // 创建测试用的消息数据
  const mockMessages = [
    {
      content: 'Hello',
      createdAt: Date.now(),
      id: '1',
      role: 'user',
    },
    {
      content: 'Hi there',
      createdAt: Date.now(),
      id: '2',
      role: 'assistant',
    },
    {
      content: LOADING_FLAT,
      createdAt: Date.now(),
      id: '3',
      role: 'assistant',
    },
    {
      content: '{"result": "tool data"}',
      createdAt: Date.now(),
      id: '4',
      role: 'tool',
      tool_call_id: 'tool1',
    },
    {
      content: 'Message with tools',
      createdAt: Date.now(),
      id: '5',
      role: 'assistant',
      tools: [{ name: 'calculator', result: '42' }],
    },
  ] as ChatMessage[];

  const defaultParams = {
    includeTool: false,
    includeUser: true,
    messages: mockMessages,
    systemRole: '',
    title: 'Chat Title',
    withRole: false,
    withSystemRole: false,
  };

  it('should filter out loading messages', () => {
    const result = generateMarkdown(defaultParams);

    expect(result).not.toContain(LOADING_FLAT);
  });

  it('should handle messages with special characters', () => {
    const messagesWithSpecialChars = [
      {
        content: '**Bold** *Italic* `Code`',
        createdAt: Date.now(),
        id: '1',
        role: 'user',
      },
    ] as ChatMessage[];

    const result = generateMarkdown({
      ...defaultParams,
      messages: messagesWithSpecialChars,
    });

    expect(result).toContain('**Bold** *Italic* `Code`');
  });
});
