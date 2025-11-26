'use client';

import { createStyles } from 'antd-style';
import { Suspense, memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { withSuspense } from '@/components/withSuspense';
import { PendingMessageHandler, UnauthenticatedPrompt } from '@/features/Auth';
import InitClientDB from '@/features/InitClientDB';
import { useShowMobileWorkspace } from '@/hooks/useShowMobileWorkspace';

import { LayoutProps } from './type';

const useStyles = createStyles(({ css, token }) => ({
  main: css`
    position: relative;
    overflow: hidden;
    background: ${token.colorBgLayout};
  `,
}));

const Layout = memo<LayoutProps>(({ children, session }) => {
  const showMobileWorkspace = useShowMobileWorkspace();
  const { styles } = useStyles();

  return (
    <>
      <Flexbox
        className={styles.main}
        height="100%"
        style={showMobileWorkspace ? { display: 'none' } : undefined}
        width="100%"
      >
        {session}
      </Flexbox>
      <Flexbox
        className={styles.main}
        height="100%"
        style={showMobileWorkspace ? undefined : { display: 'none' }}
        width="100%"
      >
        {children}
      </Flexbox>
      <Suspense>
        <InitClientDB bottom={100} />
      </Suspense>
      {/* Auth prompt for unauthenticated users */}
      <Suspense>
        <UnauthenticatedPrompt mobile />
      </Suspense>
      {/* Handle pending messages after authentication */}
      <Suspense>
        <PendingMessageHandler />
      </Suspense>
    </>
  );
});

Layout.displayName = 'MobileChatLayout';

export default withSuspense(Layout);
