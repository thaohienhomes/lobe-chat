import { Metadata } from 'next';

import Comparison from './features/Comparison';
import FAQ from './features/FAQ';
import Features from './features/Features';
import Hero from './features/Hero';
import Pricing from './features/Pricing';

export const metadata: Metadata = {
  description:
    'Own Pho.chat forever with a one-time payment. Zero subscriptions, premium AI access.',
  title: 'Lifetime Deal - Pho.chat',
};

const LifetimeDealPage = () => {
  return (
    <>
      <Hero />
      <Comparison />
      <Features />
      <Pricing />
      <FAQ />
    </>
  );
};

export default LifetimeDealPage;
