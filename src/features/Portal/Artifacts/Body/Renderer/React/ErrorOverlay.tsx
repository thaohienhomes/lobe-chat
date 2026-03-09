import { useSandpack } from '@codesandbox/sandpack-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { ArtifactDisplayMode } from '@/store/chat/slices/portal/initialState';

/**
 * Custom error overlay + loading state for React artifact Sandpack renderer.
 * Shows loading spinner while building, readable error on failure,
 * and smooth fade-in when preview is ready.
 * Must be rendered inside a SandpackProvider.
 */
const ErrorOverlay = memo(() => {
  const { sandpack } = useSandpack();
  const { error, status } = sandpack;
  const [copied, setCopied] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  // Fade out the loading overlay once Sandpack is running
  useEffect(() => {
    if (status === 'running' && !error) {
      // Small delay so the preview iframe has time to paint before we fade out
      const timer = setTimeout(() => setShowLoading(false), 400);
      return () => clearTimeout(timer);
    }
    if (status !== 'running') {
      setShowLoading(true);
    }
  }, [status, error]);

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

  // ── Loading state ─────────────────────────────────────────────────────
  const isLoading = status !== 'running' || showLoading;

  if (isLoading && !error) {
    return (
      <Flexbox
        align={'center'}
        gap={12}
        justify={'center'}
        style={{
          background: '#0f172a',
          inset: 0,
          opacity: showLoading ? 1 : 0,
          pointerEvents: 'none',
          position: 'absolute',
          transition: 'opacity 0.3s ease-out',
          zIndex: 5,
        }}
      >
        <div
          style={{
            animation: 'sp-spin 1s linear infinite',
            border: '2px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '50%',
            borderTopColor: '#60a5fa',
            height: 28,
            width: 28,
          }}
        />
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Building preview…</div>
        <style>{`@keyframes sp-spin { to { transform: rotate(360deg) } }`}</style>
      </Flexbox>
    );
  }

  // ── No error → hide overlay ───────────────────────────────────────────
  if (!error) return null;

  // ── Error state ───────────────────────────────────────────────────────
  const errorMsg = error.message || 'Unknown compilation error';
  const lineMatch = errorMsg.match(/\((\d+):(\d+)\)/);
  const lineInfo = lineMatch ? `Line ${lineMatch[1]}, Column ${lineMatch[2]}` : '';
  const shortMsg = errorMsg.split('\n')[0].slice(0, 200);

  return (
    <Flexbox
      gap={12}
      style={{
        background: '#0f172a',
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
          type="button"
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
          type="button"
        >
          View Code
        </button>
      </Flexbox>
    </Flexbox>
  );
});

export default ErrorOverlay;
