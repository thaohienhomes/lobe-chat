'use client';

import { Alert, Button } from 'antd';
import { Component, type PropsWithChildren, type ReactNode } from 'react';

interface ClerkErrorBoundaryState {
  error: Error | null;
  hasError: boolean;
  retryCount: number;
}

/**
 * Error Boundary that catches Clerk JS load failures.
 *
 * When clerk.pho.chat CDN is unreachable, ClerkProvider throws an unhandled
 * exception with code "failed_to_load_clerk_js". This boundary:
 * 1. Renders children (app) without auth – the app works in read-only mode
 * 2. Shows a dismissible warning banner
 * 3. Auto-retries after exponential backoff
 * 4. Tracks the failure via PostHog
 */
class ClerkErrorBoundary extends Component<PropsWithChildren, ClerkErrorBoundaryState> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { error: null, hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ClerkErrorBoundaryState> {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error): void {
    const isClerkError =
      error.message?.includes('Failed to load Clerk') ||
      error.message?.includes('failed_to_load_clerk_js') ||
      error.message?.includes('clerk');

    // Track via PostHog
    if (typeof window !== 'undefined') {
      (window as any).posthog?.capture('clerk_load_failure', {
        error_message: error.message,
        retry_count: this.state.retryCount,
        url: window.location.href,
      });
    }

    // Auto-retry with exponential backoff (max 3 retries)
    if (isClerkError && this.state.retryCount < 3) {
      const delay = Math.min(5000 * Math.pow(2, this.state.retryCount), 30_000);
      this.retryTimer = setTimeout(() => {
        this.setState((prev) => ({
          error: null,
          hasError: false,
          retryCount: prev.retryCount + 1,
        }));
      }, delay);
    }
  }

  componentWillUnmount(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleManualRetry = (): void => {
    this.setState((prev) => ({
      error: null,
      hasError: false,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleDismiss = (): void => {
    // Just hide the banner; children are still rendered
    this.setState({ error: null, hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Render children WITHOUT ClerkProvider so the app remains usable
      // The auth context will be missing, but the UI won't be blank
      return (
        <>
          <div
            style={{
              left: 0,
              padding: '0 16px',
              position: 'fixed',
              right: 0,
              top: 0,
              zIndex: 10_001,
            }}
          >
            <Alert
              action={
                <Button onClick={this.handleManualRetry} size="small" type="primary">
                  {this.state.retryCount < 3 ? 'Đang thử lại...' : 'Thử lại'}
                </Button>
              }
              banner
              closable
              message="Xác thực tạm thời không khả dụng. Ứng dụng đang ở chế độ chỉ đọc."
              onClose={this.handleDismiss}
              type="warning"
            />
          </div>
          {this.props.children}
        </>
      );
    }

    return this.props.children;
  }
}

export default ClerkErrorBoundary;
