'use client';

import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { Layers, RefreshCw, Shield, Zap } from 'lucide-react';

const useStyles = createStyles(({ css, responsive }) => ({
  description: css`
    font-size: 14px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 55%);
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;

    ${responsive.mobile} {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
  `,
  header: css`
    margin-block-end: 48px;
    text-align: center;

    h2 {
      margin: 0;
      font-size: 36px;
      font-weight: 700;
      color: #fff;
    }

    p {
      margin-block: 12px 0;
      margin-inline: 0;
      font-size: 18px;
      color: rgba(255, 255, 255, 50%);
    }
  `,
  iconWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 48px;
    height: 48px;
    margin-block-end: 16px;
    border-radius: 12px;

    background: rgba(124, 58, 237, 12%);

    svg {
      width: 22px;
      height: 22px;
      color: #a855f7;
    }
  `,
  item: css`
    display: flex;
    flex-direction: column;
    align-items: center;

    padding-block: 28px;
    padding-inline: 20px;
    border: 1px solid rgba(255, 255, 255, 6%);
    border-radius: 20px;

    text-align: center;

    background: #141414;

    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      border-color: rgba(124, 58, 237, 25%);
      box-shadow: 0 12px 40px rgba(124, 58, 237, 8%);
    }
  `,
  section: css`
    max-width: 1000px;
    margin-block: 0;
    margin-inline: auto;
    padding-block: 80px;
    padding-inline: 24px;
  `,
  title: css`
    margin-block-end: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
  `,
}));

const features = [
  {
    description: 'Lightning fast responses powered by optimized inference.',
    icon: <Zap />,
    title: 'High-speed AI',
  },
  {
    description: 'Switch between GPT-4, Claude, and Gemini instantly.',
    icon: <Layers />,
    title: 'Multi-model',
  },
  {
    description: 'Your data stays yours. Local-first architecture.',
    icon: <Shield />,
    title: 'Privacy-first',
  },
  {
    description: 'Credits reset automatically every month.',
    icon: <RefreshCw />,
    title: 'Monthly Reset',
  },
];

const Features = () => {
  const { styles } = useStyles();

  return (
    <section className={styles.section}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h2>Why Choose Pho.chat?</h2>
        <p>Built for power users who want the best AI experience</p>
      </motion.div>

      <div className={styles.grid}>
        {features.map((feature, index) => (
          <motion.div
            className={styles.item}
            initial={{ opacity: 0, y: 20 }}
            key={index}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className={styles.iconWrapper}>{feature.icon}</div>
            <h3 className={styles.title}>{feature.title}</h3>
            <p className={styles.description}>{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Features;
