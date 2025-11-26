import { PropsWithChildren, Suspense } from 'react';

import MobileContentLayout from '@/components/server/MobileNavLayout';
import TrialUpgradePrompt from '@/features/TrialUpgradePrompt';

import SessionSearchBar from '../../features/SessionSearchBar';
import SessionHeader from './SessionHeader';

const MobileLayout = ({ children }: PropsWithChildren) => {
  return (
    <MobileContentLayout header={<SessionHeader />} withNav>
      <div style={{ padding: '8px 16px' }}>
        <SessionSearchBar mobile />
      </div>
      {children}
      {/* ↓ cloud slot ↓ */}
      <Suspense fallback={null}>
        <TrialUpgradePrompt compact />
      </Suspense>
      {/* ↑ cloud slot ↑ */}
    </MobileContentLayout>
  );
};

export default MobileLayout;
