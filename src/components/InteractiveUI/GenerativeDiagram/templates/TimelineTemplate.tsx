import React, { memo, useCallback, useState } from 'react';

import type { TimelineEvent } from '../types';

interface TimelineTemplateProps {
  events: TimelineEvent[];
}

/**
 * TimelineTemplate — chronological timeline with expandable event cards.
 * Events are laid out vertically with a connecting line.
 */
const TimelineTemplate = memo<TimelineTemplateProps>(({ events }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle(id);
      }
    },
    [handleToggle],
  );

  return (
    <div
      aria-label="Timeline diagram"
      className="relative flex w-full flex-col py-2 pl-6"
      role="list"
    >
      {/* Vertical line */}
      <div className="absolute bottom-0 left-3 top-0 w-px bg-slate-700/60" />

      {events.map((event, idx) => {
        const isExpanded = expandedId === event.id;
        return (
          <div
            className="relative mb-4 last:mb-0"
            key={event.id}
            role="listitem"
          >
            {/* Dot marker */}
            <div
              className="absolute -left-[14px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900"
              style={{ backgroundColor: event.color }}
            />

            {/* Event card */}
            <div
              aria-expanded={isExpanded}
              className={`cursor-pointer rounded-lg border p-3 transition-all duration-200 ${
                isExpanded
                  ? 'border-sky-500/40 bg-slate-800/60'
                  : 'border-slate-700/40 bg-slate-800/30 hover:border-slate-600/50 hover:bg-slate-800/50'
              }`}
              onClick={() => handleToggle(event.id)}
              onKeyDown={(e) => handleKeyDown(e, event.id)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-2">
                <span
                  className="rounded px-1.5 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `${event.color}20`,
                    color: event.color,
                  }}
                >
                  {event.date}
                </span>
                <span className="text-sm font-medium text-slate-200">{event.title}</span>
                {/* Expand indicator */}
                <span
                  className={`ml-auto text-xs text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                >
                  {'▼'}
                </span>
              </div>

              {isExpanded && (
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  {event.description}
                </p>
              )}
            </div>

            {/* Connection line to next event */}
            {idx < events.length - 1 && (
              <div className="absolute -left-[10px] top-5 h-full w-px" />
            )}
          </div>
        );
      })}
    </div>
  );
});

TimelineTemplate.displayName = 'TimelineTemplate';

export default TimelineTemplate;
