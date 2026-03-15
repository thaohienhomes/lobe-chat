import { describe, expect, it } from 'vitest';

import { LOADING_FLAT } from '@/const/message';
import { ChatMessage } from '@/types/message';

import { generateMessages } from './generateMessages';

describe('generateMessages', () => {
  // 创建一些测试用的消息数据
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
      content: 'Tool response',
      createdAt: Date.now(),
      id: '4',
      role: 'tool',
      tool_call_id: 'tool1',
    },
  ] as ChatMessage[];

  it('should filter out loading messages', () => {
    const result = generateMessages({
      includeTool: false,
      messages: mockMessages,
      systemRole: '',
      withSystemRole: false,
    });

    expect(result).toHaveLength(2);
    expect(result.some((m) => m.content === LOADING_FLAT)).toBeFalsy();
  });

  it('should include system role when withSystemRole is true and systemRole is provided', () => {
    const systemRole = 'I am a helpful assistant';
    const result = generateMessages({
      includeTool: false,
      messages: mockMessages,
      systemRole,
      withSystemRole: true,
    });

    expect(result[0]).toEqual({
      content: systemRole,
      role: 'system',
    });
    expect(result).toHaveLength(3); // system role + 2 messages
  });

  it('should not include system role when withSystemRole is false', () => {
    const systemRole = 'I am a helpful assistant';
    const result = generateMessages({
      includeTool: false,
      messages: mockMessages,
      systemRole,
      withSystemRole: false,
    });

    expect(result[0].role).not.toBe('system');
    expect(result).toHaveLength(2);
  });

  it('should include tool messages when includeTool is true', () => {
    const result = generateMessages({
      includeTool: true,
      messages: mockMessages,
      systemRole: '',
      withSystemRole: false,
    });

    expect(result).toHaveLength(3);
    expect(result.some((m) => m.role === 'tool')).toBeTruthy();
    expect((result.find((m) => m.role === 'tool')! as any).tool_call_id).toBeDefined();
  });

  it('should exclude tool messages when includeTool is false', () => {
    const result = generateMessages({
      includeTool: false,
      messages: mockMessages,
      systemRole: '',
      withSystemRole: false,
    });

    expect(result).toHaveLength(2);
    expect(result.some((m) => m.role === 'tool')).toBeFalsy();
  });

  it('should trim message content', () => {
    const messagesWithSpaces = [
      {
        content: '  Hello  ',
        createdAt: Date.now(),
        id: '1',
        role: 'user',
      },
    ] as ChatMessage[];

    const result = generateMessages({
      includeTool: false,
      messages: messagesWithSpaces,
      systemRole: '',
      withSystemRole: false,
    });

    expect(result[0].content).toBe('Hello');
  });

  it('should not include system role when systemRole is empty', () => {
    const result = generateMessages({
      includeTool: false,
      messages: mockMessages,
      systemRole: '',
      withSystemRole: true,
    });

    expect(result).toHaveLength(2);
    expect(result[0].role).not.toBe('system');
  });
});
