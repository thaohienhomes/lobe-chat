import { memo, useCallback, useMemo, useState } from 'react';

import BeforeAfterView from '@/components/InteractiveUI/BeforeAfterView';
import type { RenderStyle } from '@/services/ai-rendering/types';

import JsonParseError from './JsonParseError';

interface AIRenderingRendererProps {
  content: string;
}

interface AIRenderingData {
  afterSrc?: string;
  beforeSrc: string;
  renderStyle?: RenderStyle;
}

function parseAIRenderingData(content: string): AIRenderingData | null {
  try {
    const parsed = JSON.parse(content) as AIRenderingData;
    if (!parsed.beforeSrc) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * AIRenderingRenderer — Artifact renderer for AI Rendering & Virtual Staging.
 * Parses JSON content with beforeSrc/afterSrc and renders BeforeAfterView.
 */
const AIRenderingRenderer = memo<AIRenderingRendererProps>(({ content }) => {
  const [afterSrc, setAfterSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const data = useMemo(() => parseAIRenderingData(content), [content]);

  const handleRender = useCallback(
    async (style: RenderStyle) => {
      if (!data) return;
      setError(null);
      try {
        const response = await fetch('/api/ai-render', {
          body: JSON.stringify({
            imageUrl: data.beforeSrc,
            renderStyle: style,
          }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        });

        const result = await response.json();

        if (!result.success) {
          setError(result.error ?? 'Rendering failed');
          return;
        }

        setAfterSrc(result.imageUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error');
      }
    },
    [data],
  );

  if (!data) {
    return <JsonParseError content={content} typeName="AI Rendering" />;
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <BeforeAfterView
        afterSrc={data.afterSrc ?? afterSrc}
        beforeSrc={data.beforeSrc}
        onRender={handleRender}
        renderStyle={data.renderStyle}
      />
      {error && (
        <div className="rounded-lg bg-red-900/30 px-3 py-2 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
});

AIRenderingRenderer.displayName = 'AIRenderingRenderer';

export default AIRenderingRenderer;
