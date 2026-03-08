import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

interface ComparisonSliderProps {
  /** Alt text for the "after" image */
  afterAlt?: string;
  /** Label for the "after" side */
  afterLabel?: string;
  /** URL of the "after" image */
  afterSrc: string;
  /** Alt text for the "before" image */
  beforeAlt?: string;
  /** Label for the "before" side */
  beforeLabel?: string;
  /** URL of the "before" image */
  beforeSrc: string;
  /** Initial slider position as percentage (0-100), default 50 */
  initialPosition?: number;
}

/**
 * ComparisonSlider — before/after image comparison with a draggable divider.
 * Supports mouse drag, touch drag, and keyboard arrow keys.
 */
const ComparisonSlider = memo<ComparisonSliderProps>(
  ({
    beforeSrc,
    afterSrc,
    beforeAlt = 'Before',
    afterAlt = 'After',
    beforeLabel = 'Before',
    afterLabel = 'After',
    initialPosition = 50,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState(initialPosition);
    const [isDragging, setIsDragging] = useState(false);

    const updatePosition = useCallback((clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(pct);
    }, []);

    // Mouse events
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        updatePosition(e.clientX);
      },
      [updatePosition],
    );

    useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        updatePosition(e.clientX);
      };
      const handleMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDragging, updatePosition]);

    // Touch events
    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        setIsDragging(true);
        updatePosition(e.touches[0].clientX);
      },
      [updatePosition],
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        if (!isDragging) return;
        updatePosition(e.touches[0].clientX);
      },
      [isDragging, updatePosition],
    );

    const handleTouchEnd = useCallback(() => {
      setIsDragging(false);
    }, []);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPosition((prev) => Math.max(0, prev - step));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPosition((prev) => Math.min(100, prev + step));
      }
    }, []);

    return (
      <div
        aria-label="Before and after comparison slider"
        className="relative w-full overflow-hidden rounded-xl bg-[#0F172A] select-none"
        onMouseDown={handleMouseDown}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchStart}
        ref={containerRef}
        role="region"
        style={{ cursor: isDragging ? 'ew-resize' : 'default' }}
      >
        {/* After image (full width, bottom layer) */}
        <img
          alt={afterAlt}
          className="block h-auto w-full"
          draggable={false}
          src={afterSrc}
        />

        {/* Before image (clipped to slider position) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${position}%` }}
        >
          <img
            alt={beforeAlt}
            className="block h-auto min-w-full"
            draggable={false}
            src={beforeSrc}
            style={{ width: containerRef.current?.offsetWidth ?? '100%' }}
          />
        </div>

        {/* Divider line */}
        <div
          className="absolute top-0 bottom-0 z-10 w-0.5 bg-white/80 shadow-lg"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        >
          {/* Drag handle */}
          <div
            aria-label="Drag to compare"
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(position)}
            className={[
              'absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2',
              'flex h-10 w-10 items-center justify-center rounded-full',
              'bg-slate-900/90 shadow-xl ring-2 ring-white/60',
              'transition-transform duration-150',
              'hover:scale-110',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-500',
            ].join(' ')}
            onKeyDown={handleKeyDown}
            role="slider"
            tabIndex={0}
          >
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M8 6l-4 6 4 6M16 6l4 6-4 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="pointer-events-none absolute top-3 left-3 z-10 rounded bg-slate-900/70 px-2 py-0.5 text-xs font-medium text-slate-300 backdrop-blur-sm">
          {beforeLabel}
        </div>
        <div className="pointer-events-none absolute top-3 right-3 z-10 rounded bg-slate-900/70 px-2 py-0.5 text-xs font-medium text-slate-300 backdrop-blur-sm">
          {afterLabel}
        </div>
      </div>
    );
  },
);

ComparisonSlider.displayName = 'ComparisonSlider';

export default ComparisonSlider;
