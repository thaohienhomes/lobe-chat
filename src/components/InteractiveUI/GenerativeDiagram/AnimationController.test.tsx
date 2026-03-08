import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AnimationController from './AnimationController';
import type { AnimationStep } from './types';

const steps: AnimationStep[] = [
  { description: 'First thing happens', duration: 500, index: 0, title: 'Step 1' },
  { description: 'Second thing happens', duration: 500, index: 1, title: 'Step 2' },
  { description: 'Third thing happens', duration: 500, index: 2, title: 'Step 3' },
];

describe('AnimationController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders step counter and title', () => {
    render(<AnimationController steps={steps} />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('renders nothing when no steps', () => {
    const { container } = render(<AnimationController steps={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('advances to next step on next button click', () => {
    const onStepChange = vi.fn();
    render(<AnimationController onStepChange={onStepChange} steps={steps} />);
    fireEvent.click(screen.getByLabelText('Next step'));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });

  it('goes back on prev button click', () => {
    render(<AnimationController steps={steps} />);
    fireEvent.click(screen.getByLabelText('Next step'));
    fireEvent.click(screen.getByLabelText('Previous step'));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('disables prev button on first step', () => {
    render(<AnimationController steps={steps} />);
    expect(screen.getByLabelText('Previous step')).toBeDisabled();
  });

  it('disables next button on last step', () => {
    render(<AnimationController steps={steps} />);
    fireEvent.click(screen.getByLabelText('Next step'));
    fireEvent.click(screen.getByLabelText('Next step'));
    expect(screen.getByLabelText('Next step')).toBeDisabled();
  });

  it('auto-plays through steps', () => {
    render(<AnimationController autoPlay steps={steps} />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('pauses on play/pause button click during playback', () => {
    render(<AnimationController autoPlay steps={steps} />);
    fireEvent.click(screen.getByLabelText('Pause animation'));

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('1 / 3')).toBeInTheDocument(); // Still on step 1
  });

  it('resumes playback on play button click', () => {
    render(<AnimationController steps={steps} />);
    fireEvent.click(screen.getByLabelText('Play animation'));

    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('supports keyboard navigation (arrows + space)', () => {
    render(<AnimationController steps={steps} />);
    const toolbar = screen.getByRole('toolbar');

    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    fireEvent.keyDown(toolbar, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();

    fireEvent.keyDown(toolbar, { key: ' ' });
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('clicking step dots navigates directly', () => {
    render(<AnimationController steps={steps} />);
    const stepDots = screen.getAllByLabelText(/Step \d/);
    fireEvent.click(stepDots[2]); // Click step 3
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('calls onStepChange when step changes', () => {
    const onStepChange = vi.fn();
    render(<AnimationController onStepChange={onStepChange} steps={steps} />);

    // Called on mount with first step
    expect(onStepChange).toHaveBeenCalledWith(
      expect.objectContaining({ index: 0, title: 'Step 1' }),
    );

    fireEvent.click(screen.getByLabelText('Next step'));
    expect(onStepChange).toHaveBeenCalledWith(
      expect.objectContaining({ index: 1, title: 'Step 2' }),
    );
  });

  it('resets to start when play pressed at end', () => {
    render(<AnimationController steps={steps} />);
    // Go to last step
    fireEvent.click(screen.getByLabelText('Next step'));
    fireEvent.click(screen.getByLabelText('Next step'));
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    // Press play → should reset to start and play
    fireEvent.click(screen.getByLabelText('Play animation'));
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('has accessible toolbar role', () => {
    render(<AnimationController steps={steps} />);
    expect(screen.getByRole('toolbar', { name: 'Animation controls' })).toBeInTheDocument();
  });
});
