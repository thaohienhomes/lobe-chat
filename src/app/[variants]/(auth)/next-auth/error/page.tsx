import { Suspense } from 'react';

import Loading from '@/components/Loading/BrandTextLoading';

import AuthErrorPage from './AuthErrorPage';

// Force dynamic rendering to avoid static generation issues with Clerk hooks
export const dynamic = 'force-dynamic';

export default () => (
  <Suspense fallback={<Loading />}>
    <AuthErrorPage />
  </Suspense>
);
