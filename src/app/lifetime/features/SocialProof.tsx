'use client';

import { createStyles } from 'antd-style';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { Rocket, Users } from 'lucide-react';
import { useEffect } from 'react';

const useStyles = createStyles(({ css, responsive }) => ({
  container: css`
    max-width: 800px;
    margin-block: 0;
    margin-inline: auto;
    padding-block: 40px;
    padding-inline: 24px;
  `,
  content: css`
    display: flex;
    gap: 20px;
    align-items: center;
    justify-content: center;

    padding-block: 24px;
    padding-inline: 32px;
    border: 1px solid rgba(124, 58, 237, 20%);
    border-radius: 20px;

    background: rgba(124, 58, 237, 5%);
    backdrop-filter: blur(10px);

    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(124, 58, 237, 35%);
      box-shadow: 0 8px 40px rgba(124, 58, 237, 12%);
    }

    ${responsive.mobile} {
      flex-direction: column;
      gap: 16px;

      padding-block: 20px;
      padding-inline: 24px;

      text-align: center;
    }
  `,
  iconWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 52px;
    height: 52px;
    border-radius: 14px;

    background: rgba(124, 58, 237, 15%);

    animation: pulse 2s infinite;

    @keyframes pulse {
      0%,
      100% {
        transform: scale(1);
        opacity: 1;
      }

      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
    }

    ${responsive.mobile} {
      width: 48px;
      height: 48px;
    }
  `,
  number: css`
    font-size: 28px;
    font-weight: 800;
    color: #a855f7;

    ${responsive.mobile} {
      font-size: 24px;
    }
  `,
  text: css`
    font-size: 17px;
    font-weight: 500;
    color: rgba(255, 255, 255, 80%);

    ${responsive.mobile} {
      font-size: 15px;
    }
  `,
  textWrapper: css`
    display: flex;
    gap: 8px;
    align-items: baseline;

    ${responsive.mobile} {
      flex-wrap: wrap;
      justify-content: center;
    }
  `,
}));

const AnimatedNumber = ({ value }: { value: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, value, { duration: 2, ease: 'easeOut' });
    return controls.stop;
  }, [count, value]);

  return <motion.span>{rounded}</motion.span>;
};

const SocialProof = () => {
  const { styles } = useStyles();

  return (
    <section className={styles.container}>
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div className={styles.iconWrapper}>
          <Users color="#a855f7" size={26} />
        </div>
        <div className={styles.textWrapper}>
          <span className={styles.text}>Join</span>
          <span className={styles.number}>
            <AnimatedNumber value={150} />+
          </span>
          <span className={styles.text}>early adopters who switched to Pho.chat this month</span>
          <Rocket color="#f59e0b" size={20} style={{ marginInlineStart: 4 }} />
        </div>
      </motion.div>
    </section>
  );
};

export default SocialProof;
