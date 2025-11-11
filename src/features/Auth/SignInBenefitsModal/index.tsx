'use client';

import { Button } from '@lobehub/ui';
import { Modal } from 'antd';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { ProductLogo } from '@/components/Branding';
import BrandWatermark from '@/components/BrandWatermark';
import { useUserStore } from '@/store/user';

const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  benefitIcon: css`
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    
    width: 48px;
    height: 48px;
    
    font-size: 24px;
    
    background: ${token.colorBgLayout};
    border-radius: ${token.borderRadius}px;
  `,
  benefitDesc: css`
    margin: 0;
    
    font-size: 14px;
    line-height: 1.6;
    color: ${token.colorTextSecondary};
  `,
  benefitItem: css`
    display: flex;
    gap: 16px;
    align-items: flex-start;
    
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
  `,
  benefitText: css`
    flex: 1;
  `,
  benefitsList: css`
    margin: 0;
    padding: 0;
    list-style: none;
  `,
  benefitTitle: css`
    margin: 0 0 4px;
    
    font-size: 16px;
    font-weight: 500;
    line-height: 1.4;
  `,
  header: css`
    padding: 32px 32px 24px;
    text-align: center;
    border-bottom: 1px solid ${token.colorBorderSecondary};
  `,
  content: css`
    padding: 32px;
  `,
  modal: css`
    .ant-modal-content {
      padding: 0;
      border-radius: ${token.borderRadiusLG}px;
      background: ${isDarkMode ? token.colorBgElevated : token.colorBgContainer};
    }
  `,
  footer: css`
    padding: 24px 32px 32px;
    border-top: 1px solid ${token.colorBorderSecondary};
  `,
  subtitle: css`
    margin: 0;
    
    font-size: 14px;
    line-height: 1.6;
    color: ${token.colorTextSecondary};
  `,
  footerLinks: css`
    display: flex;
    gap: 16px;
    justify-content: center;
    
    margin-top: 16px;
    
    font-size: 12px;
    color: ${token.colorTextSecondary};
    
    a {
      color: ${token.colorTextSecondary};
      text-decoration: none;
      
      &:hover {
        color: ${token.colorText};
      }
    }
  `,
  title: css`
    margin: 16px 0 8px;
    
    font-size: 24px;
    font-weight: 600;
    line-height: 1.3;
  `,
}));

interface SignInBenefitsModalProps {
  onClose: () => void;
  open: boolean;
}

const SignInBenefitsModal = memo<SignInBenefitsModalProps>(({ open, onClose }) => {
  const { styles } = useStyles();
  const { t } = useTranslation('auth');
  const [openLogin] = useUserStore((s) => [s.openLogin]);

  const handleSignIn = () => {
    onClose();
    openLogin();
  };

  const benefits = [
    {
      desc: 'Start chatting with AI assistants for free',
      icon: '🎁',
      title: t('stats.loginGuide.f1'),
    },
    {
      desc: 'Access your conversations from any device',
      icon: '☁️',
      title: t('stats.loginGuide.f2'),
    },
    {
      desc: 'Choose from a wide variety of AI assistants',
      icon: '🤖',
      title: t('stats.loginGuide.f3'),
    },
    {
      desc: 'Enhance your experience with powerful plugins',
      icon: '🔌',
      title: t('stats.loginGuide.f4'),
    },
  ];

  return (
    <Modal
      centered
      className={styles.modal}
      closable={false}
      footer={null}
      onCancel={onClose}
      open={open}
      width={480}
    >
      <div className={styles.header}>
        <ProductLogo size={64} type="combine" />
        <h2 className={styles.title}>After logging in, you can:</h2>
        <p className={styles.subtitle}>Sign in to unlock all features</p>
      </div>

      <div className={styles.content}>
        <ul className={styles.benefitsList}>
          {benefits.map((benefit, index) => (
            <li className={styles.benefitItem} key={index}>
              <div className={styles.benefitIcon}>{benefit.icon}</div>
              <div className={styles.benefitText}>
                <h4 className={styles.benefitTitle}>{benefit.title}</h4>
                <p className={styles.benefitDesc}>{benefit.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.footer}>
        <Flexbox gap={12}>
          <Button block onClick={handleSignIn} size="large" type="primary">
            {t('loginOrSignup')}
          </Button>
          <Button block onClick={onClose} size="large">
            Continue without signing in
          </Button>
        </Flexbox>

        <div className={styles.footerLinks}>
          <BrandWatermark />
        </div>
      </div>
    </Modal>
  );
});

SignInBenefitsModal.displayName = 'SignInBenefitsModal';

export default SignInBenefitsModal;

