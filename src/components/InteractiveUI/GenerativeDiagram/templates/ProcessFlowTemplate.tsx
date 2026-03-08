import React, { memo, useCallback, useState } from 'react';

import type { AnimationStep, DiagramEdge, DiagramNode } from '../types';

interface ProcessFlowTemplateProps {
  activeStep?: AnimationStep | null;
  edges: DiagramEdge[];
  nodes: DiagramNode[];
  onNodeClick?: (node: DiagramNode) => void;
}

/**
 * ProcessFlowTemplate — renders a step-by-step process/flow diagram.
 * Nodes are connected by directed edges (arrows).
 * When an animation step is active, highlighted nodes/edges are emphasized.
 */
const ProcessFlowTemplate = memo<ProcessFlowTemplateProps>(
  ({ nodes, edges, onNodeClick, activeStep }) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

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
        aria-label="Process flow diagram"
        className="h-full w-full"
        role="img"
        viewBox="0 0 100 100"
      >
        <defs>
          <marker
            id="arrowhead"
            markerHeight={5}
            markerWidth={5}
            orient="auto"
            refX={4}
            refY={2.5}
          >
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#94a3b8" />
          </marker>
          <marker
            id="arrowhead-active"
            markerHeight={5}
            markerWidth={5}
            orient="auto"
            refX={4}
            refY={2.5}
          >
            <path d="M0,0 L5,2.5 L0,5 Z" fill="#38bdf8" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge) => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;

          const isHighlighted = activeStep?.highlightEdges?.includes(edge.id);

          return (
            <g key={edge.id}>
              <line
                markerEnd={isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                stroke={isHighlighted ? '#38bdf8' : edge.color || '#94a3b8'}
                strokeDasharray={isHighlighted ? undefined : '1,0.5'}
                strokeOpacity={isHighlighted ? 1 : 0.5}
                strokeWidth={isHighlighted ? 0.5 : 0.3}
                x1={fromNode.position.x}
                x2={toNode.position.x}
                y1={fromNode.position.y}
                y2={toNode.position.y}
              />
              {edge.label && (
                <text
                  className="pointer-events-none select-none"
                  dominantBaseline="central"
                  fill="#94a3b8"
                  fontSize={2}
                  textAnchor="middle"
                  x={(fromNode.position.x + toNode.position.x) / 2}
                  y={(fromNode.position.y + toNode.position.y) / 2 - 1.5}
                >
                  {edge.label}
                </text>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isHighlighted = activeStep?.highlightNodes?.includes(node.id);
          const isHovered = hoveredId === node.id;
          const w = node.size?.width ?? 16;
          const h = node.size?.height ?? 8;

          return (
            <g
              aria-label={node.label}
              className="cursor-pointer"
              key={node.id}
              onClick={() => onNodeClick?.(node)}
              onKeyDown={(e) => handleKeyDown(e, node)}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              role="button"
              tabIndex={0}
            >
              <rect
                fill={node.color}
                fillOpacity={isHighlighted ? 0.35 : isHovered ? 0.2 : 0.12}
                height={h}
                rx={2}
                ry={2}
                stroke={isHighlighted ? '#38bdf8' : node.color}
                strokeOpacity={isHighlighted ? 1 : isHovered ? 0.7 : 0.4}
                strokeWidth={isHighlighted ? 0.5 : 0.3}
                width={w}
                x={node.position.x - w / 2}
                y={node.position.y - h / 2}
              />
              <text
                className="pointer-events-none select-none"
                dominantBaseline="central"
                fill={isHighlighted ? '#f0f9ff' : '#e2e8f0'}
                fontSize={2.5}
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

ProcessFlowTemplate.displayName = 'ProcessFlowTemplate';

export default ProcessFlowTemplate;
