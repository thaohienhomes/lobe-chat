import { Suspense, lazy } from 'react';

import SkeletonLoading from '../components/SkeletonLoading';
import { PortalImpl } from '../type';
import Header from './Header';
import { onClose, useEnable } from './hook';

const LazyChat = lazy(() => import('./Chat'));

const Body = () => (
  <Suspense fallback={<SkeletonLoading />}>
    <LazyChat />
  </Suspense>
);

export const Thread: PortalImpl = {
  Body,
  Header,
  Title: () => null,
  onClose,
  useEnable,
};
