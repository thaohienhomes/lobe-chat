import React, { memo } from 'react';

interface ProgressBarProps {
  activeScene: number;
  onSceneClick: (index: number) => void;
  totalScenes: number;
}

const ProgressBar = memo<ProgressBarProps>(({ activeScene, onSceneClick, totalScenes }) => {
  if (totalScenes <= 0) return null;

  return (
    <div
      aria-label="Scene progress"
      className="flex items-center gap-1.5 px-4 py-2"
      role="progressbar"
    >
      {Array.from({ length: totalScenes }, (_, i) => (
        <button
          aria-label={`Go to scene ${i + 1}`}
          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
            i === activeScene
              ? 'bg-blue-500 scale-y-150'
              : i < activeScene
                ? 'bg-blue-500/50'
                : 'bg-slate-600'
          }`}
          key={i}
          onClick={() => onSceneClick(i)}
          type="button"
        />
      ))}
      <span className="ml-2 text-xs text-slate-400">
        {activeScene + 1} / {totalScenes}
      </span>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
