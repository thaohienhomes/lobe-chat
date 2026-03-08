import { memo, useMemo } from 'react';

import { ScrollytellingViewer } from '@/components/ContentVisualizer';
import type { ContentVisualizerArtifact } from '@/services/content-visualizer/types';

/**
 * Parse the artifact content JSON into ContentVisualizerArtifact.
 * Returns null if parsing fails.
 */
function parseArtifactContent(content: string): ContentVisualizerArtifact | null {
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

    // Validate minimal structure
    if (!parsed.metadata || !parsed.sections || !Array.isArray(parsed.sections)) return null;

    return parsed as ContentVisualizerArtifact;
  } catch {
    return null;
  }
}

const ContentVisualizerRenderer = memo<{ content: string }>(({ content }) => {
  const artifact = useMemo(() => parseArtifactContent(content), [content]);

  if (!artifact) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-slate-400">
        <p>Failed to parse Content Visualizer data. Check the artifact content format.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'auto',
      }}
    >
      <ScrollytellingViewer artifact={artifact} />
    </div>
  );
});

ContentVisualizerRenderer.displayName = 'ContentVisualizerRenderer';

export default ContentVisualizerRenderer;
