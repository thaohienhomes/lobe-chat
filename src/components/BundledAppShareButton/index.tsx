'use client';

import { ActionIcon, CopyButton } from '@lobehub/ui';
import { App, Modal, Space, Typography } from 'antd';
import { Share2 } from 'lucide-react';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { BundledAppItem } from '@/database/schemas';

const { Text, Title } = Typography;

interface BundledAppShareButtonProps {
  bundledApp: BundledAppItem;
  size?: 'small' | 'large';
}

const BundledAppShareButton = memo<BundledAppShareButtonProps>(({ bundledApp, size = 'small' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const generateShareLink = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bundled-apps/${bundledApp.id}/share`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error generating share link:', error);
      message.error('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (shareUrl) {
      setIsModalOpen(true);
    } else {
      generateShareLink();
    }
  };

  const handleCopySuccess = () => {
    message.success('Share link copied to clipboard!');
  };

  return (
    <>
      <ActionIcon
        icon={Share2}
        loading={loading}
        onClick={handleShare}
        size={size}
        title="Share this bundled app"
      />

      <Modal
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        open={isModalOpen}
        title="Share Bundled App"
        width={500}
      >
        <Flexbox gap={16}>
          {/* App Info */}
          <Flexbox gap={8}>
            <Title level={4} style={{ margin: 0 }}>
              {bundledApp.title}
            </Title>
            {bundledApp.description && <Text type="secondary">{bundledApp.description}</Text>}
          </Flexbox>

          {/* Share URL */}
          <Flexbox gap={8}>
            <Text strong>Share Link:</Text>
            <Space.Compact style={{ width: '100%' }}>
              <input
                readOnly
                style={{
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px 0 0 6px',
                  flex: 1,
                  fontSize: '14px',
                  padding: '8px 12px',
                }}
                value={shareUrl}
              />
              <CopyButton
                content={shareUrl}
                onCopy={handleCopySuccess}
                style={{
                  borderRadius: '0 6px 6px 0',
                  height: '36px',
                  minWidth: '36px',
                }}
              />
            </Space.Compact>
          </Flexbox>

          {/* Usage Info */}
          <Flexbox gap={4}>
            <Text style={{ fontSize: '12px' }} type="secondary">
              • Anyone with this link can view and use this bundled app
            </Text>
            <Text style={{ fontSize: '12px' }} type="secondary">
              • Users will need to login to start a chat session
            </Text>
            <Text style={{ fontSize: '12px' }} type="secondary">
              • Usage count: {typeof bundledApp.usageCount === 'number' ? bundledApp.usageCount : 0}{' '}
              times
            </Text>
          </Flexbox>

          {/* Social Share Buttons (Optional) */}
          <Flexbox gap={8} horizontal>
            <Text style={{ fontSize: '12px' }} type="secondary">
              Share on:
            </Text>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `Check out ${bundledApp.title} on pho.chat!`,
              )}&url=${encodeURIComponent(shareUrl)}`}
              rel="noopener noreferrer"
              style={{ color: '#1DA1F2', fontSize: '12px' }}
              target="_blank"
            >
              Twitter
            </a>
            <Text style={{ fontSize: '12px' }} type="secondary">
              •
            </Text>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              rel="noopener noreferrer"
              style={{ color: '#0077B5', fontSize: '12px' }}
              target="_blank"
            >
              LinkedIn
            </a>
          </Flexbox>
        </Flexbox>
      </Modal>
    </>
  );
});

export default BundledAppShareButton;
