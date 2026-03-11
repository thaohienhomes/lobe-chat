'use client';

import { ActionIcon, Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { AlertTriangle, Code2, RefreshCw, Sparkles } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode, useCallback } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { ArtifactDisplayMode } from '@/store/chat/slices/portal/initialState';

// ── Styled fallback UI ──────────────────────────────────────────────────────
const useStyles = createStyles(({ css, token }) => ({
  container: css`
    padding: 24px;
    border-radius: 8px;
    background: ${token.colorBgContainer};
  `,
  errorBox: css`
    overflow: auto;

    max-height: 120px;
    padding: 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 6px;

    font-family: monospace;
    font-size: 12px;
    line-height: 1.5;
    color: ${token.colorTextSecondary};
    word-break: break-word;

    background: ${token.colorFillQuaternary};
  `,
  title: css`
    font-size: 14px;
    font-weight: 600;
    color: ${token.colorText};
  `,
}));

// ── Fallback UI component (functional, for hooks) ───────────────────────────
interface FallbackProps {
  artifactTitle?: string;
  error: Error;
  onRetry: () => void;
}

const ErrorFallback = ({ error, onRetry, artifactTitle }: FallbackProps) => {
  const { styles } = useStyles();

  const handleFixWithAI = useCallback(() => {
    const errorPrompt = `The artifact "${artifactTitle || 'Untitled'}" encountered an error:\n\`\`\`\n${error.message}\n\`\`\`\nPlease fix this issue and regenerate the artifact.`;

    // Set the chat input content with the error prompt
    const inputElement = document.querySelector('textarea') as HTMLTextAreaElement;
    if (inputElement) {
      // Use React's native input setter to trigger onChange
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value',
      )?.set;
      nativeInputValueSetter?.call(inputElement, errorPrompt);
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.focus();
    }
  }, [error.message, artifactTitle]);

  const handleViewCode = useCallback(() => {
    useChatStore.setState(
      { portalArtifactDisplayMode: ArtifactDisplayMode.Code },
      false,
      'errorBoundaryViewCode',
    );
  }, []);

  return (
    <Center className={styles.container} gap={16} height={'100%'}>
      <Icon color={'warning'} icon={AlertTriangle} size={40} />
      <Flexbox align={'center'} className={styles.title} gap={4}>
        Artifact Render Error
      </Flexbox>
      <div className={styles.errorBox}>{error.message}</div>
      <Flexbox gap={8} horizontal>
        <ActionIcon icon={RefreshCw} onClick={onRetry} size={'small'} title={'Retry'} />
        <ActionIcon
          icon={Sparkles}
          onClick={handleFixWithAI}
          size={'small'}
          title={'Fix with AI'}
        />
        <ActionIcon icon={Code2} onClick={handleViewCode} size={'small'} title={'View Code'} />
      </Flexbox>
    </Center>
  );
};

// ── Class-based Error Boundary ──────────────────────────────────────────────
interface ErrorBoundaryProps {
  artifactTitle?: string;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  hasError: boolean;
}

class ArtifactErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ArtifactErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ error: null, hasError: false });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorFallback
          artifactTitle={this.props.artifactTitle}
          error={this.state.error}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ArtifactErrorBoundaryClass;
