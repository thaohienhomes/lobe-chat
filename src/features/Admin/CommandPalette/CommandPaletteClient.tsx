'use client';

import dynamic from 'next/dynamic';

export const CommandPaletteClient = dynamic(
    () => import('./index').then(m => ({ default: m.CommandPalette })),
    { ssr: false }
);
