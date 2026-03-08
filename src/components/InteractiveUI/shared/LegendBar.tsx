import { memo, useCallback } from 'react';

import type { InteractiveRegion, LegendBarProps } from '../types';

/**
 * LegendBar — color-coded label list for all detected regions.
 * Clicking a legend item triggers onItemClick (e.g. to highlight the region).
 */
const LegendBar = memo<LegendBarProps>(({ regions, onItemClick }) => {
  const handleClick = useCallback(
    (region: InteractiveRegion) => {
      onItemClick?.(region);
    },
    [onItemClick],
  );

  if (regions.length === 0) return null;

  return (
    <div
      aria-label="Image region legend"
      className="flex flex-wrap gap-1.5 rounded-lg bg-slate-900/80 px-3 py-2"
      role="list"
    >
      {regions.map((region) => (
        <button
          aria-label={`Region: ${region.label}`}
          className={[
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1',
            'text-xs text-slate-300 transition-all duration-200',
            'hover:bg-slate-800 hover:text-slate-100',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
            'active:scale-95',
          ].join(' ')}
          key={region.id}
          onClick={() => handleClick(region)}
          role="listitem"
          type="button"
        >
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: region.color }}
          />
          <span className="truncate">{region.label}</span>
        </button>
      ))}
    </div>
  );
});

LegendBar.displayName = 'LegendBar';

export default LegendBar;
