import { memo, useCallback, useMemo, useState } from 'react';

import AnimationController from './AnimationController';
import ComparisonTemplate from './templates/ComparisonTemplate';
import MapBasedTemplate from './templates/MapBasedTemplate';
import ProcessFlowTemplate from './templates/ProcessFlowTemplate';
import SimulationTemplate from './templates/SimulationTemplate';
import StructuralTemplate from './templates/StructuralTemplate';
import TimelineTemplate from './templates/TimelineTemplate';
import type { AnimationStep, DiagramNode, DiagramRendererProps } from './types';

/**
 * DiagramRenderer — renders SVG/Canvas diagrams from AI-generated data.
 *
 * Routes to the appropriate template based on diagram type.
 * Supports two rendering modes:
 * 1. Template-based: structured DiagramData → pre-built template
 * 2. Code-based: AI-generated SVG/React code → sandboxed render via dangerouslySetInnerHTML
 *
 * @see docs/prd/prd-interactive-generative-ui.md Section 5.2
 */
const DiagramRenderer = memo<DiagramRendererProps>(({ data, onNodeClick }) => {
  const [activeStep, setActiveStep] = useState<AnimationStep | null>(null);
  const [selectedNode, setSelectedNode] = useState<DiagramNode | null>(null);

  const handleNodeClick = useCallback(
    (node: DiagramNode) => {
      setSelectedNode((prev) => (prev?.id === node.id ? null : node));
      onNodeClick?.(node);
    },
    [onNodeClick],
  );

  const handleStepChange = useCallback((step: AnimationStep) => {
    setActiveStep(step);
  }, []);

  const hasAnimation = useMemo(
    () => (data.animationSteps?.length ?? 0) > 0,
    [data.animationSteps],
  );

  // If AI provided raw SVG code, render it directly
  if (data.generatedCode) {
    return (
      <div
        aria-label={`Generative diagram: ${data.title}`}
        className="flex w-full flex-col gap-2 rounded-xl bg-[#0F172A] p-3"
        role="region"
      >
        <h3 className="text-sm font-medium text-slate-200">{data.title}</h3>
        <div
          className="w-full overflow-auto rounded-lg bg-slate-900/50 p-2 [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: data.generatedCode }}
        />
        <p className="sr-only">{data.context}</p>
      </div>
    );
  }

  const renderDiagram = () => {
    switch (data.type) {
      case 'structural': {
        return (
          <StructuralTemplate
            activeNodeId={selectedNode?.id}
            nodes={data.nodes ?? []}
            onNodeClick={handleNodeClick}
          />
        );
      }
      case 'process_flow': {
        return (
          <ProcessFlowTemplate
            activeStep={activeStep}
            edges={data.edges ?? []}
            nodes={data.nodes ?? []}
            onNodeClick={handleNodeClick}
          />
        );
      }
      case 'comparison': {
        return <ComparisonTemplate items={data.comparisonItems ?? []} />;
      }
      case 'timeline': {
        return <TimelineTemplate events={data.timelineEvents ?? []} />;
      }
      case 'map_based': {
        return (
          <MapBasedTemplate
            nodes={data.nodes ?? []}
            onNodeClick={handleNodeClick}
          />
        );
      }
      case 'simulation': {
        return (
          <SimulationTemplate
            nodes={data.nodes ?? []}
            params={data.simulationParams ?? []}
          />
        );
      }
      default: {
        return (
          <div className="flex items-center justify-center p-8 text-slate-400">
            <p>Unsupported diagram type: {data.type}</p>
          </div>
        );
      }
    }
  };

  return (
    <div
      aria-label={`Generative diagram: ${data.title}`}
      className="flex w-full flex-col gap-2 rounded-xl bg-[#0F172A] p-3"
      role="region"
    >
      {/* Title */}
      <h3 className="text-sm font-medium text-slate-200">{data.title}</h3>

      {/* Diagram canvas */}
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-900/50">
        {renderDiagram()}
      </div>

      {/* Animation controls (for process_flow & structural with steps) */}
      {hasAnimation && (
        <AnimationController
          onStepChange={handleStepChange}
          steps={data.animationSteps!}
        />
      )}

      {/* Selected node detail */}
      {selectedNode && (
        <div className="rounded-lg border border-slate-700/40 bg-slate-800/30 p-3">
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: selectedNode.color }}
            />
            <span className="text-sm font-medium text-slate-200">{selectedNode.label}</span>
          </div>
          {selectedNode.description && (
            <p className="mt-1 text-xs text-slate-400">{selectedNode.description}</p>
          )}
        </div>
      )}

      {/* Context for screen readers */}
      <p className="sr-only">{data.context}</p>
    </div>
  );
});

DiagramRenderer.displayName = 'DiagramRenderer';

export default DiagramRenderer;
