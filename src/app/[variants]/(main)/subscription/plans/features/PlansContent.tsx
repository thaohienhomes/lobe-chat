'use client';

import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import CompareSection from '../../../settings/subscription/features/CompareSection';
import PlansSection from '../../../settings/subscription/features/PlansSection';

const PlansContent = memo(() => {
  return (
    <Flexbox gap={32} style={{ margin: '0 auto', maxWidth: '1200px' }} width={'100%'}>
      <PlansSection />
      <CompareSection />
    </Flexbox>
  );
});

PlansContent.displayName = 'PlansContent';

export default PlansContent;
