'use client';

import * as Sentry from '@sentry/nextjs';
import { ReactNode } from 'react';

interface SentryErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Error boundary component that captures React errors and sends them to Sentry
 */
const SentryErrorBoundary = ({ children }: SentryErrorBoundaryProps) => {
  const ErrorBoundary = Sentry.ErrorBoundary;

  return (
    <ErrorBoundary
      fallback={
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>We've been notified about this error. Please try refreshing the page.</p>
        </div>
      }
      showDialog
    >
      {children}
    </ErrorBoundary>
  );
};

export default SentryErrorBoundary;

