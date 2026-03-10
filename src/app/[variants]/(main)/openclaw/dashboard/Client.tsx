'use client';

import { Button, Modal, Progress, Skeleton, Tag, Typography, message } from 'antd';
import { createStyles } from 'antd-style';
import {
  Bot,
  ExternalLink,
  Pause,
  Play,
  Plus,
  Settings,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { memo, useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import BotSettings from './BotSettings';

const { Title, Text } = Typography;

interface BotItem {
  botName: string | null;
  botUsername: string | null;
  createdAt: string;
  dailyMessageCount: number;
  dailyResetAt: string | null;
  id: string;
  messageCount: number;
  status: string;
  systemPrompt: string | null;
  updatedAt: string;
}

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    padding: 20px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    transition: border-color 0.2s;

    &:hover {
      border-color: ${token.colorPrimaryBorder};
    }
  `,
  container: css`
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 32px 24px;

    @media (max-width: 640px) {
      padding: 16px;
    }
  `,
  emptyState: css`
    padding: 60px 24px;
    text-align: center;
    background: ${token.colorBgContainer};
    border: 1px dashed ${token.colorBorderSecondary};
    border-radius: 12px;
  `,
  statLabel: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
  `,
}));

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const DashboardClient = memo(() => {
  const { styles } = useStyles();
  const [bots, setBots] = useState<BotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingsBot, setSettingsBot] = useState<BotItem | null>(null);

  const fetchBots = useCallback(async () => {
    try {
      const res = await fetch('/api/openclaw/bots');
      if (res.status === 401) {
        setBots([]);
        return;
      }
      const data = await res.json();
      setBots(data.bots || []);
    } catch {
      message.error('Failed to load bots');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  const handleToggleStatus = useCallback(async (bot: BotItem) => {
    const newStatus = bot.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/openclaw/bots/${bot.id}`, {
        body: JSON.stringify({ status: newStatus }),
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      });
      if (res.ok) {
        message.success(`Bot ${newStatus === 'active' ? 'resumed' : 'paused'}`);
        fetchBots();
      } else {
        const data = await res.json();
        message.error(data.error || 'Failed to update bot');
      }
    } catch {
      message.error('Network error');
    }
  }, [fetchBots]);

  const handleDelete = useCallback((bot: BotItem) => {
    Modal.confirm({
      content: `This will remove @${bot.botUsername} and disconnect it from Telegram. This action cannot be undone.`,
      okButtonProps: { danger: true },
      okText: 'Delete',
      onOk: async () => {
        try {
          const res = await fetch(`/api/openclaw/bots/${bot.id}`, { method: 'DELETE' });
          if (res.ok) {
            message.success('Bot deleted');
            fetchBots();
          } else {
            const data = await res.json();
            message.error(data.error || 'Failed to delete bot');
          }
        } catch {
          message.error('Network error');
        }
      },
      title: `Delete @${bot.botUsername}?`,
    });
  }, [fetchBots]);

  return (
    <Flexbox className={styles.container} gap={24}>
      {/* Header */}
      <Flexbox align="center" horizontal justify="space-between">
        <Flexbox align="center" gap={8} horizontal>
          <Bot size={24} />
          <Title level={3} style={{ margin: 0 }}>My Bots</Title>
        </Flexbox>
        <Link href="/openclaw">
          <Button icon={<Plus size={14} />} type="primary">
            Deploy New
          </Button>
        </Link>
      </Flexbox>

      {/* Loading */}
      {loading && (
        <Flexbox gap={16}>
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 3 }} />
        </Flexbox>
      )}

      {/* Empty state */}
      {!loading && bots.length === 0 && (
        <div className={styles.emptyState}>
          <Bot size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
          <Title level={4} style={{ margin: '0 0 8px' }}>No bots yet</Title>
          <Text type="secondary">Deploy your first AI bot on Telegram in 30 seconds.</Text>
          <div style={{ marginTop: 16 }}>
            <Link href="/openclaw">
              <Button icon={<Plus size={14} />} type="primary">Deploy Your First Bot</Button>
            </Link>
          </div>
        </div>
      )}

      {/* Bot list */}
      {!loading && bots.map((bot) => {
        const dailyPercent = Math.min(100, Math.round((bot.dailyMessageCount / 100) * 100));
        const isActive = bot.status === 'active';

        return (
          <Flexbox className={styles.card} gap={16} key={bot.id}>
            {/* Top row: name + status */}
            <Flexbox align="center" horizontal justify="space-between">
              <Flexbox align="center" gap={8} horizontal>
                <Bot size={18} />
                <Text strong style={{ fontSize: 16 }}>
                  @{bot.botUsername || 'Unknown'}
                </Text>
                {bot.botName && <Text type="secondary">({bot.botName})</Text>}
              </Flexbox>
              <Tag color={isActive ? 'green' : 'orange'}>
                {isActive ? 'Active' : 'Paused'}
              </Tag>
            </Flexbox>

            {/* Stats row */}
            <Flexbox gap={12} horizontal wrap="wrap">
              <Flexbox gap={2}>
                <Text strong>{bot.messageCount.toLocaleString()}</Text>
                <span className={styles.statLabel}>Total messages</span>
              </Flexbox>
              <Flexbox gap={2} style={{ minWidth: 140 }}>
                <Flexbox align="center" gap={8} horizontal>
                  <Text strong>{bot.dailyMessageCount}/100</Text>
                  <span className={styles.statLabel}>Today</span>
                </Flexbox>
                <Progress
                  percent={dailyPercent}
                  showInfo={false}
                  size="small"
                  status={dailyPercent >= 90 ? 'exception' : 'normal'}
                />
              </Flexbox>
              <Flexbox gap={2}>
                <Text strong>{timeAgo(bot.createdAt)}</Text>
                <span className={styles.statLabel}>Deployed</span>
              </Flexbox>
            </Flexbox>

            {/* Actions row */}
            <Flexbox gap={8} horizontal wrap="wrap">
              <Button
                icon={isActive ? <Pause size={14} /> : <Play size={14} />}
                onClick={() => handleToggleStatus(bot)}
                size="small"
              >
                {isActive ? 'Pause' : 'Resume'}
              </Button>
              <Button
                icon={<Settings size={14} />}
                onClick={() => setSettingsBot(bot)}
                size="small"
              >
                Settings
              </Button>
              <Button
                icon={<ExternalLink size={14} />}
                onClick={() => window.open(`https://t.me/${bot.botUsername}`, '_blank')}
                size="small"
              >
                Open in Telegram
              </Button>
              <Button
                danger
                icon={<Trash2 size={14} />}
                onClick={() => handleDelete(bot)}
                size="small"
              >
                Delete
              </Button>
            </Flexbox>
          </Flexbox>
        );
      })}

      {/* Settings modal */}
      {settingsBot && (
        <BotSettings
          bot={settingsBot}
          onClose={() => setSettingsBot(null)}
          onSaved={() => {
            setSettingsBot(null);
            fetchBots();
          }}
        />
      )}
    </Flexbox>
  );
});

DashboardClient.displayName = 'DashboardClient';

export default DashboardClient;
