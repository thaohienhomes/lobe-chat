'use client';

import { Button } from 'antd';
import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

import LogoLoop from './LogoLoop';

const useStyles = createStyles(({ css, responsive }) => ({
  badge: css`
    display: inline-flex;
    gap: 6px;
    align-items: center;

    margin-block-end: 24px;
    padding-block: 6px;
    padding-inline: 16px;
    border: 1px solid rgba(255, 255, 255, 10%);
    border-radius: 999px;

    font-size: 14px;
    color: rgba(255, 255, 255, 80%);

    background: rgba(255, 255, 255, 5%);
    backdrop-filter: blur(10px);

    span {
      display: flex;
      align-items: center;
      font-weight: 500;
      color: #fff;
    }
  `,
  container: css`
    position: relative;

    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding-block: 120px 80px;
    padding-inline: 24px;

    text-align: center;

    &::before {
      pointer-events: none;
      content: '';

      position: absolute;
      z-index: 0;
      inset-block-start: -100px;
      inset-inline-start: 50%;
      transform: translateX(-50%);

      width: 600px;
      height: 600px;

      background: radial-gradient(circle, rgba(120, 119, 198, 30%) 0%, rgba(0, 0, 0, 0%) 70%);
      filter: blur(80px);
    }

    ${responsive.mobile} {
      padding-block: 80px 60px;
      padding-inline: 20px;
    }
  `,
  ctaButton: css`
    z-index: 1;

    display: inline-flex;
    gap: 8px;
    align-items: center;

    height: 56px;
    padding-block: 0;
    padding-inline: 32px;
    border: none;
    border-radius: 999px;

    font-size: 18px;
    font-weight: 600;
    color: #000;

    background: #fff;

    transition: transform 0.2s;

    &:hover {
      transform: scale(1.05);
      color: #000;
      background: #eee;
    }
  `,
  subtitle: css`
    z-index: 1;

    max-width: 600px;
    margin-block: 0 40px;
    margin-inline: 0;

    font-size: 20px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 65%);

    ${responsive.mobile} {
      font-size: 18px;
    }
  `,
  title: css`
    z-index: 1;

    max-width: 900px;
    margin-block: 0 24px;
    margin-inline: 0;

    font-size: 72px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;

    background: linear-gradient(to bottom, #fff 40%, rgba(255, 255, 255, 50%));
    background-clip: text;

    -webkit-text-fill-color: transparent;

    ${responsive.mobile} {
      font-size: 42px;
    }
  `,
}));

const Hero = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={styles.badge}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <span>Limited Time Offer</span>
        <ChevronRight size={14} />
      </motion.div>

      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className={styles.title}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        Own Pho.chat Forever. Zero Subscriptions.
      </motion.h1>

      <motion.p
        animate={{ opacity: 1, y: 0 }}
        className={styles.subtitle}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Experience the power of advanced AI chat without the burden of monthly fees. Pay once, use
        forever. Secure your spot in the future of communication.
      </motion.p>

      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        initial={{ opacity: 0, scale: 0.9 }}
        style={{ width: '100%' }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Button className={styles.ctaButton} href="#pricing">
            Get Lifetime Access
            <ChevronRight size={18} />
          </Button>
        </div>
        <LogoLoop />
      </motion.div>
    </div>
  );
};

export default Hero;
