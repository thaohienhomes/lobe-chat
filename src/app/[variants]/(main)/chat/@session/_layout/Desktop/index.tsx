import { PropsWithChildren, Suspense } from 'react';
import { Flexbox } from 'react-layout-kit';

import TrialUpgradePrompt from '@/features/TrialUpgradePrompt';

import PanelBody from './PanelBody';
import Header from './SessionHeader';

const DesktopLayout = ({ children }: PropsWithChildren) => {
  return (
    <Flexbox height="100%" style={{ position: 'relative' }}>
      <Header />
      <PanelBody>{children}</PanelBody>
      {/* ↓ cloud slot - moved to bottom ↓ */}
      <div style={{ marginTop: 'auto', padding: '0 8px 8px 8px' }}>
        <Suspense fallback={null}>
          <TrialUpgradePrompt />
        </Suspense>
      </div>
      {/* ↑ cloud slot ↑ */}
    </Flexbox>
  );
};

export default DesktopLayout;
