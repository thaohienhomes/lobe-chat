import { Suspense } from 'react';

import Loading from '@/components/Loading/BrandTextLoading';

import AuthSignInBox from './AuthSignInBox';

// Force dynamic rendering to avoid static generation issues with Clerk hooks
export const dynamic = 'force-dynamic';

export default () => (
  <Suspense fallback={<Loading />}>
    <AuthSignInBox />
  </Suspense>
);
