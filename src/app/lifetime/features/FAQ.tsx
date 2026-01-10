'use client';

import { Collapse } from 'antd';
import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { ChevronDown, Shield } from 'lucide-react';

const useStyles = createStyles(({ css }) => ({
  collapse: css`
    border: none !important;
    background: transparent !important;

    .ant-collapse-item {
      margin-block-end: 0;
      border: none !important;
      border-block-end: 1px solid rgba(255, 255, 255, 6%) !important;

      &:last-child {
        border-block-end: none !important;
      }
    }

    .ant-collapse-header {
      align-items: center !important;

      padding-block: 24px !important;
      padding-inline: 0 !important;

      font-size: 17px !important;
      font-weight: 500 !important;
      color: #fff !important;

      transition: color 0.3s !important;

      &:hover {
        color: #a855f7 !important;
      }
    }

    .ant-collapse-content {
      border-block-start: none !important;
      background: transparent !important;
    }

    .ant-collapse-content-box {
      padding-block: 0 24px !important;
      padding-inline: 0 !important;

      font-size: 15px !important;
      line-height: 1.7 !important;
      color: rgba(255, 255, 255, 60%) !important;
    }
  `,
  container: css`
    max-width: 800px;
    margin-inline: auto;
    padding: 32px;
    border: 1px solid rgba(255, 255, 255, 6%);
    border-radius: 24px;

    background: #141414;
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
  refundBadge: css`
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: center;

    max-width: 500px;
    margin-block: 64px 0;
    margin-inline: auto;
    padding-block: 24px;
    padding-inline: 32px;
    border: 1px solid rgba(34, 197, 94, 25%);
    border-radius: 16px;

    background: rgba(34, 197, 94, 8%);

    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(34, 197, 94, 40%);
      box-shadow: 0 8px 32px rgba(34, 197, 94, 10%);
    }
  `,
  refundIcon: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 48px;
    height: 48px;
    border-radius: 12px;

    background: rgba(34, 197, 94, 15%);
  `,
  refundText: css`
    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #22c55e;
    }

    p {
      margin-block: 4px 0;
      margin-inline: 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 55%);
    }
  `,
  section: css`
    max-width: 900px;
    margin-block: 0;
    margin-inline: auto;
    padding-block: 80px 120px;
    padding-inline: 24px;
  `,
}));

const FAQ = () => {
  const { styles } = useStyles();

  const faqItems = [
    {
      children:
        "It means you pay once and get access to Pho.chat's premium features for as long as the platform is online. No monthly subscriptions, no renewal fees — ever.",
      key: '1',
      label: 'What exactly does "Lifetime" mean?',
    },
    {
      children:
        'Yes. To keep the service fast for everyone and cover API costs, we implement a generous monthly usage cap (Fair Use Policy). Your credits reset automatically each month, and you can track usage in your dashboard.',
      key: '2',
      label: 'Are there any usage limits?',
    },
    {
      children:
        "Yes! You get access to GPT-4, Claude, Gemini, and all our integrated AI models. As we add new models, you'll get access to them too — at no extra cost.",
      key: '3',
      label: 'Does this include GPT-4, Claude, and Gemini?',
    },
    {
      children:
        'Absolutely. We offer a 14-day "No Questions Asked" refund guarantee through Polar.sh. If you\'re not completely satisfied, contact us within 14 days for a full refund.',
      key: '4',
      label: 'What is the refund policy?',
    },
    {
      children:
        'LTD slots are limited by quantity. You can upgrade to a higher tier only if slots are still available. Once sold out, tiers close permanently.',
      key: '5',
      label: 'Can I upgrade my tier later?',
    },
  ];

  return (
    <section className={styles.section}>
      <motion.div
        className={styles.header}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <h2>Frequently Asked Questions</h2>
        <p>Everything you need to know about the Lifetime Deal</p>
      </motion.div>

      <motion.div
        className={styles.container}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.1, duration: 0.6 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <Collapse
          accordion
          className={styles.collapse}
          expandIcon={({ isActive }) => (
            <ChevronDown
              color={isActive ? '#a855f7' : 'rgba(255,255,255,0.4)'}
              size={20}
              style={{
                transform: isActive ? 'rotate(180deg)' : 'none',
                transition: 'all 0.3s',
              }}
            />
          )}
          expandIconPosition="end"
          items={faqItems}
        />
      </motion.div>

      {/* 14-Day Refund Badge */}
      <motion.div
        className={styles.refundBadge}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div className={styles.refundIcon}>
          <Shield color="#22c55e" size={24} />
        </div>
        <div className={styles.refundText}>
          <h4>14-Day Money-Back Guarantee</h4>
          <p>Not satisfied? Get a full refund within 14 days. No questions asked.</p>
        </div>
      </motion.div>
    </section>
  );
};

export default FAQ;
