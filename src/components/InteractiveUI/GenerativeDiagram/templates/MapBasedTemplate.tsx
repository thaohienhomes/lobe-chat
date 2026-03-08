import React, { memo, useCallback, useState } from 'react';

import type { DiagramNode } from '../types';

interface MapBasedTemplateProps {
  nodes: DiagramNode[];
  onNodeClick?: (node: DiagramNode) => void;
}

/**
 * MapBasedTemplate — geographic-style diagram with positioned data points.
 * Renders nodes as interactive markers on an SVG canvas with a grid background.
 * For full map functionality, use Leaflet/Mapbox (Phase 3+).
 */
const MapBasedTemplate = memo<MapBasedTemplateProps>(({ nodes, onNodeClick }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  const handleClick = useCallback(
    (node: DiagramNode) => {
      setSelectedId((prev) => (prev === node.id ? null : node.id));
      onNodeClick?.(node);
    },
    [onNodeClick],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, node: DiagramNode) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick(node);
      }
    },
    [handleClick],
  );

  return (
    <div className="relative w-full">
      <svg
        aria-label="Map-based diagram"
        className="h-full w-full"
        role="img"
        viewBox="0 0 100 100"
      >
        {/* Grid background */}
        <defs>
          <pattern height={10} id="grid" patternUnits="userSpaceOnUse" width={10}>
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#334155" strokeOpacity={0.3} strokeWidth={0.2} />
          </pattern>
        </defs>
        <rect fill="url(#grid)" height={100} width={100} />

        {/* Markers */}
        {nodes.map((node) => {
          const isHovered = hoveredId === node.id;
          const isSelected = selectedId === node.id;
          const radius = isSelected ? 3 : isHovered ? 2.5 : 2;

          return (
            <g
              aria-label={node.label}
              className="cursor-pointer"
              key={node.id}
              onClick={() => handleClick(node)}
              onKeyDown={(e) => handleKeyDown(e, node)}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              role="button"
              tabIndex={0}
            >
              {/* Pulse ring */}
              {isSelected && (
                <circle
                  cx={node.position.x}
                  cy={node.position.y}
                  fill="none"
                  r={radius + 2}
                  stroke={node.color}
                  strokeOpacity={0.3}
                  strokeWidth={0.3}
                >
                  <animate attributeName="r" dur="1.5s" from={radius} repeatCount="indefinite" to={radius + 4} />
                  <animate attributeName="stroke-opacity" dur="1.5s" from={0.4} repeatCount="indefinite" to={0} />
                </circle>
              )}
              {/* Main marker */}
              <circle
                cx={node.position.x}
                cy={node.position.y}
                fill={node.color}
                fillOpacity={isSelected ? 0.8 : isHovered ? 0.6 : 0.4}
                r={radius}
                stroke={node.color}
                strokeWidth={0.3}
              />
              {/* Label */}
              <text
                className="pointer-events-none select-none"
                dominantBaseline="hanging"
                fill="#e2e8f0"
                fontSize={2.2}
                textAnchor="middle"
                x={node.position.x}
                y={node.position.y + radius + 1}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Info card for selected node */}
      {selectedNode && (
        <div className="absolute bottom-2 left-2 right-2 rounded-lg border border-slate-700/50 bg-slate-800/90 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: selectedNode.color }}
            />
            <span className="text-sm font-medium text-slate-200">{selectedNode.label}</span>
          </div>
          {selectedNode.description && (
            <p className="mt-1 text-xs text-slate-400">{selectedNode.description}</p>
          )}
        </div>
      )}
    </div>
  );
});

MapBasedTemplate.displayName = 'MapBasedTemplate';

export default MapBasedTemplate;
