import { CDN_ALLOWLIST, STYLE_CDN_ALLOWLIST } from './constants';

export interface ShellThemeVars {
  accent: string;
  bg: string;
  border: string;
  surface: string;
  text: string;
  textSecondary: string;
}

/**
 * Generates complete HTML with widget code embedded directly.
 *
 * This is the simplest possible approach:
 * - Widget code is embedded as-is inside the HTML body
 * - Scripts execute naturally during HTML parsing (CDN scripts block-load
 *   before inline scripts, so `new Chart(...)` works after `<script src="chart.js">`)
 * - No postMessage for content delivery, no morphdom, no timing issues
 * - Only uses postMessage for: resize reporting, theme updates, sendPrompt bridge
 */
export function generateCompleteHTML(theme: ShellThemeVars, widgetCode: string): string {
  const scriptSrc = CDN_ALLOWLIST.join('\n      ');
  const styleSrc = STYLE_CDN_ALLOWLIST.join('\n      ');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    script-src 'unsafe-inline' 'unsafe-eval'
      ${scriptSrc};
    style-src 'unsafe-inline'
      ${styleSrc};
    font-src https://fonts.gstatic.com;
    img-src data: blob: https:;
    connect-src https:;
  ">
  <style>
    :root {
      --color-bg: ${theme.bg};
      --color-text: ${theme.text};
      --color-text-secondary: ${theme.textSecondary};
      --color-border: ${theme.border};
      --color-accent: ${theme.accent};
      --color-surface: ${theme.surface};
    }
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: transparent;
      color: var(--color-text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      overflow: hidden;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  ${widgetCode}

  <script>
    // Bridge: send a chat message from widget to parent
    window.sendPrompt = function(text) {
      window.parent.postMessage({ type: 'sendPrompt', text: text }, '*');
    };

    // Bridge: send interaction data from widget to parent
    window.sendData = function(data) {
      window.parent.postMessage({ type: 'widgetData', data: data }, '*');
    };

    // Auto-sizing: report content height to parent on every resize
    new ResizeObserver(function(entries) {
      var height = entries[0].target.scrollHeight;
      window.parent.postMessage({ type: 'resize', height: height }, '*');
    }).observe(document.body);

    // Listen for theme updates from parent
    window.addEventListener('message', function(e) {
      var data = e.data;
      if (!data || typeof data.type !== 'string') return;
      if (data.type === 'updateTheme' && data.vars && typeof data.vars === 'object') {
        Object.keys(data.vars).forEach(function(k) {
          document.documentElement.style.setProperty(k, data.vars[k]);
        });
      }
    });
  </script>
</body>
</html>`;
}
