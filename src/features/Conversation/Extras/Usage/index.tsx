import { ModelIcon } from '@lobehub/icons';
import { Tooltip } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { Zap } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';

import { MessageMetadata } from '@/types/message';
import { formatNumber } from '@/utils/format';

import TokenDetail from './UsageDetail';

export const useStyles = createStyles(({ token, css, cx }) => ({
  container: cx(css`
    font-size: 12px;
    color: ${token.colorTextQuaternary};
  `),
  speedBadge: cx(css`
    padding: 2px 6px;
    border-radius: 4px;
    background: linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorSuccessBg} 100%);
    color: ${token.colorSuccess};
    font-size: 11px;
    font-weight: 500;
  `),
}));

interface UsageProps {
  metadata: MessageMetadata;
  model: string;
  provider: string;
}

const Usage = memo<UsageProps>(({ model, metadata, provider }) => {
  const { styles } = useStyles();
  const { t } = useTranslation('chat');

  const tps = metadata?.tps ? formatNumber(metadata.tps, 1) : undefined;

  return (
    <Flexbox
      align={'center'}
      className={styles.container}
      gap={12}
      horizontal
      justify={'space-between'}
    >
      <Flexbox align={'center'} gap={8} horizontal>
        <Center gap={4} horizontal style={{ fontSize: 12 }}>
          <ModelIcon model={model as string} type={'mono'} />
          {model}
        </Center>

        {tps && (
          <Tooltip title={t('messages.tokenDetails.speed.tps.tooltip')}>
            <Flexbox
              align={'center'}
              className={styles.speedBadge}
              gap={2}
              horizontal
            >
              <Zap size={10} />
              <span>{tps} t/s</span>
            </Flexbox>
          </Tooltip>
        )}
      </Flexbox>

      {!!metadata.totalTokens && (
        <TokenDetail meta={metadata} model={model as string} provider={provider} />
      )}
    </Flexbox>
  );
});

export default Usage;
