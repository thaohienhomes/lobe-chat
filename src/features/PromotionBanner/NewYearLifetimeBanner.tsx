'use client';

import dynamic from 'next/dynamic';
import { memo, useEffect, useState } from 'react';
import { createStyles } from 'antd-style';
import Link from 'next/link';
import { useUserStore } from '@/store/user';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Lazy-load Lottie to keep ~250KB off the critical path
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  closeButton: css`
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorder};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${token.colorTextSecondary};
    opacity: 0;
    transition: opacity 0.2s;
    
    &:hover {
      color: ${token.colorError};
      background: ${token.colorErrorBg};
    }
  `,
  container: css`
    position: fixed;
    bottom: 24px;
    left: 24px;
    z-index: 1000;
    pointer-events: auto;
    
    background: ${isDarkMode ? 'rgba(30, 30, 30, 0.75)' : 'rgba(255, 255, 255, 0.75)'};
    backdrop-filter: blur(12px);
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 20px;
    padding: 8px 16px 8px 8px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    
    display: flex;
    align-items: center;
    gap: 8px;
    
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    
    &:hover {
      background: ${isDarkMode ? 'rgba(40, 40, 40, 0.85)' : 'rgba(255, 255, 255, 0.85)'};
      border-color: ${token.colorPrimary};
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
    }
  `,
  desc: css`
    font-size: 16px;
    font-weight: 700;
    color: ${token.colorText};
    line-height: 1.2;
    white-space: nowrap;
  `,
  lottie: css`
    width: 70px;
    height: 70px;
    flex: none;
  `,
  textContainer: css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
  `,
  title: css`
    font-size: 14px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: linear-gradient(135deg, #ff4d4f 0%, #ff7a45 50%, #ffa940 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.2;
  `,
  wrapper: css`
    &:hover .close-btn {
      opacity: 1;
    }
  `
}));

const NewYearLifetimeBanner = memo(() => {
  const { styles } = useStyles();
  const subscriptionPlan = useUserStore((s) => s.subscriptionPlan);
  const [animationData, setAnimationData] = useState<any>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Gift Box Lottie Animation
    const lottieUrl = '/animations/gift-box.json';
    fetch(lottieUrl)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Failed to load Lottie', err));
  }, []);

  // Hide banner for ALL paid users (anyone not on free tier)
  const FREE_PLANS = ['vn_free', 'gl_starter', ''];
  const isPaidUser = subscriptionPlan && !FREE_PLANS.includes(subscriptionPlan);

  if (isPaidUser || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        animate={{ opacity: 1, rotate: 0, scale: 1, x: 0 }}
        className={styles.wrapper}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        initial={{ opacity: 0, rotate: -10, scale: 0.5, x: -100 }}
        style={{ bottom: 24, left: 24, position: 'fixed', zIndex: 1001 }}
      >
        <div
          className={`${styles.closeButton} close-btn`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setVisible(false);
          }}
        >
          <X size={12} strokeWidth={3} />
        </div>

        <Link href="/lifetime" style={{ textDecoration: 'none' }}>
          <motion.div
            className={styles.container}
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.96 }}
          >
            <div className={styles.lottie}>
              {animationData ? (
                <Lottie
                  animationData={animationData}
                  autoplay={true}
                  loop={true}
                />
              ) : (
                <div style={{ alignItems: 'center', display: 'flex', height: 70, justifyContent: 'center', width: 70 }}>
                  🎉
                </div>
              )}
            </div>
            <div className={styles.textContainer}>
              <span className={styles.title}>New Year 2026</span>
              <span className={styles.desc}>Lifetime Offer</span>
            </div>
          </motion.div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
});

export default NewYearLifetimeBanner;
