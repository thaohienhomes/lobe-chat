'use client';

import { Button, FluentEmoji } from '@lobehub/ui';
import Link from 'next/link';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { MAX_WIDTH } from '@/const/layoutTokens';

export type ErrorType = Error & { digest?: string };

interface ErrorCaptureProps {
  error: ErrorType;
  reset: () => void;
}

const ErrorCapture = memo<ErrorCaptureProps>(({ error, reset }) => {
  // Priority 2: Auto-recover from ChunkLoadError (stale Vercel deployments)
  useEffect(() => {
    if (error?.name === 'ChunkLoadError' && typeof window !== 'undefined') {
      const key = `chunk-reload-${error.message?.slice(0, 80)}`;
      let alreadyReloaded = false;
      try {
        alreadyReloaded = !!sessionStorage.getItem(key);
      } catch {
        // Safari private browsing may restrict sessionStorage
      }
      if (!alreadyReloaded) {
        try {
          sessionStorage.setItem(key, '1');
        } catch {
          // Fall through to reload anyway
        }
        window.location.reload();
      } else {
        // Auto-reload already attempted — track unrecovered error for alerting
        (window as any).posthog?.capture('chunk_load_error_unrecovered', {
          error_message: error.message,
          url: window.location.href,
        });
      }
    }
  }, [error]);
  const { t } = useTranslation('error');

  return (
    <Flexbox align={'center'} justify={'center'} style={{ minHeight: '100%', width: '100%' }}>
      <h1
        style={{
          filter: 'blur(8px)',
          fontSize: `min(${MAX_WIDTH / 6}px, 25vw)`,
          fontWeight: 900,
          margin: 0,
          opacity: 0.12,
          position: 'absolute',
          zIndex: 0,
        }}
      >
        ERROR
      </h1>
      <FluentEmoji emoji={'🤧'} size={64} />
      <h2 style={{ fontWeight: 'bold', marginTop: '1em', textAlign: 'center' }}>
        {t('error.title')}
      </h2>
      <p style={{ marginBottom: '2em' }}>{t('error.desc')}</p>
      <Flexbox gap={12} horizontal style={{ marginBottom: '1em' }}>
        <Button onClick={() => reset()}>{t('error.retry')}</Button>
        <Link href="/">
          <Button type={'primary'}>{t('error.backHome')}</Button>
        </Link>
      </Flexbox>
    </Flexbox>
  );
});

ErrorCapture.displayName = 'ErrorCapture';

export default ErrorCapture;
