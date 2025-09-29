import { Suspense } from 'react';

import Client from './Client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            minHeight: '50vh',
            padding: 24,
          }}
        >
          Loading checkout…
        </div>
      }
    >
      <Client />
    </Suspense>
  );
}
