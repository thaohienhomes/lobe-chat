'use client';

import { Highlighter } from '@lobehub/ui';
import { Button, Result } from 'antd';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Fallback content when no widget code is available */
  fallbackCode?: string;
}

interface State {
  error: Error | null;
  hasError: boolean;
}

/**
 * Error boundary for individual Visualizer widgets.
 *
 * When a widget crashes (bad HTML/JS in iframe, render errors, etc.),
 * this catches the error and shows:
 * 1. A user-friendly error message
 * 2. The raw widget code in a syntax-highlighted code block
 * 3. A "Retry" button to re-mount the widget
 */
class VisualizerErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null, hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Visualizer] Widget crashed:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ error: null, hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <Result
            extra={
              <Button onClick={this.handleRetry} type="primary">
                Retry
              </Button>
            }
            status="warning"
            subTitle={this.state.error?.message || 'An unexpected error occurred'}
            title="Widget Failed to Render"
          />
          {this.props.fallbackCode && (
            <Highlighter language="html" style={{ marginTop: 12 }}>
              {this.props.fallbackCode}
            </Highlighter>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default VisualizerErrorBoundary;
