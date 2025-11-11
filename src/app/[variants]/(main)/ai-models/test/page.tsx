'use client';

import { Alert, Button, Card, Divider, Form, Input, Select, Typography } from 'antd';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

const { Title, Text } = Typography;
const { Option } = Select;

const AIModelTestPage = memo(() => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testProviders = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'Anthropic', value: 'anthropic' },
    { label: 'Google AI', value: 'google' },
    { label: 'Azure OpenAI', value: 'azure' },
  ];

  const handleTestProvider = async (values: any) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Test model listing
      const modelsResponse = await fetch(`/webapi/models/${values.provider}`, {
        headers: {
          'Authorization': `Bearer ${values.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!modelsResponse.ok) {
        throw new Error(`Models API failed: ${modelsResponse.status} ${modelsResponse.statusText}`);
      }

      const models = await modelsResponse.json();

      // Test chat completion
      const chatResponse = await fetch(`/webapi/chat/${values.provider}`, {
        body: JSON.stringify({
          max_tokens: 100,
          messages: [
            {
              content: 'Hello! This is a test message from pho.chat. Please respond briefly.',
              role: 'user',
            },
          ],
          model: values.model || 'gpt-3.5-turbo',
          temperature: 0.7,
        }),
        headers: {
          'Authorization': `Bearer ${values.apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!chatResponse.ok) {
        throw new Error(`Chat API failed: ${chatResponse.status} ${chatResponse.statusText}`);
      }

      const chatResult = await chatResponse.json();

      setResult({
        chatResponse: chatResult,
        models: models,
        provider: values.provider,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      console.error('AI Model Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTRPC = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Test tRPC aiProvider endpoint
      const response = await fetch('/trpc/lambda/aiProvider.getAiProviderList', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`tRPC failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      setResult({
        data: data,
        timestamp: new Date().toISOString(),
        type: 'tRPC',
      });
    } catch (err: any) {
      setError(err.message || 'tRPC test failed');
      console.error('tRPC Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flexbox gap={24} style={{ margin: '0 auto', maxWidth: '1000px', padding: '24px' }}>
      <Title level={2}>🤖 AI Model Integration Test</Title>

      <Alert
        description="Test your AI model integrations, API keys, and routing system"
        message="AI Model Testing Tool"
        showIcon
        type="info"
      />

      <Card title="Provider API Test">
        <Form
          initialValues={{
            model: 'gpt-3.5-turbo',
            provider: 'openai',
          }}
          layout="vertical"
          onFinish={handleTestProvider}
        >
          <Form.Item
            label="AI Provider"
            name="provider"
            rules={[{ message: 'Please select a provider', required: true }]}
          >
            <Select placeholder="Select AI Provider">
              {testProviders.map((provider) => (
                <Option key={provider.value} value={provider.value}>
                  {provider.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[{ message: 'Please enter API key', required: true }]}
          >
            <Input.Password placeholder="Enter your API key" />
          </Form.Item>

          <Form.Item label="Model (Optional)" name="model">
            <Input placeholder="e.g., gpt-3.5-turbo, claude-3-sonnet" />
          </Form.Item>

          <Form.Item>
            <Button htmlType="submit" loading={loading} type="primary">
              Test Provider Integration
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="tRPC System Test">
        <Flexbox gap={16}>
          <Text>Test the internal tRPC routing system for AI providers</Text>
          <Button loading={loading} onClick={handleTestTRPC}>
            Test tRPC AI Provider System
          </Button>
        </Flexbox>
      </Card>

      {error && <Alert closable description={error} message="Test Failed" showIcon type="error" />}

      {result && (
        <Card title="Test Results">
          <Flexbox gap={16}>
            <Text strong>Test completed at: {result.timestamp}</Text>
            <Divider />

            {result.type === 'tRPC' ? (
              <div>
                <Title level={4}>tRPC Response:</Title>
                <pre
                  style={{
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    maxHeight: '300px',
                    overflow: 'auto',
                    padding: '16px',
                  }}
                >
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                <Title level={4}>Provider: {result.provider}</Title>

                <Title level={5}>Available Models:</Title>
                <pre
                  style={{
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    padding: '16px',
                  }}
                >
                  {JSON.stringify(result.models, null, 2)}
                </pre>

                <Title level={5}>Chat Response:</Title>
                <pre
                  style={{
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflow: 'auto',
                    padding: '16px',
                  }}
                >
                  {JSON.stringify(result.chatResponse, null, 2)}
                </pre>
              </div>
            )}
          </Flexbox>
        </Card>
      )}

      <Card title="Quick Setup Guide">
        <Flexbox gap={12}>
          <Title level={5}>1. Environment Variables</Title>
          <Text>Add to your .env.local file:</Text>
          <pre style={{ background: '#f5f5f5', borderRadius: '4px', padding: '12px' }}>
            {`OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here`}
          </pre>

          <Title level={5}>2. Test Steps</Title>
          <Text>• Enter your API key above</Text>
          <Text>• Select a provider</Text>
          <Text>• Click &quot;Test Provider Integration&quot;</Text>
          <Text>• Check results for successful connection</Text>

          <Title level={5}>3. Navigation</Title>
          <Text>• Settings → AI Provider (configure keys)</Text>
          <Text>• Chat → Model selector (switch models)</Text>
          <Text>• Settings → Language Model (default settings)</Text>
        </Flexbox>
      </Card>
    </Flexbox>
  );
});

AIModelTestPage.displayName = 'AIModelTestPage';

export default AIModelTestPage;
