import { Metadata } from 'next';
import dynamic from 'next/dynamic';

import Comparison from './features/Comparison';
import FAQ from './features/FAQ';
import Features from './features/Features';
import Hero from './features/Hero';
import Pricing from './features/Pricing';
import SocialProof from './features/SocialProof';

// Lazy load Testimonials for better PageSpeed
const Testimonials = dynamic(() => import('./features/Testimonials'), {
  loading: () => <div style={{ minHeight: 400 }} />,
  ssr: false,
});

export const metadata: Metadata = {
  description:
    'Own Pho.chat forever with a one-time payment. Zero subscriptions, premium AI access.',
  title: 'Lifetime Deal - Pho.chat',
};

const LifetimeDealPage = () => {
  return (
    <>
      <Hero />
      <SocialProof />
      <Comparison />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
    </>
  );
};

export default LifetimeDealPage;
