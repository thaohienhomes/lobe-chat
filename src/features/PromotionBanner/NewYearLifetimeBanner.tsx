'use client';

import { createStyles, keyframes } from 'antd-style';
import { X } from 'lucide-react';
import Link from 'next/link';
import { memo, useEffect, useState } from 'react';

import { useUserStore } from '@/store/user';

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const useStyles = createStyles(({ css, token, isDarkMode, responsive }) => ({
  badge: css`
    padding: 2px 6px;

    font-size: 10px;
    font-weight: 700;
    line-height: 1.3;
    color: #fff;
    letter-spacing: 0.3px;
    text-transform: uppercase;

    background: linear-gradient(135deg, #ff4d4f, #ff7a45);
    border-radius: 6px;

    animation: ${pulse} 2s ease-in-out infinite;
  `,

  closeBtn: css`
    cursor: pointer;

    position: absolute;
    top: -6px;
    right: -6px;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 18px;
    height: 18px;

    color: ${token.colorTextQuaternary};

    background: ${isDarkMode ? 'rgba(50,50,50,0.9)' : 'rgba(240,240,240,0.9)'};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 50%;

    opacity: 0;
    transition: all 0.2s;

    &:hover {
      color: ${token.colorError};
      background: ${token.colorErrorBg};
    }
  `,

  container: css`
    cursor: pointer;

    position: relative;

    display: flex;
    gap: 8px;
    align-items: center;

    padding: 6px 14px 6px 10px;

    background: ${isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)'};
    backdrop-filter: blur(16px);
    border: 1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'};
    border-radius: 16px;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, ${isDarkMode ? 0.25 : 0.08}),
      inset 0 1px 0 rgba(255, 255, 255, ${isDarkMode ? 0.04 : 0.5});

    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      border-color: rgba(255, 100, 50, 0.3);
      box-shadow:
        0 6px 24px rgba(255, 100, 50, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, ${isDarkMode ? 0.06 : 0.6});
      transform: translateY(-2px);

      .close-lifetime {
        opacity: 1;
      }
    }

    &:active {
      transform: scale(0.97);
    }

    ${responsive.mobile} {
      padding: 5px 12px 5px 8px;
    }
  `,

  emoji: css`
    font-size: 20px;
    line-height: 1;
  `,

  price: css`
    font-size: 13px;
    font-weight: 700;
    color: ${token.colorText};
    white-space: nowrap;

    background: linear-gradient(90deg, #ff4d4f, #ff7a45, #ffa940, #ff4d4f);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    animation: ${shimmer} 3s linear infinite;

    ${responsive.mobile} {
      font-size: 12px;
    }
  `,

  subtitle: css`
    font-size: 11px;
    color: ${token.colorTextTertiary};
    white-space: nowrap;

    ${responsive.mobile} {
      display: none;
    }
  `,

  textWrap: css`
    display: flex;
    gap: 6px;
    align-items: center;

    min-width: 0;
  `,

  wrapper: css`
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 1000;

    ${responsive.mobile} {
      bottom: 76px;
      left: 12px;
    }
  `,
}));

const DISMISS_KEY = 'pho-lifetime-banner-dismissed';

const NewYearLifetimeBanner = memo(() => {
  const { styles } = useStyles();
  const subscriptionPlan = useUserStore((s) => s.subscriptionPlan);
  const [visible, setVisible] = useState(false);

  // Only show after mount (avoid SSR flash)
  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  // Hide for ALL paid users
  const FREE_PLANS = new Set(['vn_free', 'gl_starter', '']);
  const isPaidUser = subscriptionPlan && !FREE_PLANS.has(subscriptionPlan);

  if (isPaidUser || !visible) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <div className={styles.wrapper}>
      <Link href="/lifetime" style={{ textDecoration: 'none' }}>
        <div className={styles.container}>
          {/* Close */}
          <div className={`${styles.closeBtn} close-lifetime`} onClick={handleDismiss}>
            <X size={10} strokeWidth={3} />
          </div>

          {/* Icon */}
          <span className={styles.emoji}>🎁</span>

          {/* Text */}
          <div className={styles.textWrap}>
            <span className={styles.badge}>SALE</span>
            <span className={styles.price}>Lifetime — 499K</span>
            <span className={styles.subtitle}>Dùng mãi mãi</span>
          </div>
        </div>
      </Link>
    </div>
  );
});

export default NewYearLifetimeBanner;
