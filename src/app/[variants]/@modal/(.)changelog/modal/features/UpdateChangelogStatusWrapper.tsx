'use client';

import dynamic from 'next/dynamic';

// Dynamically import the original component and disable SSR
// to prevent SWR from leaking into the server module graph
export const UpdateChangelogStatusWrapper = dynamic(
    () => import('./UpdateChangelogStatus'),
    { ssr: false },
);
