'use client';

import { createStyles } from 'antd-style';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { generateCompleteHTML, type ShellThemeVars } from './shellHTML';
import LoadingOverlay from './LoadingOverlay';

const MIN_HEIGHT = 100;
const DEFAULT_HEIGHT = 200;
const HEIGHT_TIMEOUT_MS = 10_000;

/** Convert a snake_case or lowercase title to Title Case */
const toTitleCase = (s: string): string =>
  s
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    position: relative;
    overflow: hidden;

    /* Break out of the parent message bubble constraint */
    width: calc(100% + 32px);
    max-width: 680px;
    margin-inline: -16px;
    margin-bottom: 8px;

    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    box-shadow: 0 2px 8px ${token.colorBgTextHover};
  `,
  iframe: css`
    display: block;
    width: 100%;
    border: none;
    border-radius: 0 0 12px 12px;
  `,
  titleBar: css`
    display: flex;
    gap: 6px;
    align-items: center;
    padding-block: 6px;
    padding-inline: 12px;
    font-size: 12px;
    font-weight: 500;
    color: ${token.colorTextSecondary};
    background: ${token.colorFillQuaternary};
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

/**
 * Renders the Visualizer widget inside a sandboxed iframe.
 *
 * Simple approach: embed widget code directly into srcdoc HTML.
 * No postMessage for content delivery, no morphdom, no timing issues.
 * Only uses postMessage for resize reporting, theme updates, and bridges.
 */
const VisualizerRenderer = memo<VisualizerRendererProps>(
  ({
    widgetCode,
    title,
    loadingMessages,
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

    // Generate complete HTML with widget code embedded directly
    const srcdoc = useMemo(() => {
      if (!widgetCode) return '';
      return generateCompleteHTML(theme, widgetCode);
    }, [theme, widgetCode]);

    // Show loading overlay until iframe reports a resize (content rendered)
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

    // ── Handle messages FROM iframe (resize, sendPrompt, widgetData) ─────────
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

    // ── Theme updates via postMessage (for dynamic theme changes) ────────────
    const postToIframe = useCallback((msg: Record<string, unknown>) => {
      iframeRef.current?.contentWindow?.postMessage(msg, '*');
    }, []);

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

    if (!srcdoc) return null;

    return (
      <Flexbox className={styles.container}>
        {title && (
          <div className={styles.titleBar}>
            <span>📊</span>
            <span>{toTitleCase(title)}</span>
          </div>
        )}
        <div style={{ minHeight: MIN_HEIGHT, position: 'relative' }}>
          {showLoading && <LoadingOverlay messages={loadingMessages} />}
          <iframe
            className={styles.iframe}
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
