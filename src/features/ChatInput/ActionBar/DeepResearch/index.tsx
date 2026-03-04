'use client';

import { Badge } from 'antd';
import { createStyles, keyframes } from 'antd-style';
import { BookOpen } from 'lucide-react';
import { memo } from 'react';

import { useChatStore } from '@/store/chat';

import Action from '../components/Action';

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.75; transform: scale(1.08); }
`;

const useStyles = createStyles(({ css }) => ({
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
      background: linear-gradient(135deg, #667eea, #764ba2) !important;
      box-shadow: 0 0 6px rgba(102, 126, 234, 0.5) !important;
    }
  `,
}));

const DeepResearchAction = memo(() => {
    const { styles } = useStyles();
    const openDeepResearch = useChatStore((s) => s.openDeepResearch);

    return (
        <div className={styles.badgeWrapper}>
            <Badge
                count={'MỚI'}
                offset={[0, 4]}
                size={'small'}
            >
                <Action
                    icon={BookOpen}
                    onClick={() => openDeepResearch()}
                    title={'Deep Research — Tổng quan y văn tự động'}
                    tooltipProps={{
                        placement: 'bottom',
                    }}
                />
            </Badge>
        </div>
    );
});

DeepResearchAction.displayName = 'DeepResearchAction';
export default DeepResearchAction;
