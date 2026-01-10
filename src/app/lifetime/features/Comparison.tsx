'use client';

import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const useStyles = createStyles(({ css, responsive }) => ({
  card: css`
    flex: 1;

    padding: 32px;
    border-radius: 20px;

    text-align: center;

    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
    }
  `,
  cardBad: css`
    border: 1px solid rgba(239, 68, 68, 20%);
    background: rgba(239, 68, 68, 5%);

    &:hover {
      border-color: rgba(239, 68, 68, 40%);
      box-shadow: 0 8px 32px rgba(239, 68, 68, 10%);
    }
  `,
  cardGood: css`
    border: 1px solid rgba(34, 197, 94, 30%);
    background: rgba(34, 197, 94, 8%);

    &:hover {
      border-color: rgba(34, 197, 94, 50%);
      box-shadow: 0 8px 32px rgba(34, 197, 94, 15%);
    }
  `,
  container: css`
    max-width: 900px;
    margin-block: 0;
    margin-inline: auto;
    padding-block: 80px;
    padding-inline: 24px;
  `,
  grid: css`
    display: flex;
    gap: 24px;

    ${responsive.mobile} {
      flex-direction: column;
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
  iconBad: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 56px;
    height: 56px;
    margin-block-end: 20px;
    margin-inline: auto;
    border-radius: 50%;

    background: rgba(239, 68, 68, 15%);
  `,
  iconGood: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 56px;
    height: 56px;
    margin-block-end: 20px;
    margin-inline: auto;
    border-radius: 50%;

    background: rgba(34, 197, 94, 15%);
  `,
  label: css`
    margin-block-end: 8px;

    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 50%);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  `,
  priceBad: css`
    font-size: 42px;
    font-weight: 800;
    color: #ef4444;
    text-decoration: line-through;
    text-decoration-thickness: 3px;
  `,
  priceGood: css`
    font-size: 42px;
    font-weight: 800;
    color: #22c55e;
  `,
  subtitle: css`
    margin-block-start: 8px;
    font-size: 14px;
    color: rgba(255, 255, 255, 40%);
  `,
  vs: css`
    display: flex;
    align-items: center;
    justify-content: center;

    font-size: 18px;
    font-weight: 700;
    color: rgba(255, 255, 255, 30%);

    ${responsive.mobile} {
      padding-block: 8px;
    }
  `,
}));

const Comparison = () => {
  const { styles, cx } = useStyles();

  return (
    <section className={styles.container}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h2>Stop Paying Monthly. Start Owning.</h2>
        <p>See how much you save with a one-time payment</p>
      </motion.div>

      <div className={styles.grid}>
        <motion.div
          className={cx(styles.card, styles.cardBad)}
          initial={{ opacity: 0, x: -20 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <div className={styles.iconBad}>
            <X color="#ef4444" size={28} />
          </div>
          <div className={styles.label}>Typical AI Subscriptions</div>
          <div className={styles.priceBad}>$240</div>
          <div className={styles.subtitle}>per year, every year</div>
        </motion.div>

        <div className={styles.vs}>VS</div>

        <motion.div
          className={cx(styles.card, styles.cardGood)}
          initial={{ opacity: 0, x: 20 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, x: 0 }}
        >
          <div className={styles.iconGood}>
            <Check color="#22c55e" size={28} />
          </div>
          <div className={styles.label}>Pho.chat Lifetime</div>
          <div className={styles.priceGood}>$149</div>
          <div className={styles.subtitle}>one-time, own forever</div>
        </motion.div>
      </div>
    </section>
  );
};

export default Comparison;
