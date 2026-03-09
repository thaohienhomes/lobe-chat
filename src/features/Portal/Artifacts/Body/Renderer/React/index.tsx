import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';
import { ArtifactDisplayMode } from '@/store/chat/slices/portal/initialState';

import { buildIframeHtml, encodeBase64 } from './buildIframeHtml';
import { escapeJsxTextContent } from './escapeJsx';

interface ReactRendererProps {
  code: string;
}

/**
 * React artifact renderer using iframe + Babel standalone.
 *
 * Replaces Sandpack to avoid CDN dependency resolution issues
 * (ERR_BLOCKED_BY_CLIENT, timeouts on Vercel preview, ad-blocker conflicts).
 *
 * Architecture:
 * 1. Pre-process JSX (escape bare > < in text content)
 * 2. Base64-encode user code (avoids HTML injection in iframe)
 * 3. Build iframe HTML with CDN libs + Babel standalone
 * 4. Babel compiles JSX/TS → require()-based JS in-browser
 * 5. Custom require() shim maps imports to CDN-loaded globals
 * 6. postMessage communicates ready/error state to parent
 */
const ReactRenderer = memo<ReactRendererProps>(({ code }) => {
  const title = useChatStore(chatPortalSelectors.artifactTitle) || 'Artifact';
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Debounce code updates during streaming (avoid iframe thrashing)
  const [debouncedCode, setDebouncedCode] = useState(code);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCode(code), 350);
    return () => clearTimeout(timer);
  }, [code]);

  // Pre-process and build iframe HTML
  const processedCode = useMemo(() => escapeJsxTextContent(debouncedCode), [debouncedCode]);
  const encodedCode = useMemo(() => encodeBase64(processedCode), [processedCode]);

  const blobUrl = useMemo(() => {
    const html = buildIframeHtml(encodedCode, title);
    const blob = new Blob([html], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [encodedCode, title]);

  // Cleanup blob URL
  useEffect(() => {
    return () => URL.revokeObjectURL(blobUrl);
  }, [blobUrl]);

  // Listen for postMessage from iframe (ready / error)
  useEffect(() => {
    setError(null);
    setLoading(true);

    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'artifact-ready') {
        setLoading(false);
        setError(null);
      } else if (e.data.type === 'artifact-error') {
        setLoading(false);
        setError(e.data.message || 'Unknown error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [blobUrl]);

  // Fallback: if no message received within 15s, hide loading
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 15_000);
    return () => clearTimeout(timer);
  }, [loading, blobUrl]);

  const switchToCode = useCallback(() => {
    useChatStore.setState(
      { portalArtifactDisplayMode: ArtifactDisplayMode.Code },
      false,
      'switchToCodeFromError',
    );
  }, []);

  const copyError = useCallback(() => {
    if (error) {
      navigator.clipboard.writeText(error);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [error]);

  return (
    <div style={{ background: '#0f172a', height: '100%', position: 'relative', width: '100%' }}>
      {/* Loading overlay */}
      {loading && !error && (
        <Flexbox
          align={'center'}
          gap={12}
          justify={'center'}
          style={{
            background: '#0f172a',
            inset: 0,
            position: 'absolute',
            zIndex: 5,
          }}
        >
          <div
            style={{
              animation: '_sp-spin 1s linear infinite',
              border: '2px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '50%',
              borderTopColor: '#60a5fa',
              height: 28,
              width: 28,
            }}
          />
          <div style={{ color: '#94a3b8', fontSize: 13 }}>Building preview…</div>
          <style>{'@keyframes _sp-spin { to { transform: rotate(360deg) } }'}</style>
        </Flexbox>
      )}

      {/* Error overlay */}
      {error && (
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
          <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 500 }}>
            {error.split('\n')[0].slice(0, 200)}
          </div>
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
            {error}
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
      )}

      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        src={blobUrl}
        style={{ border: 'none', height: '100%', width: '100%' }}
        title="react-artifact"
      />
    </div>
  );
});

export default ReactRenderer;
