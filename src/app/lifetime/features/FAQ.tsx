'use client';

import { Collapse } from 'antd';
import { createStyles } from 'antd-style';
import { ChevronDown } from 'lucide-react';

const useStyles = createStyles(({ css }) => ({
  collapse: css`
    border: none !important;
    background: transparent !important;

    .ant-collapse-item {
      margin-block-end: 8px;
      border-block-end: 1px solid rgba(255, 255, 255, 5%) !important;

      &:last-child {
        border-block-end: none !important;
      }
    }

    .ant-collapse-header {
      align-items: center !important;

      padding-block: 24px !important;
      padding-inline: 0 !important;

      font-size: 18px !important;
      font-weight: 500 !important;
      color: #fff !important;
    }

    .ant-collapse-content {
      border-block-start: none !important;
      background: transparent !important;
    }

    .ant-collapse-content-box {
      padding-block: 0 24px !important;
      padding-inline: 0 !important;

      font-size: 16px !important;
      line-height: 1.6 !important;
      color: rgba(255, 255, 255, 70%) !important;
    }
  `,
  header: css`
    margin-block-end: 48px;
    text-align: center;

    h2 {
      margin-block-end: 16px;

      font-size: 32px;
      font-weight: 700;

      background: linear-gradient(to bottom, #fff 40%, rgba(255, 255, 255, 50%));
      background-clip: text;

      -webkit-text-fill-color: transparent;
    }
  `,
  legalTerms: css`
    margin-block-start: 64px;
    padding: 32px;
    border: 1px solid rgba(255, 255, 255, 5%);
    border-radius: 16px;

    background: rgba(255, 255, 255, 2%);

    h3 {
      margin-block-end: 24px;
      font-size: 18px;
      color: #fff;
    }

    h4 {
      margin-block: 16px 8px;
      margin-inline: 0;
      font-size: 15px;
      color: #fff;
    }

    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 60%);
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
        "It means you pay once and get access to Pho.chat's premium features for as long as the platform is online. No monthly subscriptions, ever.",
      key: '1',
      label: 'What exactly does "Lifetime" mean?',
    },
    {
      children:
        'Yes. To keep the service fast for everyone and cover API costs, we implement a generous monthly usage cap (Fair Use Policy). You can see your remaining credits in your dashboard.',
      key: '2',
      label: 'Are there any usage limits?',
    },
    {
      children:
        'You will get all standard model updates. If we integrate extremely expensive next-gen models in the future, we may offer them as a separate add-on, but your core access remains untouched.',
      key: '3',
      label: 'Does this include future AI models?',
    },
    {
      children:
        "Since we use Polar.sh for secure payments, you are protected by a 14-day refund window. If you're not satisfied, just contact us within 14 days for a full refund.",
      key: '4',
      label: 'What is the refund policy?',
    },
    {
      children:
        "LTD slots are limited by quantity. You can upgrade only if the next tier's slots are still available.",
      key: '5',
      label: 'Can I upgrade my tier later?',
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Frequently Asked Questions</h2>
      </div>

      <Collapse
        accordion
        className={styles.collapse}
        expandIcon={({ isActive }) => (
          <ChevronDown
            color={isActive ? '#fff' : 'rgba(255,255,255,0.5)'}
            size={20}
            style={{
              transform: isActive ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.3s',
            }}
          />
        )}
        expandIconPosition="end"
        items={faqItems}
      />

      <div className={styles.legalTerms}>
        <h3>Terms of Service (TOS) Extract</h3>

        <h4>License & Access</h4>
        <p>
          The &quot;Lifetime Deal&quot; (LTD) grants you perpetual access to the features included
          in your specific tier for the lifetime of the Pho.chat product. This license is for
          individual use only and cannot be resold or redistributed.
        </p>

        <h4>Fair Usage Policy (FUP)</h4>
        <p>
          To ensure stability and prevent abuse, LTD accounts are subject to a monthly credit limit
          (e.g., X tokens or Y messages per month). These credits reset at the start of each billing
          cycle. Automated scraping or bot-like behavior is strictly prohibited.
        </p>

        <h4>Product Lifecycle</h4>
        <p>
          &quot;Lifetime&quot; refers to the operational life of Pho.chat. In the event of a service
          discontinuation, Pho.chat will provide at least 60 days&apos; notice.
        </p>

        <h4>Refund Policy</h4>
        <p>
          We offer a 14-day &quot;No Questions Asked&quot; refund guarantee. After 14 days, all
          sales are final due to the nature of digital assets and immediate API cost allocation.
        </p>
      </div>
    </section>
  );
};

export default FAQ;
