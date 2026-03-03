'use client';

import { Badge } from 'antd';
import { createStyles, keyframes } from 'antd-style';
import { FlaskConical } from 'lucide-react';
import { memo } from 'react';

import { useChatStore } from '@/store/chat';

import Action from '../components/Action';

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 226, 183, 0.6); }
  50%       { box-shadow: 0 0 0 5px rgba(99, 226, 183, 0); }
`;

const useStyles = createStyles(({ css }) => ({
    badge: css`
    .ant-badge-dot {
      width: 8px;
      height: 8px;
      background: #63e2b7;
      animation: ${pulse} 2s ease-in-out infinite;
    }
  `,
}));

const Research = memo(() => {
    const { styles } = useStyles();
    const openResearchMode = useChatStore((s) => s.openResearchMode);

    return (
        <Badge
            className={styles.badge}
            count={'NEW'}
            offset={[-2, 2]}
            size={'small'}
            style={{
                background: 'linear-gradient(135deg, #1a7a5c, #63e2b7)',
                color: '#fff',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.3,
                lineHeight: '14px',
                minWidth: 28,
                padding: '0 4px',
            }}
        >
            <Action
                icon={FlaskConical}
                onClick={() => openResearchMode()}
                title={'Research Mode — Tổng quan hệ thống'}
                tooltipProps={{
                    placement: 'bottom',
                }}
            />
        </Badge>
    );
});

Research.displayName = 'ResearchAction';
export default Research;
