import React, { memo, useEffect, useState } from 'react';

import type { VisualizationEntry } from '@/services/content-visualizer/types';

interface SceneRendererProps {
  contentHtml: string;
  isActive: boolean;
  sectionTitle: string;
  visualization?: VisualizationEntry;
}

const SceneRenderer = memo<SceneRendererProps>(
  ({ contentHtml, isActive, sectionTitle, visualization }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      if (isActive) {
        const timer = setTimeout(() => setVisible(true), 100);
        return () => clearTimeout(timer);
      }
      setVisible(false);
    }, [isActive]);

    return (
      <section
        aria-label={sectionTitle}
        className={`flex min-h-[60vh] flex-col gap-4 transition-all duration-500 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <h2 className="text-xl font-bold text-slate-100">{sectionTitle}</h2>

        <div
          className="prose prose-invert prose-sm max-w-none text-slate-300"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />

        {visualization?.artifactCode && (
          <div
            aria-label="Interactive visualization"
            className="mt-4 min-h-[300px] rounded-lg border border-slate-700 bg-slate-900 p-4"
          >
            <div className="flex h-full items-center justify-center text-slate-500">
              <p className="text-sm">
                Interactive artifact loaded via Sandpack renderer
              </p>
            </div>
          </div>
        )}

        {visualization?.narration && (
          <blockquote className="border-l-2 border-blue-500/50 pl-4 text-sm italic text-slate-400">
            {visualization.narration}
          </blockquote>
        )}
      </section>
    );
  },
);

SceneRenderer.displayName = 'SceneRenderer';

export default SceneRenderer;
