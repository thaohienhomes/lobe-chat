import { memo, useCallback } from 'react';

import type { FollowUpChipsProps } from '../types';

/**
 * FollowUpChips — displays a row of suggested question chips.
 * Clicking a chip routes the question back to the AI.
 */
const FollowUpChips = memo<FollowUpChipsProps>(({ questions, onSelect }) => {
  const handleClick = useCallback(
    (question: string) => {
      onSelect?.(question);
    },
    [onSelect],
  );

  if (questions.length === 0) return null;

  return (
    <div
      aria-label="Suggested follow-up questions"
      className="flex flex-wrap gap-2 px-1 py-2"
      role="list"
    >
      {questions.map((question) => (
        <button
          className={[
            'rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5',
            'text-xs text-slate-300 transition-all duration-200',
            'hover:border-sky-500/50 hover:bg-sky-900/30 hover:text-sky-300',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500',
            'active:scale-95',
          ].join(' ')}
          key={question}
          onClick={() => handleClick(question)}
          role="listitem"
          type="button"
        >
          {question}
        </button>
      ))}
    </div>
  );
});

FollowUpChips.displayName = 'FollowUpChips';

export default FollowUpChips;
