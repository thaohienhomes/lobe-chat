'use client';

import { Button, Input, Modal, Space, Typography, message } from 'antd';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { BOT_TEMPLATES } from '../data/templates';

const { Text } = Typography;
const { TextArea } = Input;

const MAX_PROMPT_LENGTH = 2000;

interface BotItem {
  botName: string | null;
  botUsername: string | null;
  id: string;
  systemPrompt: string | null;
}

interface BotSettingsProps {
  bot: BotItem;
  onClose: () => void;
  onSaved: () => void;
}

const BotSettings = memo<BotSettingsProps>(({ bot, onClose, onSaved }) => {
  const [prompt, setPrompt] = useState(bot.systemPrompt || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/openclaw/bots/${bot.id}`, {
        body: JSON.stringify({ systemPrompt: prompt || null }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });
      if (res.ok) {
        message.success('Settings saved');
        onSaved();
      } else {
        const data = await res.json();
        message.error(data.error || 'Failed to save');
      }
    } catch {
      message.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="save" loading={saving} onClick={handleSave} type="primary">
          Save
        </Button>,
      ]}
      onCancel={onClose}
      open
      title={`Settings — @${bot.botUsername || 'Bot'}`}
      width={600}
    >
      <Flexbox gap={16}>
        <Flexbox gap={4}>
          <Text strong>System Prompt</Text>
          <Text type="secondary">
            Customize how your bot responds. Leave empty to use the default AI assistant prompt.
          </Text>
        </Flexbox>

        <TextArea
          maxLength={MAX_PROMPT_LENGTH}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. You are a friendly sales assistant for my store..."
          rows={6}
          showCount
          value={prompt}
        />

        <Flexbox gap={8}>
          <Text type="secondary">Or choose a template:</Text>
          <Space wrap>
            {BOT_TEMPLATES.map((tmpl) => (
              <Button
                key={tmpl.id}
                onClick={() => setPrompt(tmpl.systemPrompt)}
                size="small"
              >
                {tmpl.id.replaceAll('_', ' ')}
              </Button>
            ))}
          </Space>
        </Flexbox>
      </Flexbox>
    </Modal>
  );
});

BotSettings.displayName = 'BotSettings';

export default BotSettings;
