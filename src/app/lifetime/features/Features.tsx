'use client';

import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { Layers, RefreshCw, Shield, Zap } from 'lucide-react';

const useStyles = createStyles(({ css, responsive }) => ({
  description: css`
    font-size: 14px;
    line-height: 1.5;
    color: rgba(255, 255, 255, 65%);
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;

    ${responsive.mobile} {
      grid-template-columns: 1fr;
      gap: 32px;
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

    color: #7877c6;

    background: rgba(120, 119, 198, 10%);

    svg {
      width: 24px;
      height: 24px;
    }
  `,
  item: css`
    display: flex;
    flex-direction: column;
    align-items: center;

    padding: 24px;
    border: 1px solid rgba(255, 255, 255, 5%);
    border-radius: 16px;

    text-align: center;

    background: rgba(255, 255, 255, 2%);

    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(255, 255, 255, 10%);
      background: rgba(255, 255, 255, 5%);
    }
  `,
  section: css`
    max-width: 1200px;
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
    description: 'Lightning fast responses powered by optimized inference engines.',
    icon: <Zap />,
    title: 'High-speed AI',
  },
  {
    description: 'Switch between GPT-4o, Claude 3.5, and Gemini Pro instantly.',
    icon: <Layers />,
    title: 'Multi-model Support',
  },
  {
    description: 'Your data stays yours. Local-first architecture with optional sync.',
    icon: <Shield />,
    title: 'Privacy-focused',
  },
  {
    description: 'Fair usage credits reset automatically every billing cycle.',
    icon: <RefreshCw />,
    title: 'Monthly Reset Credits',
  },
];

const Features = () => {
  const { styles } = useStyles();

  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        {features.map((feature, index) => (
          <motion.div
            className={styles.item}
            initial={{ opacity: 0, y: 20 }}
            key={index}
            transition={{ delay: index * 0.1 }}
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
