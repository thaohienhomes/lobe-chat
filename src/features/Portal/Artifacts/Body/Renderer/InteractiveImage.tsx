import { memo, useCallback, useMemo } from 'react';

import InteractiveImageComponent from '@/components/InteractiveUI/InteractiveImage';
import { LegendBar } from '@/components/InteractiveUI';
import type { InteractiveRegion, InteractiveRegions } from '@/components/InteractiveUI/types';

interface InteractiveImageArtifactData {
  alt?: string;
  regions: InteractiveRegions;
  src: string;
}

/**
 * Parse the artifact content JSON into InteractiveImage data.
 * Returns null if parsing fails.
 */
function parseArtifactContent(content: string): InteractiveImageArtifactData | null {
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

    if (!parsed.src || !parsed.regions) return null;

    return {
      alt: parsed.alt || '',
      regions: parsed.regions,
      src: parsed.src,
    };
  } catch {
    return null;
  }
}

const InteractiveImageRenderer = memo<{ content: string }>(({ content }) => {
  const data = useMemo(() => parseArtifactContent(content), [content]);

  const handleRegionSelect = useCallback((region: InteractiveRegion | null) => {
    if (region) {
      console.debug('[InteractiveImage] Region selected:', region.id, region.label);
    }
  }, []);

  const handleFollowUp = useCallback((question: string) => {
    console.debug('[InteractiveImage] Follow-up:', question);
    // TODO: Route follow-up question back to chat input
  }, []);

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-slate-400">
        <p>Failed to parse Interactive Image data. Check the artifact content format.</p>
      </div>
    );
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
      <InteractiveImageComponent
        alt={data.alt}
        onFollowUp={handleFollowUp}
        onRegionSelect={handleRegionSelect}
        regions={data.regions}
        src={data.src}
      />
      <LegendBar regions={data.regions.regions} />
    </div>
  );
});

InteractiveImageRenderer.displayName = 'InteractiveImageRenderer';

export default InteractiveImageRenderer;
