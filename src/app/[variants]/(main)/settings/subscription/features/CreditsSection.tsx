'use client';

import { Card, Statistic, Typography } from 'antd';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';

const { Title } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  card: css`
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadiusLG}px;
    color: ${token.colorText};
    background: ${token.colorBgContainer};
  `,
}));

const CreditsSection = memo(() => {
  const { styles, theme: token } = useStyles();
  const user = useUserStore(userProfileSelectors.userProfile);

  if (!user) return null;

  return (
    <Card className={styles.card} variant={'borderless'}>
      <Flexbox align={'center'} gap={16} horizontal justify={'space-between'} wrap={'wrap'}>
        <Flexbox>
          <Title level={4} style={{ color: token.colorText, margin: 0 }}>
            My Phở Credits
          </Title>
          <Typography.Text style={{ color: token.colorTextDescription }}>
            Balance available for AI generation
          </Typography.Text>
        </Flexbox>

        <Flexbox align={'center'} gap={24} horizontal>
          <Statistic
            precision={0}
            suffix=" Credits"
            title={<span style={{ color: token.colorTextDescription }}>Current Balance</span>}
            value={user.phoCreditBalance || 0}
            valueStyle={{
              color: (user.phoCreditBalance || 0) < 0 ? token.colorError : token.colorSuccess,
              fontWeight: 'bold',
            }}
          />
          <Statistic
            precision={0}
            suffix=" Credits"
            title={<span style={{ color: token.colorTextDescription }}>Lifetime Spent</span>}
            value={user.lifetimeSpent || 0}
            valueStyle={{ color: token.colorText }}
          />
        </Flexbox>
      </Flexbox>
    </Card>
  );
});

export default CreditsSection;
