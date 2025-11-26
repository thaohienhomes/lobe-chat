import { PropsWithChildren, Suspense } from 'react';

import TrialUpgradePrompt from '@/features/TrialUpgradePrompt';

import PanelBody from './PanelBody';
import Header from './SessionHeader';

const DesktopLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <Header />
      <PanelBody>{children}</PanelBody>
      {/* ↓ cloud slot ↓ */}
      <Suspense fallback={null}>
        <TrialUpgradePrompt />
      </Suspense>
      {/* ↑ cloud slot ↑ */}
    </>
  );
};

export default DesktopLayout;
