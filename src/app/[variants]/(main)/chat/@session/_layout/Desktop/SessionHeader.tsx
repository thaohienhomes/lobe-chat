'use client';

import { ActionIcon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { MessageSquarePlus } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { ProductLogo } from '@/components/Branding';
import { enableAuth } from '@/const/auth';
import { DESKTOP_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import SignInBenefitsModal from '@/features/Auth/SignInBenefitsModal';
import { useActionSWR } from '@/libs/swr';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/selectors';

import TogglePanelButton from '../../../features/TogglePanelButton';
import SessionSearchBar from '../../features/SessionSearchBar';

export const useStyles = createStyles(({ css, token }) => ({
  logo: css`
    cursor: pointer;
    color: ${token.colorText};
    fill: ${token.colorText};
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  `,
  top: css`
    position: sticky;
    inset-block-start: 0;
    padding-block-start: 10px;
  `,
}));

const Header = memo(() => {
  const { styles } = useStyles();
  const { t } = useTranslation('chat');
  const [createSession] = useSessionStore((s) => [s.createSession]);
  const { showCreateSession } = useServerConfigStore(featureFlagsSelectors);
  const isLoginWithAuth = useUserStore(authSelectors.isLoginWithAuth);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);

  const { mutate, isValidating } = useActionSWR('session.createSession', () => createSession());

  const handleLogoClick = () => {
    // Only show benefits modal if auth is enabled and user is not logged in
    if (enableAuth && !isLoginWithAuth) {
      setShowBenefitsModal(true);
    }
  };

  return (
    <>
      <Flexbox className={styles.top} gap={16} paddingInline={8}>
        <Flexbox align={'flex-start'} horizontal justify={'space-between'}>
          <Flexbox
            align={'center'}
            gap={4}
            horizontal
            style={{
              paddingInlineStart: 4,
              paddingTop: 2,
            }}
          >
            <ProductLogo
              className={styles.logo}
              onClick={handleLogoClick}
              size={36}
              type={'text'}
            />
          </Flexbox>
          <Flexbox align={'center'} gap={4} horizontal>
            <TogglePanelButton />
            {showCreateSession && (
              <ActionIcon
                icon={MessageSquarePlus}
                loading={isValidating}
                onClick={() => mutate()}
                size={DESKTOP_HEADER_ICON_SIZE}
                style={{ flex: 'none' }}
                title={t('newAgent')}
                tooltipProps={{
                  placement: 'bottom',
                }}
              />
            )}
          </Flexbox>
        </Flexbox>
        <SessionSearchBar />
      </Flexbox>

      <SignInBenefitsModal onClose={() => setShowBenefitsModal(false)} open={showBenefitsModal} />
    </>
  );
});

export default Header;
