import { useAnalyticsSafe } from '@/hooks/useAnalyticsSafe';
import { Button } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import UserInfo from '../UserInfo';

const UserLoginOrSignup = memo<{ onClick: () => void }>(({ onClick }) => {
  const { t } = useTranslation('auth');
  const { analytics } = useAnalyticsSafe();

  const handleClick = () => {
    analytics?.track({
      name: 'login_or_signup_clicked',
      properties: {
        spm: 'homepage.login_or_signup.click',
      },
    });

    // Explicit Funnel Event: Signup Intent
    analytics?.track({
      name: 'user_signup_initiated',
      properties: {
        source: 'homepage_community_button',
      },
    });

    onClick();
  };

  return (
    <>
      <UserInfo />
      <Flexbox paddingBlock={12} paddingInline={16} width={'100%'}>
        <Button block onClick={handleClick} type={'primary'}>
          {t('loginOrSignup')}
        </Button>
      </Flexbox>
    </>
  );
});

export default UserLoginOrSignup;
