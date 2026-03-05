'use client';

import dynamic from 'next/dynamic';
import { memo } from 'react';

const MedicalBetaFeedback = dynamic(
  () => import('@/features/MedicalBeta/FeedbackButton'),
  { ssr: false },
);

/**
 * BottomActions Component
 *
 * Sidebar bottom section. Contains the Medical Beta feedback button.
 */
const BottomActions = memo(() => {
  return <MedicalBetaFeedback />;
});

BottomActions.displayName = 'BottomActions';

export default BottomActions;
