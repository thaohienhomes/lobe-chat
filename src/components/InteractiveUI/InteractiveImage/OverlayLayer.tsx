import React, { memo, useCallback } from 'react';

import type { InteractiveRegion, OverlayLayerProps } from '../types';

/**
 * OverlayLayer — SVG overlay with percentage-based coordinates.
 * Renders clickable/hoverable hotspot rectangles over the image.
 */
const OverlayLayer = memo<OverlayLayerProps>(
  ({ regions, activeRegionId, hoveredRegionId, onRegionClick, onRegionHover }) => {
    const handleClick = useCallback(
      (region: InteractiveRegion) => {
        onRegionClick?.(region);
      },
      [onRegionClick],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, region: InteractiveRegion) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRegionClick?.(region);
        }
      },
      [onRegionClick],
    );

    return (
      <svg
        aria-label="Interactive regions overlay"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        role="group"
        viewBox="0 0 100 100"
      >
        {regions.map((region) => {
          const isActive = activeRegionId === region.id;
          const isHovered = hoveredRegionId === region.id;
          const fillOpacity = isActive ? 0.3 : isHovered ? 0.2 : 0.1;
          const strokeOpacity = isActive ? 0.9 : isHovered ? 0.7 : 0.5;

          return (
            <g key={region.id}>
              {/* Hotspot rectangle */}
              <rect
                aria-label={`Region: ${region.label}`}
                className="cursor-pointer transition-all duration-200"
                fill={region.color}
                fillOpacity={fillOpacity}
                height={region.bounds.h}
                onClick={() => handleClick(region)}
                onFocus={() => onRegionHover?.(region)}
                onKeyDown={(e) => handleKeyDown(e, region)}
                onMouseEnter={() => onRegionHover?.(region)}
                onMouseLeave={() => onRegionHover?.(null)}
                role="button"
                rx={0.5}
                ry={0.5}
                stroke={region.color}
                strokeOpacity={strokeOpacity}
                strokeWidth={isActive || isHovered ? 0.4 : 0.25}
                tabIndex={0}
                width={region.bounds.w}
                x={region.bounds.x}
                y={region.bounds.y}
              />

              {/* Label text */}
              <text
                className="pointer-events-none select-none"
                dominantBaseline="central"
                fill="#fff"
                fontSize={1.8}
                fontWeight={isActive ? 700 : 500}
                textAnchor="middle"
                x={region.bounds.x + region.bounds.w / 2}
                y={region.bounds.y + region.bounds.h / 2}
              >
                <tspan
                  dy={0}
                  filter="url(#textShadow)"
                >
                  {region.label}
                </tspan>
              </text>
            </g>
          );
        })}

        {/* Text shadow filter for readability */}
        <defs>
          <filter height="140%" id="textShadow" width="140%" x="-20%" y="-20%">
            <feDropShadow dx={0} dy={0} floodColor="#000" floodOpacity={0.8} stdDeviation={0.4} />
          </filter>
        </defs>
      </svg>
    );
  },
);

OverlayLayer.displayName = 'OverlayLayer';

export default OverlayLayer;
