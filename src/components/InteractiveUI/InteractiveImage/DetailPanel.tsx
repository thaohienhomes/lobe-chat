import { memo, useCallback, useEffect, useRef } from 'react';

import type { DetailPanelProps } from '../types';

/**
 * DetailPanel — slide-out panel displaying details for the selected region.
 * Slides in from the right with a smooth CSS transition.
 */
const DetailPanel = memo<DetailPanelProps>(({ region, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const isOpen = region !== null;

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap: focus panel when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen, region?.id]);

  const handleBackdropClick = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 bg-black/30 transition-opacity duration-300"
          onClick={handleBackdropClick}
        />
      )}

      {/* Panel */}
      <div
        aria-label={region ? `Details for ${region.label}` : undefined}
        className={[
          'absolute right-0 top-0 z-20 h-full w-72 max-w-[80%]',
          'overflow-y-auto rounded-l-lg bg-slate-900/95 shadow-2xl backdrop-blur-sm',
          'transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        {region && (
          <div className="flex flex-col gap-3 p-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: region.color }}
                />
                <h3 className="text-base font-semibold text-slate-100">
                  {region.label}
                </h3>
              </div>
              <button
                aria-label="Close detail panel"
                className="rounded p-1 text-slate-400 transition-colors duration-150 hover:bg-slate-800 hover:text-slate-200"
                onClick={onClose}
                type="button"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </button>
            </div>

            {/* Details key-value list */}
            <dl className="flex flex-col gap-2">
              {Object.entries(region.details).map(([key, value]) => (
                <div
                  className="rounded-md bg-slate-800/60 px-3 py-2"
                  key={key}
                >
                  <dt className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    {key.replaceAll('_', ' ')}
                  </dt>
                  <dd className="mt-0.5 text-sm text-slate-200">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </dd>
                </div>
              ))}
            </dl>

            {/* Bounds info */}
            <div className="mt-1 rounded-md bg-slate-800/40 px-3 py-2 text-xs text-slate-500">
              Position: ({region.bounds.x.toFixed(1)}%, {region.bounds.y.toFixed(1)}%)
              &middot; Size: {region.bounds.w.toFixed(1)}% &times; {region.bounds.h.toFixed(1)}%
            </div>
          </div>
        )}
      </div>
    </>
  );
});

DetailPanel.displayName = 'DetailPanel';

export default DetailPanel;
