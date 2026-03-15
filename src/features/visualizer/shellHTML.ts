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
      background: var(--color-bg);
      color: var(--color-text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      overflow: hidden;
      line-height: 1.5;
    }

    /* ── Dark-mode overrides ─────────────────────────────────────────────
     * AI-generated widget code may use hardcoded colors that blend with
     * dark backgrounds. These overrides ensure readability in ALL cases.
     * ────────────────────────────────────────────────────────────────── */

    /* Ensure SVG text and axis labels use theme text color */
    svg text, svg .tick text, svg .label {
      fill: var(--color-text) !important;
    }
    /* Grid lines, axes, and chart borders in SVG */
    svg line, svg .grid line, svg .domain, svg .axis line, svg .axis path {
      stroke: var(--color-border) !important;
    }
    /* Radar chart and polar grids */
    svg circle.grid, svg polygon.grid, svg .gridline {
      stroke: var(--color-border) !important;
      fill: none !important;
    }

    /* Table styling for dark mode */
    table { border-color: var(--color-border); }
    th, td {
      border-color: var(--color-border) !important;
      color: var(--color-text);
    }
    th { background: var(--color-surface) !important; }

    /* Ensure input/select elements are readable */
    input, select, textarea {
      color: var(--color-text);
      background: var(--color-surface);
      border-color: var(--color-border);
    }

    /* Default button styling for dark mode */
    button {
      color: var(--color-text);
      border-color: var(--color-border);
    }

    /* Active/selected buttons: force dark text on light (accent) backgrounds.
     * AI-generated widget code often uses color:#fff for active buttons,
     * which is invisible when --color-accent is white/light. We override with
     * --color-bg (which is dark in dark mode) for maximum contrast. */
    button.active,
    button[aria-selected="true"],
    button[data-active],
    button[data-state="active"],
    button.selected,
    button.btn-primary,
    .tab-btn.active,
    .tab-button.active,
    [role="tab"][aria-selected="true"],
    [role="tab"].active {
      color: var(--color-bg) !important;
    }

    /* Inactive/non-selected buttons: transparent bg so they blend with theme */
    button:not(.active):not([aria-selected="true"]):not(.selected):not(.btn-primary):not([data-active]):not([data-state="active"]) {
      background: transparent;
    }

    /* Progress bars / tracks */
    progress { accent-color: var(--color-accent); }
    .progress-track, [class*="track"], [class*="bg-gray"] {
      background: var(--color-surface) !important;
    }

    /* Links */
    a { color: var(--color-accent); }

    /* Headings and strong text inherit theme color */
    h1, h2, h3, h4, h5, h6, strong, b {
      color: var(--color-text);
    }

    /* Canvas-based charts: ensure container has correct bg */
    canvas { display: block; }
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
