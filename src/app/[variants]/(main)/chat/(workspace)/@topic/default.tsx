// import TopicListContent from './features/TopicListContent';
import React, { Suspense, lazy } from 'react';
import { Flexbox } from 'react-layout-kit';

import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import Desktop from './_layout/Desktop';
import Mobile from './_layout/Mobile';
import SkeletonList from './features/SkeletonList';
import SystemRole from './features/SystemRole';

const TopicContent = lazy(() => import('./features/TopicListContent'));

// Wrap in single root element (Flexbox) instead of fragment to fix React boundary error
// "A previously unvisited boundary must have exactly one root segment"
// Sentry issue: PHO-JAVASCRIPT-NEXTJS-J
const Topic = async (props: DynamicLayoutProps) => {
  const isMobile = await RouteVariants.getIsMobile(props);

  const Layout = isMobile ? Mobile : Desktop;

  return (
    <Flexbox height={'100%'} style={{ position: 'relative' }}>
      {!isMobile && <SystemRole />}
      <Layout>
        <Suspense fallback={<SkeletonList />}>
          <TopicContent />
        </Suspense>
      </Layout>
    </Flexbox>
  );
};

Topic.displayName = 'ChatTopic';

export default Topic;
