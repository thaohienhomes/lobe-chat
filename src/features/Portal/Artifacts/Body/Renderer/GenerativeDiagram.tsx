import { memo, useCallback, useMemo } from 'react';

import { DiagramRenderer } from '@/components/InteractiveUI/GenerativeDiagram';
import type { DiagramData, DiagramNode } from '@/components/InteractiveUI/GenerativeDiagram/types';

import JsonParseError from './JsonParseError';

/**
 * Parse the artifact content JSON into DiagramData.
 * Returns null if parsing fails.
 */
function parseArtifactContent(content: string): DiagramData | null {
  try {
    let cleaned = content.trim();

    // Strip markdown code fences if present
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    // Find JSON boundaries
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return null;
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);

    const parsed = JSON.parse(cleaned);

    if (!parsed.type || !parsed.title) return null;

    return parsed as DiagramData;
  } catch {
    return null;
  }
}

const GenerativeDiagramRenderer = memo<{ content: string }>(({ content }) => {
  const data = useMemo(() => parseArtifactContent(content), [content]);

  const handleNodeClick = useCallback((node: DiagramNode) => {
    console.debug('[GenerativeDiagram] Node clicked:', node.id, node.label);
  }, []);

  if (!data) {
    return <JsonParseError content={content} typeName="Generative Diagram" />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: '100%',
        overflow: 'auto',
        padding: 8,
      }}
    >
      <DiagramRenderer data={data} onNodeClick={handleNodeClick} />
    </div>
  );
});

GenerativeDiagramRenderer.displayName = 'GenerativeDiagramRenderer';

export default GenerativeDiagramRenderer;
