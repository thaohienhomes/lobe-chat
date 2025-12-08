import { ActionIcon, ActionIconProps } from '@lobehub/ui';
import { Divider } from 'antd';
import { Book, Github } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { DOCUMENTS_REFER_URL, GITHUB } from '@/const/url';
import { UsageMeter } from '@/features/UsageMeter';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

const ICON_SIZE: ActionIconProps['size'] = {
  blockSize: 36,
  size: 20,
  strokeWidth: 1.5,
};

/**
 * BottomActions Component
 *
 * Shows:
 * - UsageMeter compact mode (Phở Points balance)
 * - GitHub link
 * - Documentation link
 *
 * Based on PRICING_MASTERPLAN.md.md
 */
const BottomActions = memo(() => {
  const { t } = useTranslation('common');
  const { hideGitHub, hideDocs } = useServerConfigStore(featureFlagsSelectors);

  return (
    <Flexbox gap={8}>
      {/* Compact UsageMeter showing Phở Points balance */}
      <UsageMeter compact />
      <Divider style={{ margin: '4px 0' }} />

      {!hideGitHub && (
        <Link aria-label={'GitHub'} href={GITHUB} target={'_blank'}>
          <ActionIcon
            icon={Github}
            size={ICON_SIZE}
            title={'GitHub'}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
      {!hideDocs && (
        <Link aria-label={t('document')} href={DOCUMENTS_REFER_URL} target={'_blank'}>
          <ActionIcon
            icon={Book}
            size={ICON_SIZE}
            title={t('document')}
            tooltipProps={{ placement: 'right' }}
          />
        </Link>
      )}
    </Flexbox>
  );
});

export default BottomActions;
