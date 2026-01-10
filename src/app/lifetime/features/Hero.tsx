'use client';

import { Button } from 'antd';
import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { ChevronRight, Sparkles } from 'lucide-react';

import LogoLoop from './LogoLoop';

const POLAR_CHECKOUT_URL =
  'https://buy.polar.sh/polar_cl_U5LLNacuWmn6wASqcabNRTSHvzfJlGAzPG5Hq0v1OoC';

const useStyles = createStyles(({ css, responsive }) => ({
  badge: css`
    display: inline-flex;
    gap: 8px;
    align-items: center;

    margin-block-end: 32px;
    padding-block: 8px;
    padding-inline: 20px;
    border: 1px solid rgba(124, 58, 237, 30%);
    border-radius: 999px;

    font-size: 14px;
    font-weight: 500;
    color: #a855f7;

    background: rgba(124, 58, 237, 10%);
    backdrop-filter: blur(10px);
  `,
  container: css`
    position: relative;

    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding-block: 140px 100px;
    padding-inline: 24px;

    text-align: center;

    &::before {
      pointer-events: none;
      content: '';

      position: absolute;
      z-index: 0;
      inset-block-start: -200px;
      inset-inline-start: 50%;
      transform: translateX(-50%);

      width: 800px;
      height: 800px;

      background: radial-gradient(
        circle,
        rgba(124, 58, 237, 25%) 0%,
        rgba(168, 85, 247, 15%) 30%,
        rgba(0, 0, 0, 0%) 70%
      );
      filter: blur(100px);
    }

    ${responsive.mobile} {
      padding-block: 100px 80px;
      padding-inline: 20px;
    }
  `,
  ctaButton: css`
    z-index: 1;

    display: inline-flex;
    gap: 10px;
    align-items: center;

    height: 60px;
    padding-block: 0;
    padding-inline: 36px;
    border: none;
    border-radius: 16px;

    font-size: 18px;
    font-weight: 600;
    color: #fff;

    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    box-shadow:
      0 0 0 1px rgba(124, 58, 237, 50%),
      0 4px 24px rgba(124, 58, 237, 40%);

    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      color: #fff;
      background: linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%);
      box-shadow:
        0 0 0 1px rgba(168, 85, 247, 60%),
        0 8px 32px rgba(124, 58, 237, 50%);
    }
  `,
  highlight: css`
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%);
    background-clip: text;

    -webkit-text-fill-color: transparent;
  `,
  secondaryCta: css`
    z-index: 1;

    display: inline-flex;
    gap: 8px;
    align-items: center;

    height: 60px;
    margin-inline-start: 16px;
    padding-block: 0;
    padding-inline: 24px;
    border: 1px solid rgba(255, 255, 255, 15%);
    border-radius: 16px;

    font-size: 16px;
    font-weight: 500;
    color: rgba(255, 255, 255, 80%);

    background: transparent;

    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(255, 255, 255, 30%);
      color: #fff;
      background: rgba(255, 255, 255, 5%);
    }

    ${responsive.mobile} {
      margin-block-start: 12px;
      margin-inline-start: 0;
    }
  `,
  subtitle: css`
    z-index: 1;

    max-width: 640px;
    margin-block: 0 48px;
    margin-inline: 0;

    font-size: 20px;
    font-weight: 400;
    line-height: 1.7;
    color: rgba(255, 255, 255, 60%);

    ${responsive.mobile} {
      font-size: 18px;
    }
  `,
  title: css`
    z-index: 1;

    max-width: 900px;
    margin-block: 0 28px;
    margin-inline: 0;

    font-size: 68px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.03em;

    background: linear-gradient(180deg, #fff 0%, #fff 50%, rgba(255, 255, 255, 55%) 100%);
    background-clip: text;

    -webkit-text-fill-color: transparent;

    ${responsive.mobile} {
      font-size: 40px;
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
        transition={{ duration: 0.6 }}
      >
        <Sparkles size={16} />
        <span>Limited Time Offer • Save $240+/year</span>
      </motion.div>

      <motion.h1
        animate={{ opacity: 1, y: 0 }}
        className={styles.title}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        The Last AI Subscription
        <br />
        You&apos;ll <span className={styles.highlight}>Ever</span> Pay For
      </motion.h1>

      <motion.p
        animate={{ opacity: 1, y: 0 }}
        className={styles.subtitle}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        Pay once, own forever. Get lifetime access to GPT-4, Claude, Gemini and more.
        <br />
        No monthly fees. No hidden costs. Just powerful AI at your fingertips.
      </motion.p>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <Button className={styles.ctaButton} href={POLAR_CHECKOUT_URL}>
          Get Lifetime Access
          <ChevronRight size={20} />
        </Button>
        <Button className={styles.secondaryCta} href="#pricing">
          View Plans
        </Button>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 20 }}
        style={{ width: '100%' }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <LogoLoop />
      </motion.div>
    </div>
  );
};

export default Hero;
