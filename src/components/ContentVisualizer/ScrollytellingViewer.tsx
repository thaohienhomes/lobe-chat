import React, { memo, useCallback, useMemo, useState } from 'react';

import type { ContentVisualizerArtifact } from '@/services/content-visualizer/types';

import NarrationPanel from './NarrationPanel';
import ProgressBar from './ProgressBar';
import SceneRenderer from './SceneRenderer';

interface ScrollytellingViewerProps {
  artifact: ContentVisualizerArtifact;
}

const ScrollytellingViewer = memo<ScrollytellingViewerProps>(({ artifact }) => {
  const [activeScene, setActiveScene] = useState(0);

  const scenes = useMemo(
    () =>
      artifact.sections.map((section) => ({
        contentHtml: section.contentHtml,
        sectionId: section.sectionId,
        title: section.title,
        visualization: section.visualizations[0],
      })),
    [artifact.sections],
  );

  const totalScenes = scenes.length;

  const handlePrevious = useCallback(() => {
    setActiveScene((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveScene((prev) => Math.min(totalScenes - 1, prev + 1));
  }, [totalScenes]);

  const handleSceneClick = useCallback((index: number) => {
    setActiveScene(index);
  }, []);

  const currentScene = scenes[activeScene];
  const currentNarration = currentScene?.visualization?.narration;

  return (
    <div className="flex h-full flex-col bg-[#0F172A] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-700 px-4 py-3">
        <h1 className="text-lg font-bold text-slate-100">
          {artifact.metadata.title}
        </h1>
        {artifact.metadata.authors && artifact.metadata.authors.length > 0 && (
          <p className="mt-1 text-xs text-slate-400">
            {artifact.metadata.authors.join(', ')}
          </p>
        )}
      </header>

      {/* Progress */}
      <ProgressBar
        activeScene={activeScene}
        onSceneClick={handleSceneClick}
        totalScenes={totalScenes}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Scene content */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentScene && (
            <SceneRenderer
              contentHtml={currentScene.contentHtml}
              isActive={true}
              sectionTitle={currentScene.title}
              visualization={currentScene.visualization}
            />
          )}
        </main>

        {/* Side narration panel (desktop only) */}
        {currentNarration && (
          <div className="hidden w-64 lg:block">
            <NarrationPanel
              narration={currentNarration}
              title={currentScene?.title}
            />
          </div>
        )}
      </div>

      {/* Navigation controls */}
      <nav
        aria-label="Scene navigation"
        className="flex items-center justify-between border-t border-slate-700 px-4 py-3"
      >
        <button
          aria-label="Previous scene"
          className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={activeScene === 0}
          onClick={handlePrevious}
          type="button"
        >
          Previous
        </button>

        <span className="text-xs text-slate-500">
          {artifact.layout === 'scrollytelling' ? 'Scrollytelling' : artifact.layout}
        </span>

        <button
          aria-label="Next scene"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={activeScene === totalScenes - 1}
          onClick={handleNext}
          type="button"
        >
          Next
        </button>
      </nav>
    </div>
  );
});

ScrollytellingViewer.displayName = 'ScrollytellingViewer';

export default ScrollytellingViewer;
