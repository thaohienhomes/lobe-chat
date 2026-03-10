'use client';

import { Quote } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';
import { Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  quote: css`
    padding: 20px 24px;
    font-style: italic;
    background: ${token.colorBgContainer};
    border-inline-start: 3px solid #3b82f6;
    border-radius: 0 12px 12px 0;
    transition: all 0.25s ease;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateX(4px);
    }
  `,
  stat: css`
    flex: 1;
    min-width: 120px;
    padding: 24px;
    text-align: center;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    transition: all 0.25s ease;

    &:hover {
      border-color: rgba(59, 130, 246, 0.3);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
  `,
  statNumber: css`
    font-size: 36px;
    font-weight: 700;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  `,
  statsRow: css`
    flex-wrap: wrap;
  `,
}));

const STATS = [
  { key: 'botsLive', target: 2847, value: '2,847' },
  { key: 'messagesProcessed', suffix: 'K', target: 156, value: '156K' },
  { key: 'uptime', prefix: '', suffix: '%', target: 99.9, value: '99.9%' },
];

const TESTIMONIALS = ['testimonial1', 'testimonial2'];

const AnimatedNumber = memo<{ suffix?: string; target: number }>(({ target, suffix = '' }) => {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  const animate = useCallback(() => {
    if (animated.current) return;
    animated.current = true;

    const duration = 1200;
    const start = performance.now();
    const isFloat = !Number.isInteger(target);

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;

      if (isFloat) {
        setDisplay(current.toFixed(1));
      } else {
        setDisplay(Math.floor(current).toLocaleString());
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
});

AnimatedNumber.displayName = 'AnimatedNumber';

const SocialProofSection = memo(() => {
  const { t } = useTranslation('openclaw');
  const { styles } = useStyles();

  return (
    <Flexbox gap={24}>
      <Title level={3}>{t('social.title')}</Title>

      <Flexbox className={styles.statsRow} gap={16} horizontal>
        {STATS.map(({ key, suffix, target }) => (
          <Flexbox className={styles.stat} gap={4} key={key}>
            <Text className={styles.statNumber}>
              <AnimatedNumber suffix={suffix} target={target} />
            </Text>
            <Text type="secondary">{t(`social.stats.${key}`)}</Text>
          </Flexbox>
        ))}
      </Flexbox>

      <Flexbox gap={16}>
        {TESTIMONIALS.map((key) => (
          <Flexbox className={styles.quote} gap={8} key={key}>
            <Quote size={16} style={{ color: '#3b82f6', opacity: 0.6 }} />
            <Paragraph style={{ margin: 0 }}>{t(`social.${key}.text`)}</Paragraph>
            <Text type="secondary">{t(`social.${key}.author`)}</Text>
          </Flexbox>
        ))}
      </Flexbox>
    </Flexbox>
  );
});

SocialProofSection.displayName = 'SocialProofSection';

export default SocialProofSection;
