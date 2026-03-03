'use client';

import { Badge } from 'antd';
import { createStyles, keyframes } from 'antd-style';
import { FlaskConical } from 'lucide-react';
import { memo } from 'react';

import { useChatStore } from '@/store/chat';

import Action from '../components/Action';

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.75; transform: scale(1.08); }
`;

const useStyles = createStyles(({ css }) => ({
    // Ensures the badge is never clipped by any ancestor overflow:hidden
    badgeWrapper: css`
    position: relative;
    display: inline-flex;
    overflow: visible;
    .ant-badge-count {
      animation: ${pulse} 2s ease-in-out infinite;
      font-size: 9px !important;
      font-weight: 700 !important;
      letter-spacing: 0.3px !important;
      min-width: 26px !important;
      height: 14px !important;
      line-height: 14px !important;
      padding: 0 4px !important;
      background: linear-gradient(135deg, #1a6b4e, #63e2b7) !important;
      box-shadow: 0 0 6px rgba(99, 226, 183, 0.5) !important;
    }
  `,
}));

const Research = memo(() => {
    const { styles } = useStyles();
    const openResearchMode = useChatStore((s) => s.openResearchMode);

    return (
        <div className={styles.badgeWrapper}>
            <Badge
                count={'MỚI'}
                offset={[0, 4]}
                size={'small'}
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
        </div>
    );
});

Research.displayName = 'ResearchAction';
export default Research;
