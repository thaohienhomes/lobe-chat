import React, { memo, useCallback, useState } from 'react';

import type { DiagramNode, SimulationParam } from '../types';

interface SimulationTemplateProps {
  nodes: DiagramNode[];
  onParamChange?: (params: SimulationParam[]) => void;
  params: SimulationParam[];
}

/**
 * SimulationTemplate — interactive simulation with tunable parameters.
 * Renders parameter sliders and a live-updating SVG visualization.
 */
const SimulationTemplate = memo<SimulationTemplateProps>(
  ({ params: initialParams, nodes, onParamChange }) => {
    const [params, setParams] = useState<SimulationParam[]>(initialParams);

    const handleParamChange = useCallback(
      (id: string, value: number) => {
        setParams((prev) => {
          const next = prev.map((p) => (p.id === id ? { ...p, value } : p));
          onParamChange?.(next);
          return next;
        });
      },
      [onParamChange],
    );

    // Normalize param values to 0-1 range for visualization scaling
    const paramScale = new Map(
      params.map((p) => [p.id, (p.value - p.min) / (p.max - p.min || 1)]),
    );

    return (
      <div
        aria-label="Simulation diagram"
        className="flex w-full flex-col gap-3"
        role="region"
      >
        {/* Parameter sliders */}
        <div className="flex flex-wrap gap-3 rounded-lg border border-slate-700/40 bg-slate-800/30 p-3">
          {params.map((param) => (
            <div className="flex min-w-[200px] flex-1 flex-col gap-1" key={param.id}>
              <div className="flex items-center justify-between">
                <label
                  className="text-xs font-medium text-slate-300"
                  htmlFor={`sim-param-${param.id}`}
                >
                  {param.label}
                </label>
                <span className="text-xs text-sky-400">
                  {param.value}
                  {param.unit ? ` ${param.unit}` : ''}
                </span>
              </div>
              <input
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-700 accent-sky-500"
                id={`sim-param-${param.id}`}
                max={param.max}
                min={param.min}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleParamChange(param.id, Number(e.target.value))
                }
                step={param.step}
                type="range"
                value={param.value}
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{param.min}{param.unit ? ` ${param.unit}` : ''}</span>
                <span>{param.max}{param.unit ? ` ${param.unit}` : ''}</span>
              </div>
            </div>
          ))}
        </div>

        {/* SVG visualization */}
        <svg
          aria-label="Simulation visualization"
          className="h-full w-full"
          role="img"
          viewBox="0 0 100 60"
        >
          {/* Axes */}
          <line stroke="#475569" strokeWidth={0.3} x1={10} x2={90} y1={55} y2={55} />
          <line stroke="#475569" strokeWidth={0.3} x1={10} x2={10} y1={5} y2={55} />

          {/* Grid lines */}
          {[15, 25, 35, 45].map((y) => (
            <line
              key={y}
              stroke="#334155"
              strokeDasharray="1,1"
              strokeOpacity={0.3}
              strokeWidth={0.15}
              x1={10}
              x2={90}
              y1={y}
              y2={y}
            />
          ))}

          {/* Nodes as data points, scaled by params */}
          {nodes.map((node, idx) => {
            // Scale node position by first param value for dynamic visualization
            const scale = paramScale.values().next().value ?? 0.5;
            const baseY = 55 - (node.position.y / 100) * 50;
            const scaledY = 55 - (baseY / 55) * 50 * (0.3 + scale * 0.7);
            const x = 10 + (node.position.x / 100) * 80;

            return (
              <g key={node.id}>
                {/* Connect to previous point */}
                {idx > 0 && (
                  <line
                    stroke={node.color}
                    strokeOpacity={0.5}
                    strokeWidth={0.4}
                    x1={10 + (nodes[idx - 1].position.x / 100) * 80}
                    x2={x}
                    y1={
                      55 -
                      ((55 - (nodes[idx - 1].position.y / 100) * 50) / 55) *
                        50 *
                        (0.3 + (paramScale.values().next().value ?? 0.5) * 0.7)
                    }
                    y2={scaledY}
                  />
                )}
                <circle
                  cx={x}
                  cy={scaledY}
                  fill={node.color}
                  r={1.5}
                />
                <text
                  className="pointer-events-none select-none"
                  dominantBaseline="hanging"
                  fill="#94a3b8"
                  fontSize={2}
                  textAnchor="middle"
                  x={x}
                  y={scaledY + 2.5}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  },
);

SimulationTemplate.displayName = 'SimulationTemplate';

export default SimulationTemplate;
