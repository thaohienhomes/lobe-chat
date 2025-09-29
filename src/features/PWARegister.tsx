'use client';

import { useEffect } from 'react';

const PWARegister = () => {
  useEffect(() => {
    // only register in production browsers
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && // @ts-ignore serwist injected at runtime
      window?.serwist?.register) {
        // best-effort registration; ignore errors
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        window.serwist.register().catch(() => {});
      }
  }, []);

  return null;
};

export default PWARegister;
