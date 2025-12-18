import { Tag } from '@lobehub/ui';
import { useTheme } from 'antd-style';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import urlJoin from 'url-join';

import { OFFICIAL_URL } from '@/const/url';
import { isDesktop } from '@/const/version';
import PlanIcon from '@/features/PlanIcon';

export enum PlanType {
  Preview = 'preview',
}

export interface PlanTagProps {
  /**
   * Plan code (e.g., 'vn_free', 'vn_pro', 'gl_lifetime') or PlanType.Preview
   */
  type?: PlanType | string;
}

const PlanTag = memo<PlanTagProps>(({ type = PlanType.Preview }) => {
  const { t } = useTranslation('common');
  const theme = useTheme();

  if (type === PlanType.Preview) {
    return (
      <Tag
        bordered={false}
        style={{ background: theme.colorFill, borderRadius: 12, cursor: 'pointer' }}
      >
        {t('userPanel.community')}
      </Tag>
    );
  }

  const isFree = type === 'free' || type === 'vn_free';

  // Fix: Navigate to correct settings page with usage tab active
  const href = isFree ? '/subscription/plans' : '/settings?active=usage';

  return (
    <Link
      href={urlJoin(isDesktop ? OFFICIAL_URL : '/', href)}
      style={{ cursor: 'pointer' }}
      target={isDesktop ? '_blank' : undefined}
    >
      <PlanIcon plan={type} size={22} type={'tag'} />
    </Link>
  );
});

export default PlanTag;
