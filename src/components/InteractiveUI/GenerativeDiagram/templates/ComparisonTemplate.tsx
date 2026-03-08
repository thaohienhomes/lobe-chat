import { memo, useCallback, useState } from 'react';

import type { ComparisonItem } from '../types';

interface ComparisonTemplateProps {
  items: ComparisonItem[];
}

/**
 * ComparisonTemplate — side-by-side comparison cards with property rows.
 * Supports toggle between items and highlights differences.
 */
const ComparisonTemplate = memo<ComparisonTemplateProps>(({ items }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allKeys = Array.from(new Set(items.flatMap((item) => Object.keys(item.properties))));

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div
      aria-label="Comparison diagram"
      className="flex w-full flex-col gap-3"
      role="region"
    >
      {/* Cards */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)` }}>
        {items.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <button
              aria-pressed={isSelected}
              className={`rounded-lg border p-3 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-sky-500/60 bg-sky-900/20'
                  : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600/60 hover:bg-slate-800/60'
              }`}
              key={item.id}
              onClick={() => handleSelect(item.id)}
              type="button"
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-slate-200">{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-lg border border-slate-700/50 bg-slate-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              <th className="p-2 text-left text-xs font-medium text-slate-400">Property</th>
              {items.map((item) => (
                <th
                  className="p-2 text-left text-xs font-medium"
                  key={item.id}
                  style={{ color: item.color }}
                >
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key) => (
              <tr
                className="border-b border-slate-800/50 last:border-b-0"
                key={key}
              >
                <td className="p-2 text-xs text-slate-400">{key}</td>
                {items.map((item) => (
                  <td
                    className={`p-2 text-xs ${selectedId === item.id ? 'font-medium text-sky-300' : 'text-slate-300'}`}
                    key={item.id}
                  >
                    {item.properties[key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

ComparisonTemplate.displayName = 'ComparisonTemplate';

export default ComparisonTemplate;
