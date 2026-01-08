'use client';

import { ProviderIcon } from '@lobehub/icons';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import Marquee from 'react-fast-marquee';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    position: relative;

    width: 100%;

    /* Center and constrain width */
    max-width: 800px;
    margin-block-start: 48px;
    margin-inline: auto auto;

    mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
  `,
  label: css`
    margin-block-end: 24px;

    font-size: 14px;
    color: ${token.colorTextSecondary};
    text-align: center;

    opacity: 0.6;
  `,
  logoWrapper: css`
    display: flex;
    gap: 12px;
    align-items: center;

    margin-block: 0; margin-inline: 16px; /* Reduced margin from 32px */

    opacity: 0.5;
    filter: grayscale(100%);

    transition: all 0.3s;

    &:hover {
      opacity: 1;
      filter: grayscale(0%);
    }

    svg {
      width: 32px;
      height: 32px;
    }

    span {
      font-size: 16px;
      font-weight: 600;
      color: ${token.colorTextSecondary};
    }
  `,
}));

const techLogos = [
  { provider: 'openai', title: 'ChatGPT' },
  { provider: 'anthropic', title: 'Claude' },
  { provider: 'google', title: 'Gemini' },
  { provider: 'deepseek', title: 'DeepSeek' },
  // 'meta' or 'llama' might be the provider id for Llama models. Trying 'meta' as it's common.
  // Checking typical lobe-chat provider ids.
  { provider: 'meta', title: 'Llama' },
  { provider: 'ollama', title: 'Ollama' },
  // 'xai' or 'grok'.
  { provider: 'xai', title: 'Grok' },
];

const LogoLoop = memo(() => {
  const { styles } = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.label}>Powered by world-class AI models</div>
      <Marquee gradient={false} pauseOnHover speed={40}>
        {techLogos.map((item) => (
          <div className={styles.logoWrapper} key={item.provider}>
            <ProviderIcon provider={item.provider} size={32} />
            <span>{item.title}</span>
          </div>
        ))}
      </Marquee>
    </div>
  );
});

export default LogoLoop;
