import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import DiagramRenderer from './DiagramRenderer';
import type { DiagramData } from './types';

const structuralData: DiagramData = {
  context: 'A simple structural diagram with two nodes',
  nodes: [
    {
      color: '#EF4444',
      description: 'The heart pumps blood',
      id: 'heart',
      label: 'Heart',
      position: { x: 50, y: 40 },
      size: { height: 12, width: 18 },
    },
    {
      color: '#3B82F6',
      description: 'Lungs exchange gases',
      id: 'lungs',
      label: 'Lungs',
      position: { x: 50, y: 15 },
      size: { height: 10, width: 22 },
    },
  ],
  title: 'Circulatory System',
  type: 'structural',
};

const processFlowData: DiagramData = {
  animationSteps: [
    {
      description: 'DNA unwinds',
      duration: 1000,
      highlightEdges: ['e1'],
      highlightNodes: ['step1'],
      index: 0,
      title: 'Unwinding',
    },
    {
      description: 'New strands form',
      duration: 1000,
      highlightNodes: ['step2'],
      index: 1,
      title: 'Replication',
    },
  ],
  context: 'DNA replication process',
  edges: [
    { from: 'step1', id: 'e1', label: 'helicase', to: 'step2' },
  ],
  nodes: [
    { color: '#F97316', id: 'step1', label: 'Unwind', position: { x: 30, y: 50 } },
    { color: '#10B981', id: 'step2', label: 'Replicate', position: { x: 70, y: 50 } },
  ],
  title: 'DNA Replication',
  type: 'process_flow',
};

const comparisonData: DiagramData = {
  comparisonItems: [
    {
      color: '#EF4444',
      id: 'apt-a',
      label: 'Apartment A',
      properties: { area: '80 m²', floor: '15', price: '3.5 tỷ' },
    },
    {
      color: '#3B82F6',
      id: 'apt-b',
      label: 'Apartment B',
      properties: { area: '95 m²', floor: '20', price: '4.2 tỷ' },
    },
  ],
  context: 'Comparing two apartments',
  title: 'Apartment Comparison',
  type: 'comparison',
};

const timelineData: DiagramData = {
  context: 'Key events in Vietnam War',
  timelineEvents: [
    { color: '#EF4444', date: '1955', description: 'War begins', id: 'e1', title: 'Start' },
    { color: '#3B82F6', date: '1968', description: 'Major offensive', id: 'e2', title: 'Tet Offensive' },
    { color: '#10B981', date: '1975', description: 'War ends', id: 'e3', title: 'End' },
  ],
  title: 'Vietnam War Timeline',
  type: 'timeline',
};

const mapData: DiagramData = {
  context: 'Earthquake zones in SE Asia',
  nodes: [
    { color: '#EF4444', description: 'High seismic activity', id: 'zone1', label: 'Zone 1', position: { x: 30, y: 40 } },
    { color: '#F97316', description: 'Moderate activity', id: 'zone2', label: 'Zone 2', position: { x: 60, y: 55 } },
  ],
  title: 'Earthquake Zones',
  type: 'map_based',
};

const simulationData: DiagramData = {
  context: 'Supply and demand simulation',
  nodes: [
    { color: '#EF4444', id: 'p1', label: 'Low', position: { x: 20, y: 80 } },
    { color: '#F97316', id: 'p2', label: 'Mid', position: { x: 50, y: 50 } },
    { color: '#10B981', id: 'p3', label: 'High', position: { x: 80, y: 20 } },
  ],
  simulationParams: [
    { id: 'price', label: 'Price', max: 100, min: 0, step: 1, unit: 'VND', value: 50 },
  ],
  title: 'Supply & Demand',
  type: 'simulation',
};

describe('DiagramRenderer', () => {
  describe('structural diagram', () => {
    it('renders title and nodes', () => {
      render(<DiagramRenderer data={structuralData} />);
      expect(screen.getByText('Circulatory System')).toBeInTheDocument();
      expect(screen.getByText('Heart')).toBeInTheDocument();
      expect(screen.getByText('Lungs')).toBeInTheDocument();
    });

    it('calls onNodeClick when a node is clicked', () => {
      const onNodeClick = vi.fn();
      render(<DiagramRenderer data={structuralData} onNodeClick={onNodeClick} />);
      fireEvent.click(screen.getByText('Heart'));
      expect(onNodeClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'heart', label: 'Heart' }),
      );
    });

    it('shows node description when selected', () => {
      render(<DiagramRenderer data={structuralData} />);
      fireEvent.click(screen.getByText('Heart'));
      expect(screen.getByText('The heart pumps blood')).toBeInTheDocument();
    });

    it('toggles node selection on second click', () => {
      render(<DiagramRenderer data={structuralData} />);
      const heartButton = screen.getByRole('button', { name: /Heart/ });
      fireEvent.click(heartButton);
      expect(screen.getByText('The heart pumps blood')).toBeInTheDocument();
      fireEvent.click(heartButton);
      expect(screen.queryByText('The heart pumps blood')).not.toBeInTheDocument();
    });

    it('has accessible region label', () => {
      render(<DiagramRenderer data={structuralData} />);
      expect(
        screen.getByRole('region', { name: /Generative diagram: Circulatory System/ }),
      ).toBeInTheDocument();
    });
  });

  describe('process_flow diagram', () => {
    it('renders nodes and animation controller', () => {
      render(<DiagramRenderer data={processFlowData} />);
      expect(screen.getByText('DNA Replication')).toBeInTheDocument();
      expect(screen.getByText('Unwind')).toBeInTheDocument();
      expect(screen.getByText('Replicate')).toBeInTheDocument();
      expect(screen.getByRole('toolbar', { name: 'Animation controls' })).toBeInTheDocument();
    });
  });

  describe('comparison diagram', () => {
    it('renders items and comparison table', () => {
      render(<DiagramRenderer data={comparisonData} />);
      expect(screen.getByText('Apartment Comparison')).toBeInTheDocument();
      // Each label appears twice: once in card button, once in table header
      expect(screen.getAllByText('Apartment A')).toHaveLength(2);
      expect(screen.getAllByText('Apartment B')).toHaveLength(2);
      expect(screen.getByText('3.5 tỷ')).toBeInTheDocument();
      expect(screen.getByText('4.2 tỷ')).toBeInTheDocument();
    });

    it('toggles item selection', () => {
      render(<DiagramRenderer data={comparisonData} />);
      const btnA = screen.getAllByText('Apartment A')[0];
      fireEvent.click(btnA);
      expect(btnA.closest('button')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('timeline diagram', () => {
    it('renders events in order', () => {
      render(<DiagramRenderer data={timelineData} />);
      expect(screen.getByText('Vietnam War Timeline')).toBeInTheDocument();
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Tet Offensive')).toBeInTheDocument();
      expect(screen.getByText('End')).toBeInTheDocument();
    });

    it('expands event on click', () => {
      render(<DiagramRenderer data={timelineData} />);
      fireEvent.click(screen.getByText('Start'));
      expect(screen.getByText('War begins')).toBeInTheDocument();
    });
  });

  describe('map_based diagram', () => {
    it('renders map nodes', () => {
      render(<DiagramRenderer data={mapData} />);
      expect(screen.getByText('Earthquake Zones')).toBeInTheDocument();
      expect(screen.getByText('Zone 1')).toBeInTheDocument();
      expect(screen.getByText('Zone 2')).toBeInTheDocument();
    });

    it('shows info card on node click', () => {
      render(<DiagramRenderer data={mapData} />);
      const zone1Button = screen.getByRole('button', { name: 'Zone 1' });
      fireEvent.click(zone1Button);
      // Description appears in both MapBasedTemplate info card and DiagramRenderer detail card
      expect(screen.getAllByText('High seismic activity').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('simulation diagram', () => {
    it('renders params and nodes', () => {
      render(<DiagramRenderer data={simulationData} />);
      expect(screen.getByText('Supply & Demand')).toBeInTheDocument();
      expect(screen.getByLabelText('Price')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('slider changes param value', () => {
      render(<DiagramRenderer data={simulationData} />);
      const slider = screen.getByLabelText('Price');
      fireEvent.change(slider, { target: { value: '75' } });
      expect(screen.getByText('75 VND')).toBeInTheDocument();
    });
  });

  describe('generatedCode mode', () => {
    it('renders raw SVG code', () => {
      const data: DiagramData = {
        context: 'Custom diagram',
        generatedCode: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" fill="red"/></svg>',
        title: 'Custom SVG',
        type: 'structural',
      };
      render(<DiagramRenderer data={data} />);
      expect(screen.getByText('Custom SVG')).toBeInTheDocument();
      const container = document.querySelector('svg circle');
      expect(container).toBeTruthy();
    });
  });

  describe('unsupported type', () => {
    it('shows error for unknown type', () => {
      const data: DiagramData = {
        context: 'Unknown',
        title: 'Unknown',
        type: 'unknown' as any,
      };
      render(<DiagramRenderer data={data} />);
      expect(screen.getByText(/Unsupported diagram type/)).toBeInTheDocument();
    });
  });
});
