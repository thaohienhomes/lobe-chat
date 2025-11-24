'use client';

import { ActionIcon, Avatar, CopyButton, Tag } from '@lobehub/ui';
import { Button, Card, Divider, Typography } from 'antd';
import { ExternalLink, Play, Share2 } from 'lucide-react';
import Link from 'next/link';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { BundledAppItem } from '@/database/schemas';

const { Title, Paragraph, Text } = Typography;

interface BundledAppLandingViewProps {
  bundledApp: BundledAppItem;
  isAuthenticated: boolean;
}

const BundledAppLandingView = memo<BundledAppLandingViewProps>(
  ({ bundledApp, isAuthenticated }) => {
    const [shareUrl] = useState(`${window.location.origin}/apps/bundled/${bundledApp.id}`);

    const handleStartChat = () => {
      if (!isAuthenticated) {
        // Redirect to login with callback
        const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/api/bundled-apps/${bundledApp.id}`)}`;
        window.location.href = loginUrl;
      } else {
        // Direct to bundled app API which will create session and redirect
        window.location.href = `/api/bundled-apps/${bundledApp.id}`;
      }
    };

    return (
      <Flexbox
        align="center"
        gap={24}
        padding={24}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          minHeight: '100vh',
        }}
      >
        <Card
          style={{
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            maxWidth: 600,
            width: '100%',
          }}
        >
          <Flexbox align="center" gap={16}>
            {/* Avatar and Title */}
            <Flexbox align="center" gap={16} horizontal>
              <Avatar
                avatar={bundledApp.avatar}
                background={bundledApp.backgroundColor || undefined}
                size={64}
              />
              <Flexbox gap={4}>
                <Title level={2} style={{ margin: 0 }}>
                  {bundledApp.title}
                </Title>
                {bundledApp.category && <Tag color="blue">{bundledApp.category}</Tag>}
              </Flexbox>
            </Flexbox>

            {/* Description */}
            {bundledApp.description && (
              <Paragraph style={{ color: '#666', fontSize: 16 }}>
                {bundledApp.description}
              </Paragraph>
            )}

            {/* Tags */}
            {bundledApp.tags && bundledApp.tags.length > 0 && (
              <Flexbox gap={8} horizontal wrap="wrap">
                {bundledApp.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </Flexbox>
            )}

            {/* Opening Message */}
            {bundledApp.openingMessage && (
              <>
                <Divider />
                <Flexbox gap={8}>
                  <Text strong>Opening Message:</Text>
                  <Text italic>&ldquo;{bundledApp.openingMessage}&rdquo;</Text>
                </Flexbox>
              </>
            )}

            {/* Opening Questions */}
            {bundledApp.openingQuestions && bundledApp.openingQuestions.length > 0 && (
              <Flexbox gap={8}>
                <Text strong>Suggested Questions:</Text>
                <Flexbox gap={4}>
                  {bundledApp.openingQuestions.map((question, index) => (
                    <Text key={index} style={{ color: '#666' }}>
                      • {question}
                    </Text>
                  ))}
                </Flexbox>
              </Flexbox>
            )}

            <Divider />

            {/* Action Buttons */}
            <Flexbox gap={12} horizontal style={{ width: '100%' }}>
              <Button
                icon={<Play size={16} />}
                onClick={handleStartChat}
                size="large"
                style={{ flex: 1 }}
                type="primary"
              >
                {isAuthenticated ? 'Start Chat' : 'Login & Start Chat'}
              </Button>

              <CopyButton
                content={shareUrl}
                icon={Share2}
                size="large"
                style={{ minWidth: 48 }}
                title="Copy Share Link"
              />
            </Flexbox>

            {/* Footer Info */}
            <Flexbox align="center" gap={8} horizontal style={{ color: '#999', fontSize: 12 }}>
              <Text type="secondary">
                Usage: {typeof bundledApp.usageCount === 'number' ? bundledApp.usageCount : 0} times
              </Text>
              {bundledApp.isFeatured && (
                <>
                  <Text type="secondary">•</Text>
                  <Text type="secondary">Featured</Text>
                </>
              )}
            </Flexbox>
          </Flexbox>
        </Card>

        {/* Footer */}
        <Flexbox align="center" gap={8} horizontal>
          <Text style={{ color: 'rgba(255,255,255,0.8)' }}>Powered by</Text>
          <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
            <Text strong style={{ color: 'white' }}>
              pho.chat
            </Text>
          </Link>
          <ActionIcon
            icon={ExternalLink}
            onClick={() => window.open('/', '_blank')}
            size="small"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          />
        </Flexbox>
      </Flexbox>
    );
  },
);

export default BundledAppLandingView;
