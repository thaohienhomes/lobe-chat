import { memo, useCallback, useMemo, useState } from 'react';

import type { InteractiveImageProps, InteractiveRegion } from '../types';
import DetailPanel from './DetailPanel';
import FollowUpChips from './FollowUpChips';
import ImageLayer from './ImageLayer';
import OverlayLayer from './OverlayLayer';

/**
 * InteractiveImage — parent container combining all sub-components.
 *
 * Renders an image with clickable SVG hotspots, a slide-out detail panel,
 * and follow-up suggestion chips. Supports zoom/pan, keyboard navigation,
 * and touch interactions.
 *
 * @see docs/prd/prd-interactive-generative-ui.md Section 5.1 & 8.2
 */
const InteractiveImage = memo<InteractiveImageProps>(
  ({ src, alt, regions, onRegionSelect, onFollowUp }) => {
    const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
    const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null);

    const activeRegion = useMemo(
      () => regions.regions.find((r) => r.id === activeRegionId) ?? null,
      [regions.regions, activeRegionId],
    );

    const followUpQuestions = useMemo(
      () => activeRegion?.follow_ups ?? [],
      [activeRegion],
    );

    const handleRegionClick = useCallback(
      (region: InteractiveRegion) => {
        const nextId = activeRegionId === region.id ? null : region.id;
        setActiveRegionId(nextId);
        const nextRegion = nextId ? region : null;
        onRegionSelect?.(nextRegion);
      },
      [activeRegionId, onRegionSelect],
    );

    const handleRegionHover = useCallback(
      (region: InteractiveRegion | null) => {
        setHoveredRegionId(region?.id ?? null);
      },
      [],
    );

    const handlePanelClose = useCallback(() => {
      setActiveRegionId(null);
      onRegionSelect?.(null);
    }, [onRegionSelect]);

    const handleFollowUp = useCallback(
      (question: string) => {
        onFollowUp?.(question);
      },
      [onFollowUp],
    );

    return (
      <div
        aria-label={`Interactive ${regions.image_type} image: ${regions.context}`}
        className="relative flex w-full flex-col gap-2 rounded-xl bg-[#0F172A] p-2"
        role="region"
      >
        {/* Image + Overlay + Detail Panel */}
        <ImageLayer alt={alt} src={src}>
          <OverlayLayer
            activeRegionId={activeRegionId}
            hoveredRegionId={hoveredRegionId}
            onRegionClick={handleRegionClick}
            onRegionHover={handleRegionHover}
            regions={regions.regions}
          />
          <DetailPanel
            onClose={handlePanelClose}
            region={activeRegion}
          />
        </ImageLayer>

        {/* Follow-up chips shown below the image when a region is selected */}
        {followUpQuestions.length > 0 && (
          <FollowUpChips
            onSelect={handleFollowUp}
            questions={followUpQuestions}
          />
        )}

        {/* Context description for screen readers */}
        <p className="sr-only">{regions.context}</p>
      </div>
    );
  },
);

InteractiveImage.displayName = 'InteractiveImage';

export default InteractiveImage;
