'use client';

import { unstableSetRender } from 'antd';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const AntdV5MonkeyPatch = () => {
  // Patch Ant Design 5 to use React 18 createRoot API
  useEffect(() => {
    unstableSetRender((node, container) => {
      const root = createRoot(container);
      root.render(node);
      return async () => {
        root.unmount();
      };
    });
  }, []);

  // Global safeguard for Range.selectNode to avoid InvalidNodeTypeError
  // Seen in Sentry as: "Failed to execute 'selectNode' on 'Range': the given Node has no parent."
  // This can be triggered by legacy clipboard fallbacks that operate on detached nodes.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof (window as any).Range === 'undefined') return;

    const w = window as any;

    // Ensure we only patch once per page load
    if (w.__phoChatRangePatched) return;

    const proto = w.Range?.prototype as Range | undefined;
    const originalSelectNode = proto && (proto as any).selectNode;

    if (!proto || typeof originalSelectNode !== 'function') return;

    w.__phoChatRangePatched = true;

    (proto as any).selectNode = function patchedSelectNode(node: Node) {
      // If the node is detached, skip selection instead of throwing and crashing the app
      if (!node || !(node as any).parentNode) {
        // eslint-disable-next-line no-console
        console.warn(
          '[pho.chat] Skipped Range.selectNode on node without parent to avoid InvalidNodeTypeError',
        );
        return;
      }

      try {
        return originalSelectNode.call(this, node);
      } catch (error) {
        // Last-resort guard: log and swallow to prevent user-visible crashes
        // eslint-disable-next-line no-console
        console.error('[pho.chat] Range.selectNode failed, ignoring to keep UI stable', error);
        return;
      }
    };
  }, []);

  return null;
};

export default AntdV5MonkeyPatch;
