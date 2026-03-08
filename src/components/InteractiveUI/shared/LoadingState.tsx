import { memo } from 'react';

interface LoadingStateProps {
  /** Optional message shown below the skeleton */
  message?: string;
}

/**
 * LoadingState — skeleton placeholder shown while Vision AI processes an image.
 * Displays a pulsing image skeleton with animated hotspot placeholders.
 */
const LoadingState = memo<LoadingStateProps>(
  ({ message = 'Analyzing image...' }) => {
    return (
      <div
        aria-busy="true"
        aria-label={message}
        className="flex w-full flex-col gap-2 rounded-xl bg-[#0F172A] p-2"
        role="status"
      >
        {/* Image skeleton */}
        <div className="relative w-full overflow-hidden rounded-lg bg-slate-900">
          {/* Aspect ratio container */}
          <div className="aspect-video w-full animate-pulse bg-slate-800/60" />

          {/* Fake hotspot skeletons */}
          <div className="absolute inset-0">
            <div className="absolute left-[10%] top-[15%] h-[20%] w-[25%] animate-pulse rounded-md border border-slate-700/40 bg-slate-700/20" />
            <div
              className="absolute left-[45%] top-[30%] h-[25%] w-[30%] animate-pulse rounded-md border border-slate-700/40 bg-slate-700/20"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="absolute left-[20%] top-[60%] h-[18%] w-[35%] animate-pulse rounded-md border border-slate-700/40 bg-slate-700/20"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="flex gap-2 px-1">
          {[1, 2, 3].map((i) => (
            <div
              className="h-6 animate-pulse rounded-md bg-slate-800/60"
              key={i}
              style={{
                animationDelay: `${i * 100}ms`,
                width: `${60 + i * 15}px`,
              }}
            />
          ))}
        </div>

        {/* Loading message */}
        <div className="flex items-center justify-center gap-2 py-2">
          {/* Spinner */}
          <svg
            className="h-4 w-4 animate-spin text-sky-500"
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
          <span className="text-xs text-slate-400">{message}</span>
        </div>
      </div>
    );
  },
);

LoadingState.displayName = 'LoadingState';

export default LoadingState;
