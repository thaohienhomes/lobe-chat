import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { InteractiveRegion } from '../types';
import OverlayLayer from './OverlayLayer';

const mockRegions: InteractiveRegion[] = [
  {
    bounds: { h: 55, w: 35, x: 10, y: 15 },
    color: '#4ECDC4',
    details: { finding: 'Normal' },
    follow_ups: ['Question 1'],
    id: 'right-lung',
    label: 'Right Lung',
  },
  {
    bounds: { h: 30, w: 20, x: 55, y: 40 },
    color: '#FF6B6B',
    details: { finding: 'Abnormal' },
    follow_ups: ['Question 2'],
    id: 'heart',
    label: 'Heart',
  },
];

describe('OverlayLayer', () => {
  it('should render an SVG with correct viewBox', () => {
    render(<OverlayLayer regions={mockRegions} />);

    const svg = screen.getByRole('group');
    expect(svg).toBeInTheDocument();
    expect(svg.getAttribute('viewBox')).toBe('0 0 100 100');
  });

  it('should render a rect for each region with percentage-based coordinates', () => {
    render(<OverlayLayer regions={mockRegions} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);

    const firstRect = buttons[0];
    expect(firstRect.getAttribute('x')).toBe('10');
    expect(firstRect.getAttribute('y')).toBe('15');
    expect(firstRect.getAttribute('width')).toBe('35');
    expect(firstRect.getAttribute('height')).toBe('55');
    expect(firstRect.getAttribute('fill')).toBe('#4ECDC4');
  });

  it('should render region labels as text elements', () => {
    render(<OverlayLayer regions={mockRegions} />);

    expect(screen.getByText('Right Lung')).toBeInTheDocument();
    expect(screen.getByText('Heart')).toBeInTheDocument();
  });

  it('should have ARIA labels for each region', () => {
    render(<OverlayLayer regions={mockRegions} />);

    expect(screen.getByLabelText('Region: Right Lung')).toBeInTheDocument();
    expect(screen.getByLabelText('Region: Heart')).toBeInTheDocument();
  });

  it('should call onRegionClick when a region is clicked', () => {
    const onRegionClick = vi.fn();
    render(<OverlayLayer onRegionClick={onRegionClick} regions={mockRegions} />);

    fireEvent.click(screen.getByLabelText('Region: Right Lung'));

    expect(onRegionClick).toHaveBeenCalledTimes(1);
    expect(onRegionClick).toHaveBeenCalledWith(mockRegions[0]);
  });

  it('should call onRegionHover on mouseEnter and mouseLeave', () => {
    const onRegionHover = vi.fn();
    render(<OverlayLayer onRegionHover={onRegionHover} regions={mockRegions} />);

    const region = screen.getByLabelText('Region: Heart');

    fireEvent.mouseEnter(region);
    expect(onRegionHover).toHaveBeenCalledWith(mockRegions[1]);

    fireEvent.mouseLeave(region);
    expect(onRegionHover).toHaveBeenCalledWith(null);
  });

  it('should apply active style when activeRegionId matches', () => {
    render(<OverlayLayer activeRegionId="right-lung" regions={mockRegions} />);

    const activeRect = screen.getByLabelText('Region: Right Lung');
    expect(activeRect.getAttribute('fill-opacity')).toBe('0.3');
    expect(activeRect.getAttribute('stroke-opacity')).toBe('0.9');
  });

  it('should apply default style when no region is active or hovered', () => {
    render(<OverlayLayer regions={mockRegions} />);

    const rect = screen.getByLabelText('Region: Right Lung');
    expect(rect.getAttribute('fill-opacity')).toBe('0.1');
    expect(rect.getAttribute('stroke-opacity')).toBe('0.5');
  });

  it('should trigger click on Enter key press', () => {
    const onRegionClick = vi.fn();
    render(<OverlayLayer onRegionClick={onRegionClick} regions={mockRegions} />);

    const region = screen.getByLabelText('Region: Right Lung');
    fireEvent.keyDown(region, { key: 'Enter' });

    expect(onRegionClick).toHaveBeenCalledWith(mockRegions[0]);
  });

  it('should trigger click on Space key press', () => {
    const onRegionClick = vi.fn();
    render(<OverlayLayer onRegionClick={onRegionClick} regions={mockRegions} />);

    const region = screen.getByLabelText('Region: Heart');
    fireEvent.keyDown(region, { key: ' ' });

    expect(onRegionClick).toHaveBeenCalledWith(mockRegions[1]);
  });

  it('should make regions keyboard focusable with tabIndex', () => {
    render(<OverlayLayer regions={mockRegions} />);

    const buttons = screen.getAllByRole('button');
    for (const button of buttons) {
      expect(button.getAttribute('tabindex')).toBe('0');
    }
  });
});
