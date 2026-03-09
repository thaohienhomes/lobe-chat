import React, { memo, useState } from 'react';

import ComparisonSlider from '../shared/ComparisonSlider';
import LoadingState from '../shared/LoadingState';

import type { BeforeAfterViewProps, RenderStyle } from '@/services/ai-rendering/types';

const RENDER_STYLES: { label: string; value: RenderStyle }[] = [
  { label: 'Modern', value: 'modern' },
  { label: 'Minimalist', value: 'minimalist' },
  { label: 'Scandinavian', value: 'scandinavian' },
  { label: 'Mid-Century', value: 'mid-century-modern' },
  { label: 'Industrial', value: 'industrial' },
  { label: 'Japandi', value: 'japandi' },
  { label: 'Rustic', value: 'rustic' },
  { label: 'Contemporary', value: 'contemporary' },
  { label: 'Traditional', value: 'traditional' },
];

/**
 * BeforeAfterView — wraps ComparisonSlider with loading state
 * and an AI render trigger button.
 *
 * Phase 3: AI Rendering & Virtual Staging
 */
const BeforeAfterView = memo<BeforeAfterViewProps>(
  ({
    afterAlt = 'AI Rendered',
    afterLabel = 'After',
    afterSrc,
    beforeAlt = 'Original',
    beforeLabel = 'Before',
    beforeSrc,
    onRender,
    renderStyle: controlledStyle,
  }) => {
    const [selectedStyle, setSelectedStyle] = useState<RenderStyle>(controlledStyle ?? 'modern');
    const [isRendering, setIsRendering] = useState(false);

    const activeStyle = controlledStyle ?? selectedStyle;

    const handleRender = () => {
      if (!onRender) return;
      setIsRendering(true);
      onRender(activeStyle);
    };

    // Reset rendering state when afterSrc changes (render complete)
    React.useEffect(() => {
      if (afterSrc) {
        setIsRendering(false);
      }
    }, [afterSrc]);

    return (
      <div
        aria-label="Before and after AI rendering view"
        className="flex w-full flex-col gap-3 rounded-xl bg-[#0F172A] p-3"
        role="region"
      >
        {/* Comparison or Loading */}
        {isRendering && !afterSrc ? (
          <LoadingState message="Generating AI render..." />
        ) : afterSrc ? (
          <ComparisonSlider
            afterAlt={afterAlt}
            afterLabel={afterLabel}
            afterSrc={afterSrc}
            beforeAlt={beforeAlt}
            beforeLabel={beforeLabel}
            beforeSrc={beforeSrc}
          />
        ) : (
          <div className="relative w-full overflow-hidden rounded-lg">
            <img
              alt={beforeAlt}
              className="block h-auto w-full rounded-lg"
              src={beforeSrc}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40">
              <span className="rounded-lg bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
                Select a style and click Render to begin
              </span>
            </div>
          </div>
        )}

        {/* Style Selector */}
        <div className="flex flex-wrap gap-1.5">
          {RENDER_STYLES.map(({ label, value }) => (
            <button
              aria-label={`Select ${label} style`}
              aria-pressed={activeStyle === value}
              className={[
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                activeStyle === value
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300',
              ].join(' ')}
              disabled={isRendering}
              key={value}
              onClick={() => setSelectedStyle(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Render Button */}
        {!afterSrc && (
          <button
            aria-label="Generate AI render"
            className={[
              'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5',
              'text-sm font-medium transition-all',
              isRendering
                ? 'cursor-not-allowed bg-slate-700 text-slate-500'
                : 'bg-sky-600 text-white hover:bg-sky-500 active:bg-sky-700',
            ].join(' ')}
            disabled={isRendering || !onRender}
            onClick={handleRender}
            type="button"
          >
            {isRendering ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx={12}
                    cy={12}
                    r={10}
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                  <path
                    className="opacity-75"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    fill="currentColor"
                  />
                </svg>
                Rendering...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
                AI Render
              </>
            )}
          </button>
        )}
      </div>
    );
  },
);

BeforeAfterView.displayName = 'BeforeAfterView';

export default BeforeAfterView;
