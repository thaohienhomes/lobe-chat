'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';

import FeaturesSection from './sections/FeaturesSection';
import FinalCTASection from './sections/FinalCTASection';
import HeroSection from './sections/HeroSection';
import PainPointsSection from './sections/PainPointsSection';
import PricingSection from './sections/PricingSection';
import SocialProofSection from './sections/SocialProofSection';
import StickyBottomBar from './sections/StickyBottomBar';
import TemplatesSection from './sections/TemplatesSection';
import TrustSection from './sections/TrustSection';

const useStyles = createStyles(({ css }) => ({
  container: css`
    overflow-y: auto;

    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    padding: 0 24px 120px;

    @media (max-width: 640px) {
      padding: 0 16px 120px;
    }
  `,
  fadeSection: css`
    opacity: 0;
    transform: translateY(24px);
    transition:
      opacity 0.6s ease-out,
      transform 0.6s ease-out;

    &[data-visible='true'] {
      opacity: 1;
      transform: translateY(0);
    }
  `,
  heroFade: css`
    opacity: 0;
    transform: translateY(16px);
    animation: heroFadeIn 0.8s ease-out forwards;

    @keyframes heroFadeIn {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  wrapper: css`
    overflow-y: auto;

    width: 100%;
    height: 100%;
  `,
}));

const FadeInSection = memo<{ children: React.ReactNode; className: string; delay?: number }>(
  ({ children, className, delay = 0 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setTimeout(() => setVisible(true), delay);
            observer.unobserve(el);
          }
        },
        { threshold: 0.1 },
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [delay]);

    return (
      <div className={className} data-visible={visible} ref={ref}>
        {children}
      </div>
    );
  },
);

FadeInSection.displayName = 'FadeInSection';

const Client = memo(() => {
  const { styles } = useStyles();
  const [showStickyBar, setShowStickyBar] = useState(false);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowStickyBar(scrollTop > 400);
  }, []);

  return (
    <div className={styles.wrapper} onScroll={handleScroll}>
      <Flexbox className={styles.container} gap={72}>
        <div className={styles.heroFade}>
          <HeroSection />
        </div>
        <FadeInSection className={styles.fadeSection}>
          <PainPointsSection />
        </FadeInSection>
        <FadeInSection className={styles.fadeSection} delay={100}>
          <FeaturesSection />
        </FadeInSection>
        <FadeInSection className={styles.fadeSection} delay={100}>
          <TrustSection />
        </FadeInSection>
        <FadeInSection className={styles.fadeSection} delay={100}>
          <SocialProofSection />
        </FadeInSection>
        <FadeInSection className={styles.fadeSection} delay={100}>
          <PricingSection />
        </FadeInSection>
        <FadeInSection className={styles.fadeSection} delay={100}>
          <TemplatesSection />
        </FadeInSection>
        <FadeInSection className={styles.fadeSection} delay={100}>
          <FinalCTASection />
        </FadeInSection>
      </Flexbox>
      <StickyBottomBar visible={showStickyBar} />
    </div>
  );
});

Client.displayName = 'OpenClawClient';

export default Client;
