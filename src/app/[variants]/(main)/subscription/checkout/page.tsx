import { Suspense } from 'react';

import Client from './Client';

/* ── Skeleton placeholder for perceived-instant load ── */
const skeletonBlock = (h: number | string, w: string | number = '100%', r = 8) => ({
  animation: 'pulse 1.5s ease-in-out infinite',
  background: 'rgba(255,255,255,0.06)',
  borderRadius: r,
  height: h,
  width: w,
});

function CheckoutSkeleton() {
  return (
    <div
      style={{
        alignItems: 'flex-start',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 24,
        width: '100%',
      }}
    >
      {/* pulse keyframes injected once */}
      <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:.3}}`}</style>

      <div style={{ maxWidth: 1200, width: '100%' }}>
        {/* Header skeleton */}
        <div style={{ marginBlockEnd: 32 }}>
          <div style={{ ...skeletonBlock(20, 60), marginBlockEnd: 16 }} />
          <div style={{ ...skeletonBlock(32, 280), marginBlockEnd: 8 }} />
          <div style={skeletonBlock(16, 340)} />
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: 'grid',
            gap: 32,
            gridTemplateColumns: '1fr 1fr',
          }}
        >
          {/* Left column – plan summary */}
          <div>
            <div style={{ ...skeletonBlock(180), marginBlockEnd: 24 }} />
            <div style={skeletonBlock(200)} />
          </div>
          {/* Right column – checkout form */}
          <div style={skeletonBlock(420, '100%', 12)} />
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <Client />
    </Suspense>
  );
}
