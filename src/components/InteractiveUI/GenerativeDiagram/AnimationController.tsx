import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import type { AnimationControllerProps, AnimationStep, PlaybackState } from './types';

/**
 * AnimationController — step-by-step animation controls for process/flow diagrams.
 *
 * Provides play/pause, step forward/backward, progress bar, and step description.
 * Auto-advances through steps when playing, respecting per-step duration.
 *
 * @see docs/prd/prd-interactive-generative-ui.md Section 5.2
 */
const AnimationController = memo<AnimationControllerProps>(
  ({ steps, onStepChange, autoPlay = false }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [playbackState, setPlaybackState] = useState<PlaybackState>(
      autoPlay ? 'playing' : 'idle',
    );
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const currentStep = steps[currentIndex] ?? null;
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === steps.length - 1;
    const progress = steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 100;

    // Notify parent when step changes
    useEffect(() => {
      if (currentStep) {
        onStepChange?.(currentStep);
      }
    }, [currentStep, onStepChange]);

    // Auto-advance when playing
    useEffect(() => {
      if (playbackState !== 'playing') return;

      const duration = currentStep?.duration ?? 1000;

      timerRef.current = setTimeout(() => {
        if (isLast) {
          setPlaybackState('idle');
          setCurrentIndex(0);
        } else {
          setCurrentIndex((prev) => prev + 1);
        }
      }, duration);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, [playbackState, currentIndex, currentStep, isLast]);

    const handlePlayPause = useCallback(() => {
      setPlaybackState((prev) => {
        if (prev === 'playing') return 'paused';
        // If at end, restart from beginning
        if (isLast) {
          setCurrentIndex(0);
        }
        return 'playing';
      });
    }, [isLast]);

    const handlePrev = useCallback(() => {
      setPlaybackState('paused');
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }, []);

    const handleNext = useCallback(() => {
      setPlaybackState('paused');
      setCurrentIndex((prev) => Math.min(steps.length - 1, prev + 1));
    }, [steps.length]);

    const handleStepClick = useCallback(
      (index: number) => {
        setPlaybackState('paused');
        setCurrentIndex(index);
      },
      [],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        switch (e.key) {
          case 'ArrowLeft': {
            e.preventDefault();
            handlePrev();
            break;
          }
          case 'ArrowRight': {
            e.preventDefault();
            handleNext();
            break;
          }
          case ' ': {
            e.preventDefault();
            handlePlayPause();
            break;
          }
        }
      },
      [handlePrev, handleNext, handlePlayPause],
    );

    if (steps.length === 0) return null;

    return (
      <div
        aria-label="Animation controls"
        className="flex w-full flex-col gap-2 rounded-lg border border-slate-700/40 bg-slate-800/30 p-3"
        onKeyDown={handleKeyDown}
        role="toolbar"
        tabIndex={0}
      >
        {/* Progress bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-700/50">
          <div
            className="h-full rounded-full bg-sky-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
          {/* Step dots */}
          <div className="absolute inset-0 flex items-center justify-between px-0.5">
            {steps.map((step, idx) => (
              <button
                aria-label={`Step ${idx + 1}: ${step.title}`}
                className={`h-2.5 w-2.5 rounded-full border transition-all duration-200 ${
                  idx === currentIndex
                    ? 'border-sky-400 bg-sky-500 scale-125'
                    : idx < currentIndex
                      ? 'border-sky-600 bg-sky-700'
                      : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                }`}
                key={step.index}
                onClick={() => handleStepClick(idx)}
                type="button"
              />
            ))}
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2">
          {/* Prev */}
          <button
            aria-label="Previous step"
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={isFirst}
            onClick={handlePrev}
            type="button"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            aria-label={playbackState === 'playing' ? 'Pause animation' : 'Play animation'}
            className="rounded bg-sky-600/80 p-1.5 text-white transition-colors hover:bg-sky-500"
            onClick={handlePlayPause}
            type="button"
          >
            {playbackState === 'playing' ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  clipRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                  fillRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  clipRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  fillRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* Next */}
          <button
            aria-label="Next step"
            className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-700/50 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
            disabled={isLast}
            onClick={handleNext}
            type="button"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
            </svg>
          </button>

          {/* Step counter */}
          <span className="ml-1 text-xs text-slate-500">
            {currentIndex + 1} / {steps.length}
          </span>

          {/* Step title & description */}
          <div className="ml-2 flex-1 overflow-hidden">
            <p className="truncate text-xs font-medium text-slate-300">
              {currentStep?.title}
            </p>
            <p className="truncate text-[10px] text-slate-500">
              {currentStep?.description}
            </p>
          </div>
        </div>
      </div>
    );
  },
);

AnimationController.displayName = 'AnimationController';

export default AnimationController;
