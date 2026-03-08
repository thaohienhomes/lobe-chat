import React, { memo } from 'react';

interface NarrationPanelProps {
  narration?: string;
  title?: string;
}

const NarrationPanel = memo<NarrationPanelProps>(({ narration, title }) => {
  if (!narration) return null;

  return (
    <aside
      aria-label="Narration panel"
      className="border-l border-slate-700 bg-slate-800/50 p-4"
    >
      {title && (
        <h3 className="mb-2 text-sm font-semibold text-slate-300">{title}</h3>
      )}
      <p className="text-sm leading-relaxed text-slate-400">{narration}</p>
    </aside>
  );
});

NarrationPanel.displayName = 'NarrationPanel';

export default NarrationPanel;
