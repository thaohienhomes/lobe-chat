import React, { memo, useCallback, useState } from 'react';

import type { DiagramNode } from '../types';

interface StructuralTemplateProps {
  activeNodeId?: string | null;
  nodes: DiagramNode[];
  onNodeClick?: (node: DiagramNode) => void;
}

/**
 * StructuralTemplate — renders labeled parts of a system as an SVG diagram.
 * Each node is a clickable rectangle with label. Clicking shows description.
 */
const StructuralTemplate = memo<StructuralTemplateProps>(
  ({ nodes, onNodeClick, activeNodeId }) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const handleNodeClick = useCallback(
      (node: DiagramNode) => {
        onNodeClick?.(node);
      },
      [onNodeClick],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent, node: DiagramNode) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNodeClick?.(node);
        }
      },
      [onNodeClick],
    );

    return (
      <svg
        aria-label="Structural diagram"
        className="h-full w-full"
        role="img"
        viewBox="0 0 100 100"
      >
        {nodes.map((node) => {
          const isActive = activeNodeId === node.id;
          const isHovered = hoveredId === node.id;
          const w = node.size?.width ?? 18;
          const h = node.size?.height ?? 10;

          return (
            <g
              aria-label={`${node.label}${node.description ? `: ${node.description}` : ''}`}
              className="cursor-pointer"
              key={node.id}
              onClick={() => handleNodeClick(node)}
              onKeyDown={(e) => handleKeyDown(e, node)}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              role="button"
              tabIndex={0}
            >
              <rect
                fill={node.color}
                fillOpacity={isActive ? 0.4 : isHovered ? 0.25 : 0.15}
                height={h}
                rx={1.5}
                ry={1.5}
                stroke={node.color}
                strokeOpacity={isActive ? 1 : isHovered ? 0.8 : 0.5}
                strokeWidth={isActive ? 0.6 : 0.4}
                width={w}
                x={node.position.x - w / 2}
                y={node.position.y - h / 2}
              >
                <animate
                  attributeName="fill-opacity"
                  dur="200ms"
                  fill="freeze"
                  to={isActive ? 0.4 : isHovered ? 0.25 : 0.15}
                />
              </rect>
              <text
                className="pointer-events-none select-none"
                dominantBaseline="central"
                fill="#e2e8f0"
                fontSize={2.8}
                textAnchor="middle"
                x={node.position.x}
                y={node.position.y}
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  },
);

StructuralTemplate.displayName = 'StructuralTemplate';

export default StructuralTemplate;
