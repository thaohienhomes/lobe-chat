'use client';

import { Button } from 'antd';
import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const useStyles = createStyles(({ css }) => ({
  button: css`
    height: 48px;
    font-size: 16px;
    font-weight: 600;
  `,
  container: css`
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: 100vh;
    padding: 24px;

    background: #000;
  `,
  content: css`
    max-width: 600px;
    text-align: center;
  `,
  description: css`
    margin-block: 24px 48px;
    margin-inline: 0;

    font-size: 18px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 70%);
  `,
  icon: css`
    margin-block-end: 24px;
    color: #52c41a;
  `,
  title: css`
    margin: 0;
    font-size: 48px;
    font-weight: 800;
    color: #fff;
  `,
}));

const SuccessPage = () => {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={styles.content}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <CheckCircle className={styles.icon} size={80} />

        <h1 className={styles.title}>Payment Successful! 🎉</h1>

        <p className={styles.description}>
          Thank you for your purchase! Your lifetime access to Pho.chat has been activated.
          <br />
          <br />
          You can now enjoy unlimited AI conversations with all available models.
        </p>

        <Link href="/chat">
          <Button
            className={styles.button}
            icon={<ArrowRight size={20} />}
            iconPosition="end"
            size="large"
            type="primary"
          >
            Start Chatting
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
