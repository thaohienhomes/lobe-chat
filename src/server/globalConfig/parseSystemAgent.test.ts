import { describe, expect, it } from 'vitest';

import { parseSystemAgent } from './parseSystemAgent';

describe('parseSystemAgent', () => {
  it('should parse a valid environment variable string correctly', () => {
    const envValue = 'topic=openai/gpt-3.5-turbo,translation=anthropic/claude-1';
    const expected = {
      topic: { model: 'gpt-3.5-turbo', provider: 'openai' },
      translation: { model: 'claude-1', provider: 'anthropic' },
    };

    expect(parseSystemAgent(envValue)).toEqual(expected);
  });

  it('should handle empty environment variable string', () => {
    const envValue = '';
    const expected = {};

    expect(parseSystemAgent(envValue)).toEqual(expected);
  });

  it('should ignore unknown keys in environment variable string', () => {
    const envValue = 'topic=openai/gpt-3.5-turbo,unknown=test/model';
    const expected = {
      topic: { model: 'gpt-3.5-turbo', provider: 'openai' },
    };

    expect(parseSystemAgent(envValue)).toEqual(expected);
  });

  it('should throw an error for missing model or provider values', () => {
    const envValue1 = 'topic=openai,translation=/claude-1';
    const envValue2 = 'topic=/gpt-3.5-turbo,translation=anthropic/';

    expect(() => parseSystemAgent(envValue1)).toThrowError(/Missing model or provider/);
    expect(() => parseSystemAgent(envValue2)).toThrowError(/Missing model or provider/);
  });

  it('should throw an error for invalid environment variable format', () => {
    const envValue = 'topic-openai/gpt-3.5-turbo';

    expect(() => parseSystemAgent(envValue)).toThrowError(/Invalid environment variable format/);
  });

  it('should handle provider or model names with special characters', () => {
    const envValue = 'topic=openrouter/mistralai/mistral-7b-instruct:free';
    const expected = {
      topic: { model: 'mistralai/mistral-7b-instruct:free', provider: 'openrouter' },
    };

    expect(parseSystemAgent(envValue)).toEqual(expected);
  });

  it('should handle extra whitespace in environment variable string', () => {
    const envValue = '  topic = openai/gpt-3.5-turbo , translation = anthropic/claude-1 ';
    const expected = {
      topic: { model: 'gpt-3.5-turbo', provider: 'openai' },
      translation: { model: 'claude-1', provider: 'anthropic' },
    };

    expect(parseSystemAgent(envValue)).toEqual(expected);
  });

  it('should handle full-width comma in environment variable string', () => {
    const envValue = 'topic=openai/gpt-3.5-turbo，translation=anthropic/claude-1';
    const expected = {
      topic: { model: 'gpt-3.5-turbo', provider: 'openai' },
      translation: { model: 'claude-1', provider: 'anthropic' },
    };

    expect(parseSystemAgent(envValue)).toEqual(expected);
  });

  it('should handle extra whitespace around provider and model names', () => {
    const envValue = 'topic= openai / gpt-3.5-turbo ,translation= anthropic / claude-1 ';
    const expected = {
      topic: { model: 'gpt-3.5-turbo', provider: 'openai' },
      translation: { model: 'claude-1', provider: 'anthropic' },
    };

    expect(parseSystemAgent(envValue)).toEqual(expected);
  });

  it('should handle an excessively long environment variable string', () => {
    const longProviderName = 'a'.repeat(100);
    const longModelName = 'b'.repeat(100);
    const envValue = `topic=${longProviderName}/${longModelName}`;
    const expected = {
      topic: { model: longModelName, provider: longProviderName },
    };

    expect(parseSystemAgent(envValue)).toEqual(expected);
  });

  it('should apply default setting to all system agents when default is specified', () => {
    const envValue = 'default=ollama/deepseek-v3';

    const result = parseSystemAgent(envValue);

    expect(result.topic).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.translation).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.agentMeta).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.historyCompress).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.thread).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.queryRewrite).toEqual({
      enabled: true,
      model: 'deepseek-v3',
      provider: 'ollama',
    });
  });

  it('should override default setting with specific settings', () => {
    const envValue = 'default=ollama/deepseek-v3,topic=openai/gpt-4';

    const result = parseSystemAgent(envValue);

    expect(result.topic).toEqual({ model: 'gpt-4', provider: 'openai' });

    expect(result.translation).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.agentMeta).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.historyCompress).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.thread).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.queryRewrite).toEqual({
      enabled: true,
      model: 'deepseek-v3',
      provider: 'ollama',
    });
  });

  it('should properly handle priority when topic appears before default in the string', () => {
    // 即使 topic 在 default 之前出现，topic 的设置仍然应该优先
    const envValue = 'topic=openai/gpt-4,default=ollama/deepseek-v3';

    const result = parseSystemAgent(envValue);

    // topic 应该保持自己的设置而不被 default 覆盖
    expect(result.topic).toEqual({ model: 'gpt-4', provider: 'openai' });

    // 其他系统智能体应该使用默认配置
    expect(result.translation).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.agentMeta).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.historyCompress).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.thread).toEqual({ model: 'deepseek-v3', provider: 'ollama' });
    expect(result.queryRewrite).toEqual({
      enabled: true,
      model: 'deepseek-v3',
      provider: 'ollama',
    });
  });
});
