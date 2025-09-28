'use client';

import { SiDiscord, SiGithub, SiMedium, SiRss, SiX } from '@icons-pack/react-simple-icons';
import { Form } from '@lobehub/ui';
import { Divider } from 'antd';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { BRANDING_EMAIL, BRANDING_NAME, SOCIAL_URL } from '@/const/branding';
import { BLOG, OFFICIAL_SITE, PRIVACY_URL, TERMS_URL, mailTo } from '@/const/url';

import AboutList from './features/AboutList';
import Analytics from './features/Analytics';
import ItemCard from './features/ItemCard';
import type { ItemCardProps } from './features/ItemCard';
import ItemLink from './features/ItemLink';
import Version from './features/Version';

const useStyles = createStyles(({ css, token }) => ({
  title: css`
    font-size: 14px;
    font-weight: bold;
    color: ${token.colorTextSecondary};
  `,
}));

const Page = memo<{ mobile?: boolean }>(({ mobile }) => {
  const { t } = useTranslation('common');
  const infoItems: ItemCardProps[] = [
    {
      href: BLOG,
      icon: SiRss,
      label: t('blog'),
      value: 'blog',
    },
  ];

  const { github, discord, x, medium } = SOCIAL_URL;
  if (github) infoItems.push({ href: github, icon: SiGithub, label: 'GitHub', value: 'feedback' });
  if (discord)
    infoItems.push({ href: discord, icon: SiDiscord, label: 'Discord', value: 'discord' });
  if (x) infoItems.push({ href: x, icon: SiX as any, label: 'X / Twitter', value: 'x' });
  if (medium) infoItems.push({ href: medium, icon: SiMedium, label: 'Medium', value: 'medium' });

  const { styles } = useStyles();

  return (
    <>
      <Form.Group
        style={{ maxWidth: '1024px', width: '100%' }}
        title={`${t('about')} ${BRANDING_NAME}`}
        variant={'borderless'}
      >
        <Flexbox gap={20} paddingBlock={20} width={'100%'}>
          <div className={styles.title}>{t('version')}</div>
          <Version mobile={mobile} />
          <Divider style={{ marginBlock: 0 }} />
          <div className={styles.title}>{t('contact')}</div>
          <AboutList
            ItemRender={ItemLink}
            items={[
              {
                href: OFFICIAL_SITE,
                label: t('officialSite'),
                value: 'officialSite',
              },
              {
                href: mailTo(BRANDING_EMAIL.support),
                label: t('mail.support'),
                value: 'support',
              },
              {
                href: mailTo(BRANDING_EMAIL.business),
                label: t('mail.business'),
                value: 'business',
              },
            ]}
          />
          <Divider style={{ marginBlock: 0 }} />
          <div className={styles.title}>{t('information')}</div>
          <AboutList ItemRender={ItemCard} grid items={infoItems} />
          <Divider style={{ marginBlock: 0 }} />
          <div className={styles.title}>{t('legal')}</div>
          <AboutList
            ItemRender={ItemLink}
            items={[
              {
                href: TERMS_URL,
                label: t('terms'),
                value: 'terms',
              },
              {
                href: PRIVACY_URL,
                label: t('privacy'),
                value: 'privacy',
              },
            ]}
          />
        </Flexbox>
      </Form.Group>
      <Analytics />
    </>
  );
});

Page.displayName = 'AboutSetting';

export default Page;
