import { Suspense, lazy } from 'react';
import { Flexbox } from 'react-layout-kit';

import CircleLoading from '@/components/Loading/CircleLoading';
import ServerLayout from '@/components/server/ServerLayout';
import { DynamicLayoutProps } from '@/types/next';

import Desktop from './_layout/Desktop';
import Mobile from './_layout/Mobile';
import SessionHydration from './features/SessionHydration';
import SkeletonList from './features/SkeletonList';

const SessionListContent = lazy(() => import('./features/SessionListContent'));

const Layout = ServerLayout({ Desktop, Mobile });

// Wrap in single root element (Flexbox) instead of having multiple children in Suspense
// to fix React boundary error "A previously unvisited boundary must have exactly one root segment"
// Sentry issue: PHO-JAVASCRIPT-NEXTJS-J
const Session = (props: DynamicLayoutProps) => {
  return (
    <Suspense fallback={<CircleLoading />}>
      <Flexbox height={'100%'} style={{ position: 'relative' }}>
        <Layout {...props}>
          <Suspense fallback={<SkeletonList />}>
            <SessionListContent />
          </Suspense>
        </Layout>
        <SessionHydration />
      </Flexbox>
    </Suspense>
  );
};

Session.displayName = 'Session';

export default Session;
