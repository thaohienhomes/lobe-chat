'use client';

import { ActionIcon, Avatar, Button } from '@lobehub/ui';
import { message } from 'antd';
import { Copy, Eye, GitFork, LogIn, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { SharedConversation } from '@/database/schemas';

interface SharedConversationViewProps {
  isAuthenticated: boolean;
  sharedConversation: SharedConversation;
}

const SharedConversationView = memo<SharedConversationViewProps>(
  ({ sharedConversation, isAuthenticated }) => {
    const router = useRouter();
    const [forking, setForking] = useState(false);

    const handleFork = async () => {
      if (!isAuthenticated) {
        // Redirect to login with return URL
        router.push(`/login?callbackUrl=/share/${sharedConversation.id}`);
        return;
      }

      setForking(true);
      try {
        // Fork conversation (create new session with same config + messages)
        const response = await fetch(`/api/share/${sharedConversation.id}/fork`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error('Failed to fork conversation');
        }

        const data = await response.json();
        
        // Redirect to new session
        router.push(`/chat?session=${data.sessionId}`);
      } catch (error) {
        console.error('Error forking conversation:', error);
        message.error('Failed to fork conversation');
      } finally {
        setForking(false);
      }
    };

    const handleCopyLink = () => {
      const url = `${window.location.origin}/share/${sharedConversation.id}`;
      navigator.clipboard.writeText(url);
      message.success('Link copied to clipboard!');
    };

    return (
      <Flexbox gap={24} padding={24} style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <Flexbox gap={16}>
          <Flexbox align={'center'} gap={12} horizontal>
            <Avatar
              avatar={sharedConversation.avatar || '💬'}
              background={sharedConversation.backgroundColor || '#6366f1'}
              size={64}
            />
            <Flexbox flex={1} gap={4}>
              <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>
                {sharedConversation.title}
              </h1>
              {sharedConversation.description && (
                <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0 }}>
                  {sharedConversation.description}
                </p>
              )}
            </Flexbox>
          </Flexbox>

          {/* Stats & Actions */}
          <Flexbox align={'center'} gap={12} horizontal justify={'space-between'}>
            <Flexbox align={'center'} gap={16} horizontal>
              <Flexbox align={'center'} gap={4} horizontal>
                <Eye size={16} style={{ color: 'rgba(255,255,255,0.45)' }} />
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                  {sharedConversation.viewCount || 0} views
                </span>
              </Flexbox>
              <Flexbox align={'center'} gap={4} horizontal>
                <GitFork size={16} style={{ color: 'rgba(255,255,255,0.45)' }} />
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                  {sharedConversation.forkCount || 0} forks
                </span>
              </Flexbox>
            </Flexbox>

            <Flexbox align={'center'} gap={8} horizontal>
              <ActionIcon icon={Copy} onClick={handleCopyLink} title="Copy link" />
              <Button
                icon={isAuthenticated ? GitFork : LogIn}
                loading={forking}
                onClick={handleFork}
                type="primary"
              >
                {isAuthenticated ? 'Try it yourself' : 'Sign in to try'}
              </Button>
            </Flexbox>
          </Flexbox>
        </Flexbox>

        {/* Messages */}
        <Flexbox gap={16}>
          {sharedConversation.messages && sharedConversation.messages.length > 0 ? (
            sharedConversation.messages.map((msg: any, index: number) => (
              <Flexbox
                key={index}
                gap={8}
                padding={16}
                style={{
                  background: msg.role === 'user' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.2)',
                  borderRadius: 8,
                }}
              >
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600 }}>
                  {msg.role === 'user' ? 'USER' : 'ASSISTANT'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </Flexbox>
            ))
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
              No messages in this conversation
            </div>
          )}
        </Flexbox>
      </Flexbox>
    );
  },
);

export default SharedConversationView;

