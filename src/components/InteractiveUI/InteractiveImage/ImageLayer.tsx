import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

interface ImageLayerProps {
  alt?: string;
  children?: React.ReactNode;
  src: string;
}

/**
 * ImageLayer — displays the base image with zoom/pan support.
 * Supports pinch-to-zoom on mobile and scroll-wheel zoom on desktop.
 */
const ImageLayer = memo<ImageLayerProps>(({ src, alt = '', children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const lastTranslate = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);

  const clampTranslate = useCallback(
    (tx: number, ty: number, s: number) => {
      if (s <= 1) return { x: 0, y: 0 };
      const container = containerRef.current;
      if (!container) return { x: tx, y: ty };
      const rect = container.getBoundingClientRect();
      const maxX = ((s - 1) * rect.width) / 2;
      const maxY = ((s - 1) * rect.height) / 2;
      return {
        x: Math.max(-maxX, Math.min(maxX, tx)),
        y: Math.max(-maxY, Math.min(maxY, ty)),
      };
    },
    [],
  );

  // Wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      setScale((prev) => {
        const next = Math.max(1, Math.min(5, prev - e.deltaY * 0.002));
        if (next <= 1) setTranslate({ x: 0, y: 0 });
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Mouse pan
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale <= 1) return;
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
      lastTranslate.current = translate;
    },
    [scale, translate],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setTranslate(
        clampTranslate(lastTranslate.current.x + dx, lastTranslate.current.y + dy, scale),
      );
    },
    [isPanning, scale, clampTranslate],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch: pinch-to-zoom + pan
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist.current = Math.hypot(dx, dy);
      } else if (e.touches.length === 1 && scale > 1) {
        setIsPanning(true);
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        lastTranslate.current = translate;
      }
    },
    [scale, translate],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && lastPinchDist.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const ratio = dist / lastPinchDist.current;
        lastPinchDist.current = dist;
        setScale((prev) => {
          const next = Math.max(1, Math.min(5, prev * ratio));
          if (next <= 1) setTranslate({ x: 0, y: 0 });
          return next;
        });
      } else if (e.touches.length === 1 && isPanning) {
        const dx = e.touches[0].clientX - panStart.current.x;
        const dy = e.touches[0].clientY - panStart.current.y;
        setTranslate(
          clampTranslate(lastTranslate.current.x + dx, lastTranslate.current.y + dy, scale),
        );
      }
    },
    [isPanning, scale, clampTranslate],
  );

  const handleTouchEnd = useCallback(() => {
    lastPinchDist.current = null;
    setIsPanning(false);
  }, []);

  // Double-click/tap to reset zoom
  const handleDoubleClick = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  return (
    <div
      aria-label={alt || 'Interactive image'}
      className="relative w-full overflow-hidden rounded-lg bg-slate-950 select-none"
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      ref={containerRef}
      role="img"
      style={{ cursor: isPanning ? 'grabbing' : scale > 1 ? 'grab' : 'default' }}
    >
      <div
        className="relative w-full transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <img
          alt={alt}
          className="block h-auto w-full"
          draggable={false}
          src={src}
        />
        {/* Overlay and other layers are rendered on top of the image */}
        {children}
      </div>

      {/* Zoom indicator */}
      {scale > 1 && (
        <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-slate-800/80 px-2 py-1 text-xs text-slate-300">
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
});

ImageLayer.displayName = 'ImageLayer';

export default ImageLayer;
