import { useSandpack } from '@codesandbox/sandpack-react';
import { memo, useCallback, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { ArtifactDisplayMode } from '@/store/chat/slices/portal/initialState';

/**
 * Custom error overlay for React artifact Sandpack renderer.
 * Shows a readable error message with Copy Error and View Code actions.
 * Must be rendered inside a SandpackProvider.
 */
const ErrorOverlay = memo(() => {
  const { sandpack } = useSandpack();
  const { error, status } = sandpack;
  const [copied, setCopied] = useState(false);

  const switchToCode = useCallback(() => {
    useChatStore.setState(
      { portalArtifactDisplayMode: ArtifactDisplayMode.Code },
      false,
      'switchToCodeFromError',
    );
  }, []);

  const copyError = useCallback(() => {
    if (error?.message) {
      navigator.clipboard.writeText(error.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [error?.message]);

  // Loading state
  if (status === 'initial' || status === 'idle') {
    return (
      <Flexbox
        align={'center'}
        gap={8}
        justify={'center'}
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          inset: 0,
          pointerEvents: 'none',
          position: 'absolute',
          zIndex: 5,
        }}
      >
        <div
          style={{
            animation: 'spin 1s linear infinite',
            border: '2px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '50%',
            borderTopColor: '#60a5fa',
            height: 24,
            width: 24,
          }}
        />
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Building preview…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </Flexbox>
    );
  }

  if (!error) return null;

  // Parse error for display
  const errorMsg = error.message || 'Unknown compilation error';
  const lineMatch = errorMsg.match(/\((\d+):(\d+)\)/);
  const lineInfo = lineMatch ? `Line ${lineMatch[1]}, Column ${lineMatch[2]}` : '';

  // Extract a short summary (first line or first sentence)
  const shortMsg = errorMsg.split('\n')[0].slice(0, 200);

  return (
    <Flexbox
      gap={12}
      style={{
        background: 'rgba(15, 23, 42, 0.97)',
        inset: 0,
        overflow: 'auto',
        padding: 20,
        position: 'absolute',
        zIndex: 10,
      }}
    >
      <div style={{ color: '#f87171', fontSize: 15, fontWeight: 600 }}>Build Error</div>

      {lineInfo && <div style={{ color: '#94a3b8', fontSize: 12 }}>{lineInfo}</div>}

      <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 500 }}>{shortMsg}</div>

      <pre
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 6,
          color: '#cbd5e1',
          fontSize: 12,
          lineHeight: 1.5,
          margin: 0,
          maxHeight: 180,
          overflow: 'auto',
          padding: 12,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {errorMsg}
      </pre>

      <Flexbox gap={8} horizontal>
        <button
          onClick={copyError}
          style={{
            background: '#334155',
            border: '1px solid #475569',
            borderRadius: 6,
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            padding: '5px 12px',
          }}
        >
          {copied ? 'Copied!' : 'Copy Error'}
        </button>
        <button
          onClick={switchToCode}
          style={{
            background: '#334155',
            border: '1px solid #475569',
            borderRadius: 6,
            color: '#e2e8f0',
            cursor: 'pointer',
            fontSize: 12,
            padding: '5px 12px',
          }}
        >
          View Code
        </button>
      </Flexbox>
    </Flexbox>
  );
});

export default ErrorOverlay;
