'use client';

import { SiDiscord, SiGithub, SiMedium, SiX } from '@icons-pack/react-simple-icons';
import { ActionIcon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { SOCIAL_URL } from '@/const/branding';
import { GITHUB } from '@/const/url';

const useStyles = createStyles(({ css, token }) => {
  return {
    icon: css`
      svg {
        fill: ${token.colorTextDescription};
      }

      &:hover {
        svg {
          fill: ${token.colorText};
        }
      }
    `,
  };
});

const Follow = memo(() => {
  const { styles } = useStyles();
  const { t } = useTranslation('common');

  // Only show social links that are defined
  const socialLinks = [
    { url: GITHUB, icon: SiGithub, name: 'GitHub' },
    { url: SOCIAL_URL.x, icon: SiX, name: 'X' },
    { url: SOCIAL_URL.discord, icon: SiDiscord, name: 'Discord' },
    { url: SOCIAL_URL.medium, icon: SiMedium, name: 'Medium' },
  ].filter(link => link.url);

  if (socialLinks.length === 0) return null;

  return (
    <Flexbox gap={8} horizontal>
      {socialLinks.map(({ url, icon, name }) => (
        <Link key={name} href={url} rel="noreferrer" target={'_blank'}>
          <ActionIcon
            className={styles.icon}
            icon={icon as any}
            title={t('follow', { name })}
          />
        </Link>
      ))}
    </Flexbox>
  );
});

Follow.displayName = 'Follow';

export default Follow;
