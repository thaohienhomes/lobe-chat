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

    @media (max-width: 640px) {
      padding: 20px;
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

      @media (max-width: 640px) {
        font-size: 28px;
      }
    }

    p {
      margin-block: 12px 0;
      margin-inline: 0;
      font-size: 18px;
      color: rgba(255, 255, 255, 50%);

      @media (max-width: 640px) {
        font-size: 16px;
      }
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

    @media (max-width: 640px) {
      margin-block: 48px 0;
      padding: 16px;
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

    @media (max-width: 640px) {
      width: 40px;
      height: 40px;
    }
  `,
  refundText: css`
    h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #22c55e;

      @media (max-width: 640px) {
        font-size: 15px;
      }
    }

    p {
      margin-block: 4px 0;
      margin-inline: 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 55%);

      @media (max-width: 640px) {
        font-size: 13px;
      }
    }
  `,
  section: css`
    max-width: 900px;
    margin-block: 0;
    margin-inline: auto;
    padding-block: 80px 120px;
    padding-inline: 24px;

    @media (max-width: 640px) {
      padding-block: 60px 80px;
      padding-inline: 16px;
    }
  `,
}));

const FAQ = () => {
  const { styles } = useStyles();

  const faqItems = [
    {
      children:
        'It means you pay once and enjoy premium access to Pho.chat for the lifetime of the product. No monthly subscriptions, no recurring bills. Your account will remain active as long as the platform is operational. We are committed to long-term sustainability and growth.',
      key: '1',
      label: 'What exactly does "Lifetime Access" mean?',
    },
    {
      children:
        "We want to be transparent. You get generous monthly credits (approx. $5-$10 value/month) which resets every 30 days. This is enough for ~500 GPT-4 queries or ~2000+ Flash queries. If you need more, you can use the 'Bring Your Own Key' feature.",
      key: '2',
      label: 'Are there any usage limits or monthly credits?',
    },
    {
      children:
        "Don't worry, you never lose access. Our platform features a 'Bring Your Own Key' (BYOK) architecture. If you exhaust your monthly credits, simply plug in your own API Key (OpenAI, Anthropic, Gemini, etc.) in the settings and keep using the premium UI forever without interruption.",
      key: 'byok',
      label: 'What happens if I run out of credits? (Bring Your Own Key)',
    },
    {
      children:
        "You get access to the world's most powerful models, including GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, and more. As the AI landscape evolves, we continuously update our platform to include the latest and most efficient models available.",
      key: '3',
      label: 'Which AI models are included in this deal?',
    },
    {
      children:
        'Yes! This Lifetime Deal includes all future standard platform updates. For extremely high-cost "Next-Gen" models that may be released in the future (e.g., GPT-5), we aim to include them or provide them at a highly subsidized rate for our LTD members.',
      key: '4',
      label: 'Will I get access to future updates and new models?',
    },
    {
      children:
        'We offer a 14-day "No Questions Asked" Money-Back Guarantee. If Pho.chat doesn\'t meet your expectations, simply contact our support within 14 days of purchase for a full refund. Your satisfaction is our priority.',
      key: '5',
      label: 'What is your refund policy?',
    },
    {
      children:
        'Absolutely. We do not use your personal chats or data to train AI models. Your privacy is paramount, and all conversations are encrypted and handled with strict security protocols.',
      key: '6',
      label: 'Is my data private and secure?',
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
