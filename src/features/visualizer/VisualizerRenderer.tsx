'use client';

import { createStyles } from 'antd-style';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { generateShellHTML, type ShellThemeVars } from './shellHTML';
import LoadingOverlay from './LoadingOverlay';

const MIN_HEIGHT = 100;
const DEFAULT_HEIGHT = 200;
const HEIGHT_TIMEOUT_MS = 10_000;

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    position: relative;
    overflow: hidden;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 8px;
  `,
  iframe: css`
    display: block;
    width: 100%;
    border: none;
  `,
  titleBar: css`
    padding-block: 4px;
    padding-inline: 12px;
    font-size: 12px;
    color: ${token.colorTextQuaternary};
    border-block-end: 1px solid ${token.colorBorderSecondary};
  `,
}));

export interface VisualizerRendererProps {
  isComplete: boolean;
  isStreaming: boolean;
  loadingMessages: string[];
  onInteraction?: (data: unknown) => void;
  onSendPrompt?: (text: string) => void;
  theme: ShellThemeVars;
  title: string;
  widgetCode: string;
}

const VisualizerRenderer = memo<VisualizerRendererProps>(
  ({
    widgetCode,
    title,
    loadingMessages,
    // isStreaming is consumed by parent but kept in props interface for future use
    isStreaming: _isStreaming,
    isComplete,
    theme,
    onInteraction,
    onSendPrompt,
  }) => {
    const { styles } = useStyles();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState(DEFAULT_HEIGHT);
    const [iframeReady, setIframeReady] = useState(false);
    const pendingCodeRef = useRef<string | null>(null);
    const hasRunScriptsRef = useRef(false);

    // Generate shell HTML once per theme (memoized)
    const srcdoc = useMemo(() => generateShellHTML(theme), [theme]);

    // Show loading overlay until iframe has received first content and reported a resize
    const showLoading = !iframeReady && !isComplete;

    // ── Fallback height timeout ──────────────────────────────────────────────
    useEffect(() => {
      if (iframeReady) return;

      const timer = setTimeout(() => {
        setIframeHeight(400);
        setIframeReady(true);
      }, HEIGHT_TIMEOUT_MS);

      return () => clearTimeout(timer);
    }, [iframeReady]);

    // ── postMessage to iframe helper ─────────────────────────────────────────
    const postToIframe = useCallback((msg: Record<string, unknown>) => {
      iframeRef.current?.contentWindow?.postMessage(msg, '*');
    }, []);

    // ── Handle messages FROM iframe ──────────────────────────────────────────
    useEffect(() => {
      const handleMessage = (e: MessageEvent) => {
        if (e.source !== iframeRef.current?.contentWindow) return;

        const { type } = e.data || {};
        if (typeof type !== 'string') return;

        switch (type) {
          case 'resize': {
            const h = Number(e.data.height);
            if (h > 0) {
              setIframeHeight(Math.max(h, MIN_HEIGHT));
              setIframeReady(true);
            }
            break;
          }
          case 'sendPrompt': {
            if (typeof e.data.text === 'string') {
              onSendPrompt?.(e.data.text);
            }
            break;
          }
          case 'widgetData': {
            onInteraction?.(e.data.data);
            break;
          }
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [onSendPrompt, onInteraction]);

    // ── On iframe load: flush any pending content ────────────────────────────
    const handleIframeLoad = useCallback(() => {
      if (pendingCodeRef.current) {
        postToIframe({ html: pendingCodeRef.current, type: 'setContent' });
        pendingCodeRef.current = null;
      }
    }, [postToIframe]);

    // ── Send widgetCode to iframe on change (streaming updates) ──────────────
    useEffect(() => {
      if (!widgetCode) return;

      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) {
        // iframe not mounted yet — buffer
        pendingCodeRef.current = widgetCode;
        return;
      }

      postToIframe({ html: widgetCode, type: 'setContent' });
    }, [widgetCode, postToIframe]);

    // ── When streaming completes, execute scripts ────────────────────────────
    useEffect(() => {
      if (!isComplete || hasRunScriptsRef.current) return;

      // Send final content + runScripts
      if (widgetCode) {
        postToIframe({ html: widgetCode, type: 'setContent' });
      }
      postToIframe({ type: 'runScripts' });
      hasRunScriptsRef.current = true;
    }, [isComplete, widgetCode, postToIframe]);

    // ── Theme updates without iframe reload ──────────────────────────────────
    const prevThemeRef = useRef(theme);
    useEffect(() => {
      if (prevThemeRef.current === theme) return;
      prevThemeRef.current = theme;

      postToIframe({
        type: 'updateTheme',
        vars: {
          '--color-accent': theme.accent,
          '--color-bg': theme.bg,
          '--color-border': theme.border,
          '--color-surface': theme.surface,
          '--color-text': theme.text,
          '--color-text-secondary': theme.textSecondary,
        },
      });
    }, [theme, postToIframe]);

    return (
      <Flexbox className={styles.container} width="100%">
        {title && <div className={styles.titleBar}>{title.replaceAll('_', ' ')}</div>}
        <div style={{ minHeight: MIN_HEIGHT, position: 'relative' }}>
          {showLoading && <LoadingOverlay messages={loadingMessages} />}
          <iframe
            className={styles.iframe}
            onLoad={handleIframeLoad}
            ref={iframeRef}
            referrerPolicy="no-referrer"
            sandbox="allow-scripts"
            srcDoc={srcdoc}
            style={{ height: iframeHeight }}
            title={`visualizer-${title}`}
          />
        </div>
      </Flexbox>
    );
  },
);

VisualizerRenderer.displayName = 'VisualizerRenderer';

export default VisualizerRenderer;
