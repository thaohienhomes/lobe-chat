import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { InteractiveRegion } from '../types';
import DetailPanel from './DetailPanel';

const mockRegion: InteractiveRegion = {
  bounds: { h: 55, w: 35, x: 10, y: 15 },
  color: '#4ECDC4',
  details: {
    area: '25m²',
    function: 'Living Room',
    window_direction: 'South-East',
  },
  follow_ups: ['What is the area?', 'Can it be renovated?'],
  id: 'living-room',
  label: 'Living Room',
};

describe('DetailPanel', () => {
  describe('when region is null (closed)', () => {
    it('should not render region content', () => {
      render(<DetailPanel region={null} />);

      expect(screen.queryByText('Living Room')).not.toBeInTheDocument();
    });

    it('should have translate-x-full class (hidden)', () => {
      render(<DetailPanel region={null} />);

      const panel = screen.getByRole('dialog');
      expect(panel.className).toContain('translate-x-full');
    });

    it('should not render backdrop', () => {
      const { container } = render(<DetailPanel region={null} />);

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).not.toBeInTheDocument();
    });
  });

  describe('when region is provided (open)', () => {
    it('should display region label in heading', () => {
      render(<DetailPanel region={mockRegion} />);

      expect(screen.getByText('Living Room', { selector: 'h3' })).toBeInTheDocument();
    });

    it('should display all detail key-value pairs', () => {
      render(<DetailPanel region={mockRegion} />);

      expect(screen.getByText('area')).toBeInTheDocument();
      expect(screen.getByText('25m²')).toBeInTheDocument();
      expect(screen.getByText('function')).toBeInTheDocument();
      expect(screen.getByText('Living Room', { selector: 'dd' })).toBeInTheDocument();
      expect(screen.getByText('window direction')).toBeInTheDocument();
      expect(screen.getByText('South-East')).toBeInTheDocument();
    });

    it('should replace underscores with spaces in detail keys', () => {
      render(<DetailPanel region={mockRegion} />);

      expect(screen.getByText('window direction')).toBeInTheDocument();
      expect(screen.queryByText('window_direction')).not.toBeInTheDocument();
    });

    it('should display bounds position info', () => {
      render(<DetailPanel region={mockRegion} />);

      expect(screen.getByText(/10\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/15\.0%/)).toBeInTheDocument();
    });

    it('should have translate-x-0 class (visible)', () => {
      render(<DetailPanel region={mockRegion} />);

      const panel = screen.getByRole('dialog');
      expect(panel.className).toContain('translate-x-0');
    });

    it('should render the color indicator dot', () => {
      const { container } = render(<DetailPanel region={mockRegion} />);

      const dot = container.querySelector('span[style]') as HTMLSpanElement;
      expect(dot).toBeInTheDocument();
      // happy-dom may keep hex format instead of converting to rgb
      expect(dot.style.backgroundColor).toMatch(/(#4ECDC4|rgb\(78, 205, 196\))/i);
    });

    it('should render backdrop when open', () => {
      const { container } = render(<DetailPanel region={mockRegion} />);

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('close interactions', () => {
    it('should call onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<DetailPanel onClose={onClose} region={mockRegion} />);

      fireEvent.click(screen.getByLabelText('Close detail panel'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<DetailPanel onClose={onClose} region={mockRegion} />);

      const backdrop = container.querySelector('[aria-hidden="true"]');
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(<DetailPanel onClose={onClose} region={mockRegion} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose on Escape when panel is closed', () => {
      const onClose = vi.fn();
      render(<DetailPanel onClose={onClose} region={null} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have dialog role', () => {
      render(<DetailPanel region={mockRegion} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have descriptive aria-label when open', () => {
      render(<DetailPanel region={mockRegion} />);

      expect(screen.getByLabelText('Details for Living Room')).toBeInTheDocument();
    });

    it('should have close button with aria-label', () => {
      render(<DetailPanel region={mockRegion} />);

      expect(screen.getByLabelText('Close detail panel')).toBeInTheDocument();
    });
  });
});
