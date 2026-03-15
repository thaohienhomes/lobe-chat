import { Suspense, lazy } from 'react';

import SkeletonLoading from '../components/SkeletonLoading';
import { PortalImpl } from '../type';
import Header from './Header';
import { useEnable } from './useEnable';

const LazyBody = lazy(() => import('./Body'));

const Body = () => (
  <Suspense fallback={<SkeletonLoading />}>
    <LazyBody />
  </Suspense>
);

export const Plugins: PortalImpl = {
  Body,
  Title: Header,
  useEnable,
};
