import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { InteractiveRegions } from '../types';
import InteractiveImage from './index';

const mockRegions: InteractiveRegions = {
  context: 'A floor plan showing a 2-bedroom apartment',
  image_type: 'floor_plan',
  regions: [
    {
      bounds: { h: 40, w: 30, x: 5, y: 10 },
      color: '#4ECDC4',
      details: { area: '25m²', function: 'Phòng khách' },
      follow_ups: ['Diện tích phòng khách?', 'Có thể cải tạo không?'],
      id: 'living-room',
      label: 'Phòng Khách',
    },
    {
      bounds: { h: 30, w: 25, x: 50, y: 10 },
      color: '#FF6B6B',
      details: { area: '15m²', function: 'Phòng ngủ' },
      follow_ups: ['Hướng cửa sổ?'],
      id: 'bedroom-1',
      label: 'Phòng Ngủ 1',
    },
  ],
};

const TEST_IMAGE_SRC = 'https://example.com/floorplan.jpg';

describe('InteractiveImage (integration)', () => {
  it('should render the image with all overlay regions', () => {
    render(
      <InteractiveImage
        alt="Floor plan"
        regions={mockRegions}
        src={TEST_IMAGE_SRC}
      />,
    );

    // Image rendered
    const img = screen.getByAltText('Floor plan');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe(TEST_IMAGE_SRC);

    // All region hotspots rendered
    expect(screen.getByLabelText('Region: Phòng Khách')).toBeInTheDocument();
    expect(screen.getByLabelText('Region: Phòng Ngủ 1')).toBeInTheDocument();
  });

  it('should have correct ARIA role and label', () => {
    render(
      <InteractiveImage regions={mockRegions} src={TEST_IMAGE_SRC} />,
    );

    const container = screen.getByRole('region');
    expect(container).toHaveAttribute(
      'aria-label',
      'Interactive floor_plan image: A floor plan showing a 2-bedroom apartment',
    );
  });

  it('should render context as screen-reader-only text', () => {
    const { container } = render(
      <InteractiveImage regions={mockRegions} src={TEST_IMAGE_SRC} />,
    );

    const srOnly = container.querySelector('.sr-only');
    expect(srOnly).toBeInTheDocument();
    expect(srOnly!.textContent).toBe('A floor plan showing a 2-bedroom apartment');
  });

  it('should open detail panel when a region is clicked', () => {
    render(
      <InteractiveImage regions={mockRegions} src={TEST_IMAGE_SRC} />,
    );

    // Panel should not be visible initially
    expect(screen.queryByText('25m²')).not.toBeInTheDocument();

    // Click on a region
    fireEvent.click(screen.getByLabelText('Region: Phòng Khách'));

    // Panel should now show region details
    expect(screen.getByText('Phòng Khách', { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByText('25m²')).toBeInTheDocument();
    expect(screen.getByText('Phòng khách', { selector: 'dd' })).toBeInTheDocument();
  });

  it('should show follow-up chips when a region is selected', () => {
    render(
      <InteractiveImage regions={mockRegions} src={TEST_IMAGE_SRC} />,
    );

    // No chips initially
    expect(screen.queryByText('Diện tích phòng khách?')).not.toBeInTheDocument();

    // Select a region
    fireEvent.click(screen.getByLabelText('Region: Phòng Khách'));

    // Follow-up chips should appear
    expect(screen.getByText('Diện tích phòng khách?')).toBeInTheDocument();
    expect(screen.getByText('Có thể cải tạo không?')).toBeInTheDocument();
  });

  it('should call onFollowUp when a chip is clicked', () => {
    const onFollowUp = vi.fn();
    render(
      <InteractiveImage
        onFollowUp={onFollowUp}
        regions={mockRegions}
        src={TEST_IMAGE_SRC}
      />,
    );

    // Select a region to show chips
    fireEvent.click(screen.getByLabelText('Region: Phòng Khách'));

    // Click a follow-up chip
    fireEvent.click(screen.getByText('Diện tích phòng khách?'));

    expect(onFollowUp).toHaveBeenCalledWith('Diện tích phòng khách?');
  });

  it('should call onRegionSelect when a region is clicked', () => {
    const onRegionSelect = vi.fn();
    render(
      <InteractiveImage
        onRegionSelect={onRegionSelect}
        regions={mockRegions}
        src={TEST_IMAGE_SRC}
      />,
    );

    fireEvent.click(screen.getByLabelText('Region: Phòng Khách'));

    expect(onRegionSelect).toHaveBeenCalledWith(mockRegions.regions[0]);
  });

  it('should deselect region when clicking the same region again', () => {
    const onRegionSelect = vi.fn();
    render(
      <InteractiveImage
        onRegionSelect={onRegionSelect}
        regions={mockRegions}
        src={TEST_IMAGE_SRC}
      />,
    );

    const region = screen.getByLabelText('Region: Phòng Khách');

    // Click to select
    fireEvent.click(region);
    expect(onRegionSelect).toHaveBeenLastCalledWith(mockRegions.regions[0]);

    // Click again to deselect
    fireEvent.click(region);
    expect(onRegionSelect).toHaveBeenLastCalledWith(null);
  });

  it('should close detail panel and call onRegionSelect(null) when panel close button is clicked', () => {
    const onRegionSelect = vi.fn();
    render(
      <InteractiveImage
        onRegionSelect={onRegionSelect}
        regions={mockRegions}
        src={TEST_IMAGE_SRC}
      />,
    );

    // Open panel
    fireEvent.click(screen.getByLabelText('Region: Phòng Khách'));
    expect(screen.getByText('25m²')).toBeInTheDocument();

    // Close panel via button
    fireEvent.click(screen.getByLabelText('Close detail panel'));

    expect(onRegionSelect).toHaveBeenLastCalledWith(null);
  });

  it('should switch detail panel content when clicking a different region', () => {
    render(
      <InteractiveImage regions={mockRegions} src={TEST_IMAGE_SRC} />,
    );

    // Click first region
    fireEvent.click(screen.getByLabelText('Region: Phòng Khách'));
    expect(screen.getByText('25m²')).toBeInTheDocument();

    // Click second region
    fireEvent.click(screen.getByLabelText('Region: Phòng Ngủ 1'));
    expect(screen.getByText('15m²')).toBeInTheDocument();
    expect(screen.getByText('Hướng cửa sổ?')).toBeInTheDocument();
  });

  it('should hide follow-up chips when no region is selected', () => {
    render(
      <InteractiveImage regions={mockRegions} src={TEST_IMAGE_SRC} />,
    );

    // Select and deselect
    fireEvent.click(screen.getByLabelText('Region: Phòng Khách'));
    expect(screen.getByText('Diện tích phòng khách?')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Region: Phòng Khách'));
    expect(screen.queryByText('Diện tích phòng khách?')).not.toBeInTheDocument();
  });
});
