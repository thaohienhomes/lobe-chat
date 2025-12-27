import { PropsWithChildren } from 'react';

import MobileContentLayout from '@/components/server/MobileNavLayout';

import SessionSearchBar from '../../features/SessionSearchBar';
import SessionHeader from './SessionHeader';

/**
 * Mobile Session Layout
 *
 * Note: TrialUpgradePrompt was removed as the pricing structure has changed.
 * Free tier (Phở Không Người Lái) now uses compute credits via OpenRouter
 * instead of a fixed message limit. See src/config/pricing.ts for details.
 */
const MobileLayout = ({ children }: PropsWithChildren) => {
  return (
    <MobileContentLayout header={<SessionHeader />} withNav>
      <div style={{ padding: '8px 16px' }}>
        <SessionSearchBar mobile />
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </MobileContentLayout>
  );
};

export default MobileLayout;
