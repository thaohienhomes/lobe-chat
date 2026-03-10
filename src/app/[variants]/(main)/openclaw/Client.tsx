'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';
import { createStyles } from 'antd-style';

import HeroSection from './sections/HeroSection';
import PainPointsSection from './sections/PainPointsSection';
import FeaturesSection from './sections/FeaturesSection';
import TrustSection from './sections/TrustSection';
import SocialProofSection from './sections/SocialProofSection';
import PricingSection from './sections/PricingSection';
import TemplatesSection from './sections/TemplatesSection';
import FinalCTASection from './sections/FinalCTASection';
import StickyBottomBar from './sections/StickyBottomBar';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    overflow-y: auto;

    width: 100%;
    max-width: 960px;
    margin: 0 auto;
    padding: 0 24px 120px;

    background: ${token.colorBgLayout};
  `,
  wrapper: css`
    overflow-y: auto;

    width: 100%;
    height: 100%;

    background: ${token.colorBgLayout};
  `,
}));

const Client = memo(() => {
  const { styles } = useStyles();
  const [showStickyBar, setShowStickyBar] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowStickyBar(scrollTop > 400);
  }, []);

  return (
    <div className={styles.wrapper} onScroll={handleScroll}>
      <Flexbox className={styles.container} gap={64}>
        <div ref={heroRef}>
          <HeroSection />
        </div>
        <PainPointsSection />
        <FeaturesSection />
        <TrustSection />
        <SocialProofSection />
        <PricingSection />
        <TemplatesSection />
        <FinalCTASection />
      </Flexbox>
      <StickyBottomBar visible={showStickyBar} />
    </div>
  );
});

Client.displayName = 'OpenClawClient';

export default Client;
