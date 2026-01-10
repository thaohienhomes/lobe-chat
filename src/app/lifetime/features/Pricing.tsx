'use client';

import { Button } from 'antd';
import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { Check, Crown, Star, Zap } from 'lucide-react';

// Tier configuration - set soldOut to true to mark a tier as sold out
const TIER_CONFIG = {
  earlyBird: {
    claimed: 24,
    price: 89,
    soldOut: false,
    total: 30,
  },
  lastCall: {
    price: 149.99,
    soldOut: false,
  },
  standard: {
    claimed: 38,
    price: 119,
    soldOut: false,
    total: 50,
  },
};

const POLAR_CHECKOUT_URL =
  'https://buy.polar.sh/polar_cl_U5LLNacuWmn6wASqcabNRTSHvzfJlGAzPG5Hq0v1OoC';

const useStyles = createStyles(({ css, responsive }) => ({
  badge: css`
    position: absolute;
    inset-block-start: -14px;
    inset-inline-start: 50%;
    transform: translateX(-50%);

    padding-block: 6px;
    padding-inline: 16px;
    border-radius: 999px;

    font-size: 12px;
    font-weight: 600;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;

    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  `,
  bestValueBadge: css`
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    box-shadow: 0 4px 16px rgba(245, 158, 11, 30%);
  `,
  button: css`
    width: 100%;
    height: 52px;
    border: none;
    border-radius: 12px;

    font-size: 16px;
    font-weight: 600;

    transition: all 0.3s ease;
  `,
  buttonHighlight: css`
    color: #000;
    background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    box-shadow: 0 4px 20px rgba(245, 158, 11, 30%);

    &:hover {
      transform: translateY(-2px);
      color: #000;
      background: linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%);
      box-shadow: 0 6px 24px rgba(245, 158, 11, 40%);
    }
  `,
  buttonPrimary: css`
    color: #fff;
    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
    box-shadow: 0 4px 20px rgba(124, 58, 237, 25%);

    &:hover {
      transform: translateY(-2px);
      color: #fff;
      background: linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%);
      box-shadow: 0 6px 24px rgba(124, 58, 237, 35%);
    }
  `,
  buttonSecondary: css`
    border: 1px solid rgba(255, 255, 255, 15%);
    color: #fff;
    background: rgba(255, 255, 255, 10%);

    &:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 25%);
      background: rgba(255, 255, 255, 15%);
    }
  `,
  card: css`
    position: relative;

    display: flex;
    flex-direction: column;

    padding-block: 36px;
    padding-inline: 28px;
    border: 1px solid rgba(255, 255, 255, 8%);
    border-radius: 24px;

    background: #141414;

    transition: all 0.4s ease;

    &:hover {
      transform: translateY(-8px);
      border-color: rgba(255, 255, 255, 15%);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 50%);
    }
  `,
  cardHighlight: css`
    border-color: rgba(245, 158, 11, 30%);
    background: linear-gradient(180deg, #1a1a1a 0%, #141414 100%);
    box-shadow:
      0 0 0 1px rgba(245, 158, 11, 15%),
      0 8px 40px rgba(245, 158, 11, 8%);

    &:hover {
      border-color: rgba(245, 158, 11, 50%);
      box-shadow:
        0 0 0 1px rgba(245, 158, 11, 30%),
        0 24px 64px rgba(245, 158, 11, 15%);
    }
  `,
  featureItem: css`
    display: flex;
    gap: 12px;
    align-items: center;

    margin-block-end: 14px;

    font-size: 15px;
    color: rgba(255, 255, 255, 75%);

    svg {
      min-width: 18px;
      color: #22c55e;
    }
  `,
  features: css`
    flex-grow: 1;
    margin-block: 28px;
    margin-inline: 0;
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;

    ${responsive.mobile} {
      grid-template-columns: 1fr;
      gap: 32px;
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
  limitedBadge: css`
    background: #ef4444;
  `,
  originalPrice: css`
    display: inline;

    margin-inline-start: 8px;

    font-size: 16px;
    color: rgba(255, 255, 255, 40%);
    text-decoration: line-through;
  `,
  price: css`
    font-size: 52px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
  `,
  priceLabel: css`
    display: block;

    margin-block-start: 4px;

    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 45%);
  `,
  progressBar: css`
    overflow: hidden;

    height: 6px;
    margin-block-end: 8px;
    border-radius: 999px;

    background: rgba(255, 255, 255, 8%);
  `,
  progressBarContainer: css`
    margin-block: 20px;
    margin-inline: 0;
  `,
  progressFill: css`
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #7c3aed, #a855f7);
    animation: pulse 2s infinite;

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }

      50% {
        opacity: 0.6;
      }
    }
  `,
  scarcityText: css`
    display: flex;
    justify-content: space-between;

    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 55%);

    strong {
      color: #a855f7;
    }
  `,
  section: css`
    max-width: 1100px;
    margin-block: 0;
    margin-inline: auto;
    padding-block: 80px;
    padding-inline: 24px;
  `,
  soldOutCard: css`
    pointer-events: none;
    opacity: 0.5;
    filter: grayscale(100%);

    &:hover {
      transform: none;
    }
  `,
  soldOutOverlay: css`
    position: absolute;
    z-index: 10;
    inset: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 24px;

    background: rgba(0, 0, 0, 60%);
  `,
  soldOutText: css`
    transform: rotate(-12deg);

    padding-block: 12px;
    padding-inline: 32px;
    border: 2px solid #ef4444;
    border-radius: 8px;

    font-size: 24px;
    font-weight: 800;
    color: #ef4444;
    letter-spacing: 0.1em;

    background: rgba(0, 0, 0, 80%);
  `,
  tierIcon: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 48px;
    height: 48px;
    margin-block-end: 16px;
    border-radius: 12px;

    background: rgba(255, 255, 255, 5%);
  `,
  title: css`
    margin-block: 0 4px;
    margin-inline: 0;

    font-size: 22px;
    font-weight: 700;
    color: #fff;
  `,
}));

const Pricing = () => {
  const { styles, cx } = useStyles();

  return (
    <section className={styles.section} id="pricing">
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h2>Choose Your Plan</h2>
        <p>One payment. Lifetime access. No strings attached.</p>
      </motion.div>

      <div className={styles.grid}>
        {/* Early Bird */}
        <motion.div
          className={cx(styles.card, TIER_CONFIG.earlyBird.soldOut && styles.soldOutCard)}
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {TIER_CONFIG.earlyBird.soldOut && (
            <div className={styles.soldOutOverlay}>
              <span className={styles.soldOutText}>SOLD OUT</span>
            </div>
          )}
          <div className={cx(styles.badge, styles.limitedBadge)}>Limited Slots</div>

          <div className={styles.tierIcon}>
            <Zap color="#a855f7" size={24} />
          </div>

          <h3 className={styles.title}>Early Bird</h3>

          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  background: 'linear-gradient(90deg, #ef4444, #f87171)',
                  width: `${(TIER_CONFIG.earlyBird.claimed / TIER_CONFIG.earlyBird.total) * 100}%`,
                }}
              />
            </div>
            <div className={styles.scarcityText}>
              <span>{TIER_CONFIG.earlyBird.total - TIER_CONFIG.earlyBird.claimed} slots left</span>
              <strong style={{ color: '#ef4444' }}>Selling Fast</strong>
            </div>
          </div>

          <div className={styles.price}>
            ${TIER_CONFIG.earlyBird.price}
            <span className={styles.priceLabel}>one-time payment</span>
          </div>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <Check size={18} /> Lifetime Updates
            </div>
            <div className={styles.featureItem}>
              <Check size={18} /> 2 Devices Synced
            </div>
            <div className={styles.featureItem}>
              <Check size={18} /> Priority Support
            </div>
          </div>

          <Button
            className={cx(styles.button, styles.buttonSecondary)}
            disabled={TIER_CONFIG.earlyBird.soldOut}
            href={`${POLAR_CHECKOUT_URL}?amount=${TIER_CONFIG.earlyBird.price}`}
          >
            {TIER_CONFIG.earlyBird.soldOut ? 'Sold Out' : 'Get Early Bird'}
          </Button>
        </motion.div>

        {/* Standard - Best Value */}
        <motion.div
          className={cx(
            styles.card,
            styles.cardHighlight,
            TIER_CONFIG.standard.soldOut && styles.soldOutCard,
          )}
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {TIER_CONFIG.standard.soldOut && (
            <div className={styles.soldOutOverlay}>
              <span className={styles.soldOutText}>SOLD OUT</span>
            </div>
          )}
          <div className={cx(styles.badge, styles.bestValueBadge)}>⭐ Best Value</div>

          <div className={styles.tierIcon} style={{ background: 'rgba(245, 158, 11, 15%)' }}>
            <Crown color="#f59e0b" size={24} />
          </div>

          <h3 className={styles.title}>Standard</h3>

          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  width: `${(TIER_CONFIG.standard.claimed / TIER_CONFIG.standard.total) * 100}%`,
                }}
              />
            </div>
            <div className={styles.scarcityText}>
              <span>{TIER_CONFIG.standard.total - TIER_CONFIG.standard.claimed} slots left</span>
              <strong style={{ color: '#f59e0b' }}>High Demand</strong>
            </div>
          </div>

          <div className={styles.price}>
            ${TIER_CONFIG.standard.price}
            <span className={styles.originalPrice}>$199</span>
            <span className={styles.priceLabel}>one-time payment</span>
          </div>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <Star color="#f59e0b" size={18} /> <strong>Everything in Early Bird</strong>
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
            className={cx(styles.button, styles.buttonHighlight)}
            disabled={TIER_CONFIG.standard.soldOut}
            href={`${POLAR_CHECKOUT_URL}?amount=${TIER_CONFIG.standard.price}`}
          >
            {TIER_CONFIG.standard.soldOut ? 'Sold Out' : 'Get Best Value'}
          </Button>
        </motion.div>

        {/* Last Call */}
        <motion.div
          className={cx(styles.card, TIER_CONFIG.lastCall.soldOut && styles.soldOutCard)}
          initial={{ opacity: 0, y: 30 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          viewport={{ once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          {TIER_CONFIG.lastCall.soldOut && (
            <div className={styles.soldOutOverlay}>
              <span className={styles.soldOutText}>SOLD OUT</span>
            </div>
          )}

          <div className={styles.tierIcon}>
            <Star color="#a855f7" size={24} />
          </div>

          <h3 className={styles.title}>Last Call</h3>

          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  width: '90%',
                }}
              />
            </div>
            <div className={styles.scarcityText}>
              <span>Final slots remaining</span>
              <strong style={{ color: '#f59e0b' }}>Ending Soon</strong>
            </div>
          </div>

          <div className={styles.price}>
            ${TIER_CONFIG.lastCall.price}
            <span className={styles.priceLabel}>one-time payment</span>
          </div>

          <div className={styles.features}>
            <div className={styles.featureItem}>
              <Check size={18} /> All Standard Features
            </div>
            <div className={styles.featureItem}>
              <Check size={18} /> Priority Onboarding
            </div>
            <div className={styles.featureItem}>
              <Check size={18} /> Founder Badge Profile
            </div>
          </div>

          <Button
            className={cx(styles.button, styles.buttonPrimary)}
            disabled={TIER_CONFIG.lastCall.soldOut}
            href={`${POLAR_CHECKOUT_URL}?amount=${TIER_CONFIG.lastCall.price}`}
          >
            {TIER_CONFIG.lastCall.soldOut ? 'Sold Out' : 'Buy Now'}
          </Button>
        </motion.div>
      </div>

      {/* Trust Badges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        style={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          marginBlockStart: 48,
        }}
        transition={{ delay: 0.4, duration: 0.6 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        {/* Payment Logos */}
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 24,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              fontSize: 28,
              fontWeight: 700,
              gap: 8,
              letterSpacing: '-0.02em',
              opacity: 0.6,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '0.05em' }}>STRIPE</span>
          </div>
          <div
            style={{
              alignItems: 'center',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              fontSize: 14,
              fontWeight: 600,
              gap: 4,
              opacity: 0.6,
            }}
          >
            <span>VISA</span>
          </div>
          <div
            style={{
              alignItems: 'center',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              fontSize: 14,
              fontWeight: 600,
              opacity: 0.6,
            }}
          >
            <span>Mastercard</span>
          </div>
        </div>

        {/* SSL Security */}
        <div
          style={{
            alignItems: 'center',
            color: 'rgba(255,255,255,0.5)',
            display: 'flex',
            fontSize: 13,
            gap: 8,
          }}
        >
          <svg
            fill="none"
            height="16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="16"
          >
            <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>Secure SSL Encrypted Payment via Polar.sh</span>
        </div>

        {/* 14-Day Guarantee Badge */}
        <div
          style={{
            alignItems: 'center',
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: 12,
            display: 'flex',
            gap: 10,
            padding: '12px 20px',
          }}
        >
          <svg
            fill="none"
            height="20"
            stroke="#22c55e"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="20"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span style={{ color: '#22c55e', fontSize: 14, fontWeight: 600 }}>
            14-Day Money-Back Guarantee
          </span>
        </div>
      </motion.div>
    </section>
  );
};

export default Pricing;
