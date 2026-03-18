'use client';

import { ActionIcon, Icon } from '@lobehub/ui';
import { Dropdown, type MenuProps, message } from 'antd';
import { createStyles } from 'antd-style';
import { CopyIcon, DownloadIcon, MoreHorizontalIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { generateCompleteHTML, generateStreamingShell, type ShellThemeVars } from './shellHTML';
import LoadingOverlay from './LoadingOverlay';

const MIN_HEIGHT = 100;
const DEFAULT_HEIGHT = 200;
const MAX_CHART_HEIGHT = 600;
const HEIGHT_TIMEOUT_MS = 10_000;
const STREAMING_DEBOUNCE_MS = 150;

/** Convert a snake_case or lowercase title to Title Case */
const toTitleCase = (s: string): string =>
  s
    .replaceAll('_', ' ')
    .replaceAll(/\b\w/g, (c) => c.toUpperCase());

/** Strip all <script>...</script> blocks (including inline) from HTML. */
const stripScripts = (html: string): string =>
  html.replaceAll(/<script[\S\s]*?<\/script>/gi, '');

/**
 * Custom debounce hook: returns `value` with a delay when `enabled` is true.
 * When `enabled` is false (streaming completed), immediately returns the value.
 */
const useDebouncedValue = <T,>(value: T, delayMs: number, enabled: boolean): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (!enabled) {
      setDebounced(value);
      return;
    }
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs, enabled]);

  return debounced;
};

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    position: relative;
    overflow: hidden;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    margin-bottom: 8px;
    background: ${token.colorBgContainer};
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;
    box-shadow: 0 2px 8px ${token.colorBgTextHover};
    transition: border-color 0.3s ease;

    @media (max-width: 768px) {
      border-radius: 8px;
      margin-bottom: 4px;
    }
  `,
  iframe: css`
    display: block;
    width: 100%;
    border: none;
    border-radius: 0 0 12px 12px;

    @media (max-width: 768px) {
      border-radius: 0 0 8px 8px;
    }
  `,
  iframeWrapper: css`
    overflow-y: auto;
    max-height: ${MAX_CHART_HEIGHT}px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: ${token.colorBorderSecondary};
      border-radius: 3px;

      &:hover {
        background: ${token.colorBorder};
      }
    }

    @media (max-width: 768px) {
      max-height: 400px;
    }
  `,
  streaming: css`
    border-color: ${token.colorPrimary};
    animation: streaming-pulse 2s ease-in-out infinite;

    @keyframes streaming-pulse {
      0%,
      100% {
        border-color: ${token.colorPrimary};
        box-shadow: 0 0 0 0 ${token.colorPrimaryBg};
      }
      50% {
        border-color: ${token.colorPrimaryBorderHover};
        box-shadow: 0 0 8px 2px ${token.colorPrimaryBg};
      }
    }
  `,
  streamingBadge: css`
    font-size: 10px;
    font-weight: 600;
    color: ${token.colorPrimary};
    letter-spacing: 0.5px;
    text-transform: uppercase;
    opacity: 0.8;
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

    @media (max-width: 768px) {
      padding-block: 4px;
      padding-inline: 8px;
      font-size: 11px;
    }
  `,
  toolbarTrigger: css`
    margin-inline-start: auto;
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
 * Streaming mode:
 *  - Debounces widgetCode updates (200ms) to avoid iframe thrashing
 *  - Strips <script> tags to prevent partial JS execution errors
 *  - Shows streaming indicator (pulsing border + badge)
 *  - Scripts execute only when isComplete=true (streaming finished)
 */
const VisualizerRenderer = memo<VisualizerRendererProps>(
  ({
    widgetCode,
    title,
    loadingMessages,
    isStreaming,
    isComplete,
    theme,
    onInteraction,
    onSendPrompt,
  }) => {
    const { styles, cx } = useStyles();
    const { t } = useTranslation('plugin');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState(DEFAULT_HEIGHT);
    const [iframeReady, setIframeReady] = useState(false);

    // ── Debounce widgetCode during streaming ──────────────────────────────────
    const debouncedCode = useDebouncedValue(widgetCode, STREAMING_DEBOUNCE_MS, isStreaming);

    // ── Streaming shell: loaded once, content updated via postMessage ────────
    // During streaming: load the morphdom shell once → send updateContent messages
    // After streaming: keep the shell (finalized via postMessage) — no iframe reload
    // Only use generateCompleteHTML for widgets that mount as already-complete
    const streamingShell = useMemo(() => {
      return generateStreamingShell(theme);
    }, []); // stable shell - theme updates are sent via postMessage

    // Track if this widget went through a streaming phase.
    // Once streaming starts, we keep the shell for the entire lifecycle
    // to avoid an iframe reload that races with finalizeContent postMessage.
    const wasStreamingRef = useRef(false);
    if (isStreaming) wasStreamingRef.current = true;

    // Calculate the srcdoc:
    // - No code yet: empty
    // - Went through streaming (active or completed): use streaming shell
    // - Mounted as already-complete (no streaming phase): use generateCompleteHTML
    const srcdoc = useMemo(() => {
      if (!debouncedCode) return '';
      if (isStreaming || wasStreamingRef.current) return streamingShell;
      return generateCompleteHTML(theme, debouncedCode);
    }, [theme, debouncedCode, isStreaming, streamingShell]);

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

    // ── Handle messages FROM iframe (resize, sendPrompt, widgetData, export) ──
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
          case 'exportedContent': {
            // Trigger file download with exported content from iframe
            const { format, content: exportContent, title: exportTitle } = e.data;
            const ext = format === 'svg' ? 'svg' : 'html';
            const mimeType = format === 'svg' ? 'image/svg+xml' : 'text/html';
            const blob = new Blob([exportContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exportTitle || 'visualization'}.${ext}`;
            document.body.append(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            void message.success(t('visualizer.toolbar.downloadSuccess', { ext }));
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

    // ── Morphdom streaming: send content updates via postMessage ──────────────
    const prevDebouncedCodeRef = useRef<string>('');
    useEffect(() => {
      if (!isStreaming || !debouncedCode) return;
      if (prevDebouncedCodeRef.current === debouncedCode) return;
      prevDebouncedCodeRef.current = debouncedCode;

      // Strip scripts during streaming (they'll be executed on finalize)
      const code = stripScripts(debouncedCode);
      postToIframe({ html: code, type: 'updateContent' });
    }, [isStreaming, debouncedCode, postToIframe]);

    // ── Finalize: when streaming completes, send full code with scripts ───────
    const prevIsCompleteRef = useRef(isComplete);
    useEffect(() => {
      if (isComplete && !prevIsCompleteRef.current && widgetCode) {
        // Send finalizeContent — morphdom does final diff + scripts re-execute
        postToIframe({ html: widgetCode, type: 'finalizeContent' });
      }
      prevIsCompleteRef.current = isComplete;
    }, [isComplete, widgetCode, postToIframe]);

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

    // ── Toolbar handlers ─────────────────────────────────────────────────────
    const handleCopyCode = useCallback(() => {
      navigator.clipboard.writeText(widgetCode).then(
        () => void message.success(t('visualizer.toolbar.copySuccess')),
        () => void message.error(t('visualizer.toolbar.copyFailed')),
      );
    }, [widgetCode, t]);

    const handleDownload = useCallback(() => {
      postToIframe({ title, type: 'exportContent' });
    }, [postToIframe, title]);

    const toolbarMenuItems: MenuProps['items'] = useMemo(
      () => [
        {
          icon: <Icon icon={CopyIcon} size={'small'} />,
          key: 'copy',
          label: t('visualizer.toolbar.copyCode'),
          onClick: handleCopyCode,
        },
        {
          icon: <Icon icon={DownloadIcon} size={'small'} />,
          key: 'download',
          label: t('visualizer.toolbar.download'),
          onClick: handleDownload,
        },
      ],
      [handleCopyCode, handleDownload, t],
    );

    if (!srcdoc) return null;

    return (
      <Flexbox className={cx(styles.container, isStreaming && styles.streaming)} data-visualizer>
        {title && (
          <div className={styles.titleBar}>
            <span>📊</span>
            <span>{toTitleCase(title)}</span>
            {isStreaming && (
              <span className={styles.streamingBadge} style={{ marginLeft: 'auto' }}>
                ● {t('visualizer.streaming.generating')}
              </span>
            )}
            {!isStreaming && (
              <Dropdown menu={{ items: toolbarMenuItems }} placement="bottomRight" trigger={['click']}>
                <ActionIcon
                  className={styles.toolbarTrigger}
                  icon={MoreHorizontalIcon}
                  size={'small'}
                  title={t('visualizer.toolbar.actions')}
                />
              </Dropdown>
            )}
          </div>
        )}
        <div className={styles.iframeWrapper} style={{ minHeight: MIN_HEIGHT, position: 'relative' }}>
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

