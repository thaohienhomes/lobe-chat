'use client';

import { createStyles } from 'antd-style';
import { motion } from 'framer-motion';
import { Quote, Star, User } from 'lucide-react';

const useStyles = createStyles(({ css, responsive }) => ({
  avatar: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 48px;
    height: 48px;
    border-radius: 50%;

    background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  `,
  card: css`
    position: relative;

    padding: 28px;
    border: 1px solid rgba(255, 255, 255, 6%);
    border-radius: 20px;

    background: #141414;

    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      border-color: rgba(124, 58, 237, 25%);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 40%);
    }
  `,
  content: css`
    margin-block: 20px 24px;
    margin-inline: 0;

    font-size: 15px;
    font-style: italic;
    line-height: 1.7;
    color: rgba(255, 255, 255, 75%);
  `,
  footer: css`
    display: flex;
    gap: 14px;
    align-items: center;
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;

    ${responsive.mobile} {
      grid-template-columns: 1fr;
      gap: 20px;
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

      ${responsive.mobile} {
        font-size: 28px;
      }
    }

    p {
      margin-block: 12px 0;
      margin-inline: 0;
      font-size: 18px;
      color: rgba(255, 255, 255, 50%);

      ${responsive.mobile} {
        font-size: 16px;
      }
    }
  `,
  name: css`
    font-size: 15px;
    font-weight: 600;
    color: #fff;
  `,
  quoteIcon: css`
    position: absolute;
    inset-block-start: 24px;
    inset-inline-end: 24px;
    opacity: 0.15;
  `,
  role: css`
    font-size: 13px;
    color: rgba(255, 255, 255, 50%);
  `,
  section: css`
    max-width: 1100px;
    margin-block: 0;
    margin-inline: auto;
    padding-block: 80px;
    padding-inline: 24px;
  `,
  stars: css`
    display: flex;
    gap: 4px;
  `,
  userInfo: css`
    flex: 1;
  `,
}));

const testimonials = [
  {
    content:
      "Finally, an AI tool that doesn't eat my wallet every month. The multi-model switch is seamless!",
    name: 'Alex G.',
    role: 'Indie Hacker',
  },
  {
    content:
      'Used to pay $20/mo for ChatGPT. Switched to Pho.chat Lifetime and saved $200+ already. Highly recommend.',
    name: 'Sarah L.',
    role: 'Content Strategist',
  },
  {
    content:
      'The best investment for my research workflow. Having Claude and GPT-4 in one UI is a game changer.',
    name: 'James T.',
    role: 'PhD Researcher',
  },
];

const Testimonials = () => {
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
        <h2>What Our Users Say</h2>
        <p>Real feedback from early adopters</p>
      </motion.div>

      <div className={styles.grid}>
        {testimonials.map((item, index) => (
          <motion.div
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            key={index}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Quote className={styles.quoteIcon} size={40} />

            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star color="#f59e0b" fill="#f59e0b" key={star} size={16} />
              ))}
            </div>

            <p className={styles.content}>&ldquo;{item.content}&rdquo;</p>

            <div className={styles.footer}>
              <div className={styles.avatar}>
                <User color="#fff" size={24} />
              </div>
              <div className={styles.userInfo}>
                <div className={styles.name}>{item.name}</div>
                <div className={styles.role}>{item.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Testimonials;
