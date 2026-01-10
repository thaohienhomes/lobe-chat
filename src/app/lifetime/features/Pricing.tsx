'use client';

import { Button } from 'antd';
import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';

const useStyles = createStyles(({ css, responsive }) => ({
  badge: css`
    position: absolute;
    inset-block-start: -12px;
    inset-inline-start: 50%;
    transform: translateX(-50%);

    padding-block: 4px;
    padding-inline: 12px;
    border-radius: 999px;

    font-size: 12px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.05em;

    background: #7877c6;
  `,
  button: css`
    width: 100%;
    height: 48px;
    font-weight: 600;
  `,
  card: css`
    position: relative;

    display: flex;
    flex-direction: column;

    padding: 32px;
    border: 1px solid rgba(255, 255, 255, 8%);
    border-radius: 24px;

    background: rgba(255, 255, 255, 3%);

    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 20%);
    }
  `,
  featureItem: css`
    display: flex;
    gap: 12px;
    align-items: center;

    margin-block-end: 16px;

    font-size: 15px;
    color: rgba(255, 255, 255, 80%);

    svg {
      min-width: 18px;
      color: #fff;
    }
  `,
  features: css`
    flex-grow: 1;
    margin-block: 32px;
    margin-inline: 0;
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;

    ${responsive.mobile} {
      grid-template-columns: 1fr;
      gap: 24px;
    }
  `,
  header: css`
    margin-block-end: 24px;
  `,
  limitedBadge: css`
    background: #ff4d4f;
  `,
  originalPrice: css`
    display: block;

    margin-block-start: 4px;

    font-size: 16px;
    color: rgba(255, 255, 255, 50%);
    text-decoration: line-through;

    opacity: 0.7;
  `,
  popularCard: css`
    border-color: rgba(120, 119, 198, 30%);
    background: rgba(255, 255, 255, 5%);
    box-shadow: 0 0 40px rgba(120, 119, 198, 10%);

    &:hover {
      border-color: rgba(120, 119, 198, 50%);
    }
  `,
  price: css`
    font-size: 48px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;

    span {
      margin-inline-start: 4px;
      font-size: 18px;
      font-weight: 500;
      color: rgba(255, 255, 255, 60%);
    }
  `,
  progressBar: css`
    overflow: hidden;

    height: 6px;
    margin-block-end: 8px;
    border-radius: 999px;

    background: rgba(255, 255, 255, 10%);
  `,
  progressBarContainer: css`
    margin-block: 24px;
    margin-inline: 0;
  `,
  progressFill: css`
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #7877c6, #bcacf7);
    animation: pulse 2s infinite;

    @keyframes pulse {
      0% {
        opacity: 1;
      }

      50% {
        opacity: 0.7;
      }

      100% {
        opacity: 1;
      }
    }
  `,
  scarcityText: css`
    display: flex;
    justify-content: space-between;

    font-size: 12px;
    font-weight: 500;
    color: rgba(255, 255, 255, 60%);

    strong {
      color: #7877c6;
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
    margin-block: 0 8px;
    margin-inline: 0;

    font-size: 20px;
    font-weight: 600;
    color: rgba(255, 255, 255, 80%);
  `,
}));

const Pricing = () => {
  const { styles, cx } = useStyles();

  return (
    <section className={styles.section} id="pricing">
      <div className={styles.grid}>
        {/* Early Bird */}
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.1 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className={cx(styles.badge, styles.limitedBadge)}>Limited</div>
          <div className={styles.header}>
            <h3 className={styles.title}>Early Bird</h3>
            <div className={styles.price}>
              $89<span>/ one-time</span>
            </div>
          </div>

          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ background: '#ff4d4f', width: '40%' }}
              />
            </div>
            <div className={styles.scarcityText}>
              <span>12/30 claimed</span>
              <strong style={{ color: '#ff4d4f' }}>Selling Fast</strong>
            </div>
          </div>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <Check size={18} /> Lifetime Updates
            </div>
            <div className={styles.featureItem}>
              <Check size={18} /> 2 Device Synced
            </div>
            <div className={styles.featureItem}>
              <Check size={18} /> Priority Support
            </div>
          </div>

          <Button
            className={styles.button}
            href="https://buy.polar.sh/polar_cl_U5LLNacuWmn6wASqcabNRTSHvzfJlGAzPG5Hq0v1OoC"
            size="large"
            type="primary"
          >
            Claim Early Bird
          </Button>
        </motion.div>

        {/* Standard */}
        <motion.div
          className={cx(styles.card, styles.popularCard)}
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className={styles.badge}>Most Popular</div>
          <div className={styles.header}>
            <h3 className={styles.title}>Standard</h3>
            <div className={styles.price}>
              $119<span>/ one-time</span>
            </div>
            <span className={styles.originalPrice}>$199</span>
          </div>

          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '75%' }} />
            </div>
            <div className={styles.scarcityText}>
              <span>38/50 claimed</span>
              <strong>High Demand</strong>
            </div>
          </div>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <Star size={18} /> <strong>Everything in Early Bird</strong>
            </div>
            <div className={styles.featureItem}>
              <Check size={18} /> Unlimited Devices
            </div>
            <div className={styles.featureItem}>
              <Check size={18} /> Early Access Features
            </div>
            <div className={styles.featureItem}>
              <Check size={18} /> VIP Community Access
            </div>
          </div>

          <Button
            className={styles.button}
            href="https://buy.polar.sh/polar_cl_U5LLNacuWmn6wASqcabNRTSHvzfJlGAzPG5Hq0v1OoC"
            size="large"
            style={{ background: '#fff', color: '#000' }}
            type="primary"
          >
            Get Standard
          </Button>
        </motion.div>

        {/* Last Call */}
        <motion.div
          className={styles.card}
          initial={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className={styles.header}>
            <h3 className={styles.title}>Last Call</h3>
            <div className={styles.price}>
              $149.99<span>/ one-time</span>
            </div>
          </div>

          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ background: '#faad14', width: '90%' }}
              />
            </div>
            <div className={styles.scarcityText}>
              <span>Final Remaining Slots</span>
              <strong style={{ color: '#faad14' }}>Ending Soon</strong>
            </div>
          </div>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <Check size={18} /> All Standard Features
            </div>
            <div className={styles.featureItem}>
              <Check size={18} /> Priority Onboarding
            </div>
            <div className={styles.featureItem}>
              <Check size={18} /> Found Badge Profile
            </div>
          </div>

          <Button
            className={styles.button}
            href="https://buy.polar.sh/polar_cl_U5LLNacuWmn6wASqcabNRTSHvzfJlGAzPG5Hq0v1OoC"
            size="large"
          >
            Buy Now
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
