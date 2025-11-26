import { Suspense } from 'react';
import { Flexbox } from 'react-layout-kit';

import { PendingMessageHandler, UnauthenticatedPrompt } from '@/features/Auth';
import { isDesktop } from '@/const/version';
import InitClientDB from '@/features/InitClientDB';
import ProtocolUrlHandler from '@/features/ProtocolUrlHandler';

import { LayoutProps } from '../type';
import RegisterHotkeys from './RegisterHotkeys';
import SessionPanel from './SessionPanel';
import Workspace from './Workspace';

const Layout = ({ children, session }: LayoutProps) => {
  return (
    <>
      <Flexbox
        height={'100%'}
        horizontal
        style={{ maxWidth: '100%', overflow: 'hidden', position: 'relative' }}
        width={'100%'}
      >
        <SessionPanel>{session}</SessionPanel>
        <Workspace>{children}</Workspace>
      </Flexbox>
      {!isDesktop && <InitClientDB bottom={60} />}
      {/* ↓ cloud slot ↓ */}

      {/* ↑ cloud slot ↑ */}
      <Suspense>
        <RegisterHotkeys />
      </Suspense>
      {isDesktop && <ProtocolUrlHandler />}
      {/* Auth prompt for unauthenticated users */}
      <Suspense>
        <UnauthenticatedPrompt />
      </Suspense>
      {/* Handle pending messages after authentication */}
      <Suspense>
        <PendingMessageHandler />
      </Suspense>
    </>
  );
};

Layout.displayName = 'DesktopChatLayout';

export default Layout;
