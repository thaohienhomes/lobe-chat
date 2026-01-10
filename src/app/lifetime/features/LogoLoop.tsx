'use client';

import { ProviderIcon } from '@lobehub/icons';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import Marquee from 'react-fast-marquee';

const useStyles = createStyles(({ css }) => ({
  container: css`
    position: relative;

    width: 100%;
    max-width: 900px;
    margin-block-start: 64px;
    margin-inline: auto;

    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  `,
  label: css`
    margin-block-end: 28px;

    font-size: 13px;
    font-weight: 500;
    color: rgba(255, 255, 255, 40%);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.15em;
  `,
  logoWrapper: css`
    display: flex;
    gap: 12px;
    align-items: center;

    margin-block: 0;
    margin-inline: 24px;
    padding-block: 12px;
    padding-inline: 20px;
    border: 1px solid transparent;
    border-radius: 12px;

    opacity: 0.5;
    filter: grayscale(100%);

    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(255, 255, 255, 10%);
      opacity: 1;
      background: rgba(255, 255, 255, 5%);
      filter: grayscale(0%);
    }

    svg {
      width: 28px;
      height: 28px;
    }

    span {
      font-size: 15px;
      font-weight: 600;
      color: rgba(255, 255, 255, 70%);
    }
  `,
}));

const techLogos = [
  { provider: 'openai', title: 'OpenAI' },
  { provider: 'anthropic', title: 'Claude' },
  { provider: 'google', title: 'Gemini' },
  { provider: 'deepseek', title: 'DeepSeek' },
  { provider: 'meta', title: 'Llama' },
  { provider: 'xai', title: 'Grok' },
];

const LogoLoop = memo(() => {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.label}>Powered by world-class AI models</div>
      <Marquee gradient={false} pauseOnHover speed={35}>
        {techLogos.map((item) => (
          <div className={styles.logoWrapper} key={item.provider}>
            <ProviderIcon provider={item.provider} size={28} />
            <span>{item.title}</span>
          </div>
        ))}
      </Marquee>
    </div>
  );
});

export default LogoLoop;
