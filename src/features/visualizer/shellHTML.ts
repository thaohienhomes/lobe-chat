import { CDN_ALLOWLIST, MORPHDOM_CDN_URL, STYLE_CDN_ALLOWLIST } from './constants';

export interface ShellThemeVars {
  accent: string;
  bg: string;
  border: string;
  surface: string;
  text: string;
  textSecondary: string;
}

/**
 * Generates the shell HTML that loads once inside the sandboxed iframe.
 *
 * Contains:
 * 1. CSP meta tag restricting script-src to CDN allowlist
 * 2. CSS reset + theme variables injected from parent
 * 3. _fadeIn keyframe animation for new DOM nodes
 * 4. morphdom loaded async from CDN for streaming DOM diff
 * 5. _setContent(html) — morphdom-based DOM diff with buffer
 * 6. _runScripts() — clone script tags to force execution
 * 7. ResizeObserver reporting content height to parent
 * 8. sendPrompt() / sendData() postMessage bridges
 * 9. message listener for setContent, runScripts, updateTheme
 *
 * Critical design decisions (from reverse-engineering Claude.ai):
 * - morphdom loaded async; _setContent buffers until ready
 * - onBeforeElUpdated: skip if isEqualNode (preserve unchanged DOM)
 * - onNodeAdded: apply _fadeIn animation to new elements
 * - _runScripts: clone script tags to force execution (innerHTML scripts are inert)
 * - ResizeObserver on <body> reports height changes to parent
 */
export function generateShellHTML(theme: ShellThemeVars): string {
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
    @keyframes _fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script src="${MORPHDOM_CDN_URL}"
    onload="window._morphReady=true;if(window._pending){window._setContent(window._pending);window._pending=null;}">
  </script>

  <script>
    window._morphReady = false;
    window._pending = null;

    // Streaming DOM diff via morphdom
    window._setContent = function(html) {
      if (!window._morphReady) { window._pending = html; return; }
      var root = document.getElementById('root');
      if (!root) return;
      var target = document.createElement('div');
      target.id = 'root';
      target.innerHTML = html;
      morphdom(root, target, {
        onBeforeElUpdated: function(from, to) {
          if (from.isEqualNode(to)) return false;
          return true;
        },
        onNodeAdded: function(node) {
          if (node.nodeType === 1) {
            node.style.animation = '_fadeIn 0.3s ease both';
          }
          return node;
        }
      });
    };

    // Execute script tags after streaming completes
    // innerHTML-inserted scripts are inert — cloning forces execution
    window._runScripts = function() {
      document.querySelectorAll('#root script').forEach(function(old) {
        var s = document.createElement('script');
        Array.from(old.attributes).forEach(function(attr) {
          s.setAttribute(attr.name, attr.value);
        });
        if (!old.src) {
          s.textContent = old.textContent;
        }
        old.parentNode.replaceChild(s, old);
      });
    };

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

    // Listen for commands from parent
    window.addEventListener('message', function(e) {
      var data = e.data;
      if (!data || typeof data.type !== 'string') return;

      switch (data.type) {
        case 'setContent':
          window._setContent(data.html);
          break;
        case 'runScripts':
          window._runScripts();
          break;
        case 'updateTheme':
          if (data.vars && typeof data.vars === 'object') {
            Object.keys(data.vars).forEach(function(k) {
              document.documentElement.style.setProperty(k, data.vars[k]);
            });
          }
          break;
      }
    });
  </script>
</body>
</html>`;
}
