'use client';

import { ActionIcon, Icon } from '@lobehub/ui';
import { Dropdown, type MenuProps, message } from 'antd';
import { createStyles } from 'antd-style';
import { CopyIcon, DownloadIcon, MoreHorizontalIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { generateCompleteHTML, type ShellThemeVars } from './shellHTML';
import LoadingOverlay from './LoadingOverlay';

const MIN_HEIGHT = 100;
const DEFAULT_HEIGHT = 200;
const MAX_CHART_HEIGHT = 600;
const HEIGHT_TIMEOUT_MS = 10_000;
const STREAMING_DEBOUNCE_MS = 200;

/** Convert a snake_case or lowercase title to Title Case */
const toTitleCase = (s: string): string =>
  s
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Strip all <script>...</script> blocks (including inline) from HTML. */
const stripScripts = (html: string): string =>
  html.replace(/<script[\s\S]*?<\/script>/gi, '');

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
  `,
  iframe: css`
    display: block;
    width: 100%;
    border: none;
    border-radius: 0 0 12px 12px;
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
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [iframeHeight, setIframeHeight] = useState(DEFAULT_HEIGHT);
    const [iframeReady, setIframeReady] = useState(false);

    // ── Debounce widgetCode during streaming ──────────────────────────────────
    const debouncedCode = useDebouncedValue(widgetCode, STREAMING_DEBOUNCE_MS, isStreaming);

    // ── Build srcdoc: strip scripts while streaming ──────────────────────────
    const srcdoc = useMemo(() => {
      if (!debouncedCode) return '';
      const code = isStreaming ? stripScripts(debouncedCode) : debouncedCode;
      return generateCompleteHTML(theme, code);
    }, [theme, debouncedCode, isStreaming]);

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
            void message.success(`Downloaded as .${ext}`);
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

    // ── Toolbar handlers ─────────────────────────────────────────────────────
    const handleCopyCode = useCallback(() => {
      navigator.clipboard.writeText(widgetCode).then(
        () => void message.success('Copied code to clipboard'),
        () => void message.error('Failed to copy'),
      );
    }, [widgetCode]);

    const handleDownload = useCallback(() => {
      postToIframe({ type: 'exportContent', title });
    }, [postToIframe, title]);

    const toolbarMenuItems: MenuProps['items'] = useMemo(
      () => [
        {
          icon: <Icon icon={CopyIcon} size={'small'} />,
          key: 'copy',
          label: 'Copy Code',
          onClick: handleCopyCode,
        },
        {
          icon: <Icon icon={DownloadIcon} size={'small'} />,
          key: 'download',
          label: 'Download',
          onClick: handleDownload,
        },
      ],
      [handleCopyCode, handleDownload],
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
                ● Generating…
              </span>
            )}
            {!isStreaming && (
              <Dropdown menu={{ items: toolbarMenuItems }} placement="bottomRight" trigger={['click']}>
                <ActionIcon
                  className={styles.toolbarTrigger}
                  icon={MoreHorizontalIcon}
                  size={'small'}
                  title="Actions"
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

