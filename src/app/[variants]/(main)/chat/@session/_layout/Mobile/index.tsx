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
      <div style={{ flex: 1 }}>
        {children}
      </div>
      {/* ↓ cloud slot - moved to bottom ↓ */}
      <div style={{ padding: '8px 16px' }}>
        <Suspense fallback={null}>
          <TrialUpgradePrompt compact />
        </Suspense>
      </div>
      {/* ↑ cloud slot ↑ */}
    </MobileContentLayout>
  );
};

export default MobileLayout;
