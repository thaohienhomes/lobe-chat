'use client';

import { createStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox, FlexboxProps } from 'react-layout-kit';

import PlanTag from '@/features/User/PlanTag';
import { useUserStore } from '@/store/user';
import { authSelectors, userProfileSelectors } from '@/store/user/selectors';

import UserAvatar, { type UserAvatarProps } from './UserAvatar';

const useStyles = createStyles(({ css, token }) => ({
  nickname: css`
    font-size: 16px;
    font-weight: bold;
    line-height: 1;
  `,
  username: css`
    line-height: 1;
    color: ${token.colorTextDescription};
  `,
}));

export interface UserInfoProps extends FlexboxProps {
  avatarProps?: Partial<UserAvatarProps>;
  onClick?: () => void;
}

const UserInfo = memo<UserInfoProps>(({ avatarProps, onClick, ...rest }) => {
  const { t } = useTranslation('setting');
  const { styles, theme } = useStyles();
  const isSignedIn = useUserStore(authSelectors.isLogin);
  const [nickname, username, subscriptionPlan] = useUserStore((s) => [
    userProfileSelectors.nickName(s),
    userProfileSelectors.username(s),
    s.subscriptionPlan,
  ]);

  return (
    <Flexbox
      align={'center'}
      gap={12}
      horizontal
      justify={'space-between'}
      paddingBlock={12}
      paddingInline={12}
      {...rest}
    >
      <Flexbox align={'center'} gap={12} horizontal onClick={onClick}>
        <UserAvatar background={theme.colorFill} size={48} {...avatarProps} />
        <Flexbox flex={1} gap={6}>
          <Flexbox align={'center'} gap={6} horizontal>
            <div className={styles.nickname}>{nickname}</div>
            {subscriptionPlan === 'medical_beta' && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #00C9A7, #0891B2)',
                  borderRadius: 12,
                  boxShadow: '0 0 8px rgba(0,201,167,0.3)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 'bold',
                  paddingBlock: 2,
                  paddingInline: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                {t('medicalBadge', { ns: 'setting' })}
              </div>
            )}
          </Flexbox>
          <div className={styles.username}>{username}</div>
        </Flexbox>
      </Flexbox>
      {isSignedIn && <PlanTag type={subscriptionPlan} />}
    </Flexbox>
  );
});

export default UserInfo;
