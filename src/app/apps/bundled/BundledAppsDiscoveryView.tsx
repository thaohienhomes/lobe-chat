'use client';

import { Avatar, Tag } from '@lobehub/ui';
import { Button, Card, Col, Divider, Row, Typography } from 'antd';
import { Play, Star } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import BundledAppShareButton from '@/components/BundledAppShareButton';
import { BundledAppItem } from '@/database/schemas';

const { Title, Paragraph, Text } = Typography;

interface BundledAppsDiscoveryViewProps {
  allApps: BundledAppItem[];
  featuredApps: BundledAppItem[];
  isAuthenticated: boolean;
}

const BundledAppCard = memo<{ app: BundledAppItem; isAuthenticated: boolean }>(
  ({ app, isAuthenticated }) => {
    const handleStartChat = () => {
      if (!isAuthenticated) {
        const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/api/bundled-apps/${app.id}`)}`;
        window.location.href = loginUrl;
      } else {
        window.location.href = `/api/bundled-apps/${app.id}`;
      }
    };

    return (
      <Card
        actions={[
          <Button icon={<Play size={16} />} key="start" onClick={handleStartChat} type="primary">
            {isAuthenticated ? 'Start Chat' : 'Login & Start'}
          </Button>,
          <Link href={`/apps/bundled/${app.id}`} key="view">
            <Button>View Details</Button>
          </Link>,
          <BundledAppShareButton bundledApp={app} key="share" />,
        ]}
        hoverable
        style={{ height: '100%' }}
      >
        <Flexbox gap={12}>
          <Flexbox align="center" gap={12} horizontal>
            <Avatar avatar={app.avatar} background={app.backgroundColor || undefined} size={48} />
            <Flexbox gap={4}>
              <Flexbox align="center" gap={8} horizontal>
                <Title level={4} style={{ margin: 0 }}>
                  {app.title}
                </Title>
                {app.isFeatured && <Star fill="gold" size={16} style={{ color: 'gold' }} />}
              </Flexbox>
              {app.category && (
                <Tag color="blue" size="small">
                  {app.category}
                </Tag>
              )}
            </Flexbox>
          </Flexbox>

          <Paragraph ellipsis={{ rows: 3 }} style={{ color: '#666', minHeight: '72px' }}>
            {app.description}
          </Paragraph>

          {app.tags && app.tags.length > 0 && (
            <Flexbox gap={4} horizontal wrap="wrap">
              {app.tags.slice(0, 3).map((tag, index) => (
                <Tag key={index} size="small">
                  {tag}
                </Tag>
              ))}
              {app.tags.length > 3 && <Tag size="small">+{app.tags.length - 3} more</Tag>}
            </Flexbox>
          )}

          <Flexbox align="center" gap={8} horizontal style={{ color: '#999', fontSize: '12px' }}>
            <Text type="secondary">
              Used {typeof app.usageCount === 'number' ? app.usageCount : 0} times
            </Text>
          </Flexbox>
        </Flexbox>
      </Card>
    );
  },
);

const BundledAppsDiscoveryView = memo<BundledAppsDiscoveryViewProps>(
  ({ featuredApps, allApps, isAuthenticated }) => {
    const regularApps = allApps.filter((app) => !app.isFeatured);

    return (
      <Flexbox gap={32} padding={24} style={{ margin: '0 auto', maxWidth: 1200 }}>
        {/* Header */}
        <Flexbox align="center" gap={8}>
          <Title level={1} style={{ margin: 0 }}>
            Discover AI Assistants
          </Title>
          <Paragraph style={{ color: '#666', fontSize: 16, margin: 0 }}>
            Pre-configured AI assistants ready to help with your tasks
          </Paragraph>
        </Flexbox>

        {/* Featured Apps */}
        {featuredApps.length > 0 && (
          <Flexbox gap={16}>
            <Flexbox align="center" gap={8} horizontal>
              <Star fill="gold" size={20} style={{ color: 'gold' }} />
              <Title level={2} style={{ margin: 0 }}>
                Featured
              </Title>
            </Flexbox>
            <Row gutter={[16, 16]}>
              {featuredApps.map((app) => (
                <Col key={app.id} lg={8} md={12} xs={24}>
                  <BundledAppCard app={app} isAuthenticated={isAuthenticated} />
                </Col>
              ))}
            </Row>
          </Flexbox>
        )}

        {/* All Apps */}
        {regularApps.length > 0 && (
          <>
            <Divider />
            <Flexbox gap={16}>
              <Title level={2} style={{ margin: 0 }}>
                All Assistants ({regularApps.length})
              </Title>
              <Row gutter={[16, 16]}>
                {regularApps.map((app) => (
                  <Col key={app.id} lg={8} md={12} xs={24}>
                    <BundledAppCard app={app} isAuthenticated={isAuthenticated} />
                  </Col>
                ))}
              </Row>
            </Flexbox>
          </>
        )}

        {/* Empty State */}
        {allApps.length === 0 && (
          <Flexbox align="center" gap={16} style={{ padding: 48, textAlign: 'center' }}>
            <Title level={3} style={{ color: '#999' }}>
              No AI assistants available yet
            </Title>
            <Paragraph style={{ color: '#666' }}>
              Check back later for pre-configured AI assistants
            </Paragraph>
          </Flexbox>
        )}
      </Flexbox>
    );
  },
);

export default BundledAppsDiscoveryView;
