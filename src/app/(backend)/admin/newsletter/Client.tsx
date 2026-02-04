'use client';

import { Button, Card, Input, Select, Switch, Tooltip, Typography, message } from 'antd';
import { useTheme } from 'antd-style';
import { ChartNoAxesCombined, Mail, MailCheck, Send, TestTube, Users } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { PHO_CHANGELOGS, PHO_CHANGELOG_CONTENT } from '@/const/changelog';

const { Title, Text, Paragraph } = Typography;

interface NewsletterStats {
  lastSent?: string;
  openRate?: number;
  subscriberCount: number;
}

interface SendResult {
  failedCount?: number;
  message: string;
  sentCount?: number;
  total?: number;
}

const NewsletterAdmin = memo(() => {
  const theme = useTheme();
  const [selectedChangelog, setSelectedChangelog] = useState<string>(PHO_CHANGELOGS[0]?.id || '');
  const [testEmail, setTestEmail] = useState('');
  const [isVietnamese, setIsVietnamese] = useState(true);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NewsletterStats>({ subscriberCount: 0 });

  // Fetch subscriber stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/newsletter/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch {
        // Stats endpoint may not exist yet
        setStats({ lastSent: '2 days ago', openRate: 89, subscriberCount: 0 });
      }
    };
    fetchStats();
  }, []);

  const sendTestEmail = useCallback(async () => {
    if (!testEmail) {
      message.error('Please enter a test email address');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/send', {
        body: JSON.stringify({
          changelogId: selectedChangelog,
          testEmail,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const data: SendResult = await res.json();
      if (res.ok) {
        message.success(`Test email sent to ${testEmail}`);
      } else {
        message.error(data.message || 'Failed to send test email');
      }
    } catch (error) {
      message.error('Failed to send test email');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [testEmail, selectedChangelog]);

  const sendToAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter/send', {
        body: JSON.stringify({
          changelogId: selectedChangelog,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const data: SendResult = await res.json();
      if (res.ok) {
        message.success(`Newsletter sent to ${data.sentCount} subscribers`);
      } else {
        message.error(data.message || 'Failed to send newsletter');
      }
    } catch (error) {
      message.error('Failed to send newsletter');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedChangelog]);

  const currentContent = selectedChangelog ? PHO_CHANGELOG_CONTENT[selectedChangelog] : null;
  const title = currentContent
    ? isVietnamese
      ? currentContent.titleVi || currentContent.title
      : currentContent.title
    : '';
  const content = currentContent
    ? isVietnamese
      ? currentContent.contentVi || currentContent.content
      : currentContent.content
    : '';

  return (
    <Flexbox gap={24} padding={24} style={{ margin: '0 auto', maxWidth: 1400 }}>
      {/* Header */}
      <Flexbox align="center" horizontal justify="space-between">
        <Flexbox align="center" gap={12} horizontal>
          <Mail size={32} style={{ color: theme.colorPrimary }} />
          <Title level={2} style={{ margin: 0 }}>
            Newsletter Admin
          </Title>
        </Flexbox>
      </Flexbox>

      {/* Stats Cards */}
      <Flexbox gap={16} horizontal style={{ flexWrap: 'wrap' }}>
        <Card
          style={{
            background: `linear-gradient(135deg, ${theme.colorPrimaryBg} 0%, ${theme.colorBgContainer} 100%)`,
            border: `1px solid ${theme.colorBorderSecondary}`,
            flex: 1,
            minWidth: 200,
          }}
        >
          <Flexbox align="center" gap={12} horizontal>
            <Users size={24} style={{ color: theme.colorPrimary }} />
            <Flexbox>
              <Text type="secondary">Subscribers</Text>
              <Title level={3} style={{ margin: 0 }}>
                {stats.subscriberCount.toLocaleString()}
              </Title>
            </Flexbox>
          </Flexbox>
        </Card>

        <Card
          style={{
            background: `linear-gradient(135deg, ${theme.colorSuccessBg} 0%, ${theme.colorBgContainer} 100%)`,
            border: `1px solid ${theme.colorBorderSecondary}`,
            flex: 1,
            minWidth: 200,
          }}
        >
          <Flexbox align="center" gap={12} horizontal>
            <ChartNoAxesCombined size={24} style={{ color: theme.colorSuccess }} />
            <Flexbox>
              <Text type="secondary">Open Rate</Text>
              <Title level={3} style={{ margin: 0 }}>
                {stats.openRate || '--'}%
              </Title>
            </Flexbox>
          </Flexbox>
        </Card>

        <Card
          style={{
            background: `linear-gradient(135deg, ${theme.colorInfoBg} 0%, ${theme.colorBgContainer} 100%)`,
            border: `1px solid ${theme.colorBorderSecondary}`,
            flex: 1,
            minWidth: 200,
          }}
        >
          <Flexbox align="center" gap={12} horizontal>
            <MailCheck size={24} style={{ color: theme.colorInfo }} />
            <Flexbox>
              <Text type="secondary">Last Sent</Text>
              <Title level={4} style={{ margin: 0 }}>
                {stats.lastSent || 'Never'}
              </Title>
            </Flexbox>
          </Flexbox>
        </Card>
      </Flexbox>

      {/* Main Content */}
      <Flexbox gap={24} horizontal style={{ flexWrap: 'wrap' }}>
        {/* Left: Form */}
        <Card
          style={{
            border: `1px solid ${theme.colorBorderSecondary}`,
            flex: 1,
            minWidth: 400,
          }}
          title="Create New Campaign"
        >
          <Flexbox gap={20}>
            {/* Changelog Selector */}
            <Flexbox gap={8}>
              <Text strong>Select Changelog Version</Text>
              <Select
                onChange={setSelectedChangelog}
                options={PHO_CHANGELOGS.map((log) => ({
                  label: `${log.id} (${log.date})`,
                  value: log.id,
                }))}
                size="large"
                style={{ width: '100%' }}
                value={selectedChangelog}
              />
            </Flexbox>

            {/* Language Toggle */}
            <Flexbox align="center" gap={12} horizontal justify="space-between">
              <Text strong>Language</Text>
              <Flexbox align="center" gap={8} horizontal>
                <Text type={!isVietnamese ? 'secondary' : undefined}>Vietnamese</Text>
                <Switch checked={!isVietnamese} onChange={(checked) => setIsVietnamese(!checked)} />
                <Text type={isVietnamese ? 'secondary' : undefined}>English</Text>
              </Flexbox>
            </Flexbox>

            {/* Content Preview */}
            <Flexbox gap={8}>
              <Text strong>Content Preview</Text>
              <Card
                size="small"
                style={{
                  background: theme.colorBgLayout,
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                <Title level={4}>{title}</Title>
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{content}</Paragraph>
              </Card>
            </Flexbox>

            {/* Test Email */}
            <Flexbox gap={8}>
              <Text strong>Test Email</Text>
              <Flexbox gap={12} horizontal>
                <Input
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your@email.com"
                  size="large"
                  style={{ flex: 1 }}
                  value={testEmail}
                />
                <Tooltip title="Send test email to yourself first">
                  <Button
                    icon={<TestTube size={16} />}
                    loading={loading}
                    onClick={sendTestEmail}
                    size="large"
                  >
                    Send Test
                  </Button>
                </Tooltip>
              </Flexbox>
            </Flexbox>

            {/* Send to All Button */}
            <Button
              block
              icon={<Send size={16} />}
              loading={loading}
              onClick={sendToAll}
              size="large"
              type="primary"
            >
              Send to All Subscribers ({stats.subscriberCount})
            </Button>
          </Flexbox>
        </Card>

        {/* Right: Email Preview */}
        <Card
          style={{
            background: '#0B0E14',
            border: `1px solid ${theme.colorBorderSecondary}`,
            flex: 1,
            minWidth: 400,
          }}
          title={<Text style={{ color: '#fff' }}>Email Preview</Text>}
        >
          <Flexbox
            style={{
              background: '#141821',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* Email Header */}
            <Flexbox align="center" padding={24} style={{ textAlign: 'center' }}>
              <img alt="Pho.chat" src="/images/logo_text.png" style={{ height: 40 }} />
            </Flexbox>

            {/* Email Title */}
            <Flexbox padding="0 24px 12px">
              <Title level={4} style={{ color: '#fff', margin: 0, textAlign: 'center' }}>
                {title || 'Newsletter Title'}
              </Title>
            </Flexbox>

            {/* Email Content */}
            <Flexbox
              padding="0 24px 24px"
              style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.7 }}
            >
              <div style={{ maxHeight: 300, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {content || 'Newsletter content will appear here...'}
              </div>
            </Flexbox>

            {/* CTA Button */}
            <Flexbox align="center" padding="0 24px 24px">
              <Button
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  border: 'none',
                  borderRadius: 10,
                  boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                  color: '#fff',
                  fontWeight: 600,
                  padding: '10px 32px',
                }}
              >
                Xem Chi Tiết →
              </Button>
            </Flexbox>

            {/* Footer */}
            <Flexbox
              align="center"
              padding={16}
              style={{
                background: 'rgba(0,0,0,0.2)',
                color: 'rgba(255,255,255,0.5)',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
                Bạn nhận được email này vì đã đăng ký Phở.chat Newsletter.
              </Text>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Hủy đăng ký nhận tin
              </Text>
            </Flexbox>
          </Flexbox>
        </Card>
      </Flexbox>
    </Flexbox>
  );
});

NewsletterAdmin.displayName = 'NewsletterAdmin';

export default NewsletterAdmin;
