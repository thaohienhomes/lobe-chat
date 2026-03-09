import { Markdown, Mermaid } from '@lobehub/ui';
import dynamic from 'next/dynamic';
import { memo } from 'react';

import { ArtifactType } from '@/types/artifact';

import HTMLRenderer from './HTML';
import SVGRender from './SVG';

const ReactRenderer = dynamic(() => import('./React'), { ssr: false });
const InteractiveImageRenderer = dynamic(() => import('./InteractiveImage'), { ssr: false });
const GenerativeDiagramRenderer = dynamic(() => import('./GenerativeDiagram'), { ssr: false });
const ContentVisualizerRenderer = dynamic(() => import('./ContentVisualizer'), { ssr: false });
const AIRenderingRenderer = dynamic(() => import('./AIRendering'), { ssr: false });

const Renderer = memo<{ content: string; type?: string }>(({ content, type }) => {
  switch (type) {
    case ArtifactType.React: {
      return <ReactRenderer code={content} />;
    }

    case ArtifactType.InteractiveImage: {
      return <InteractiveImageRenderer content={content} />;
    }

    case ArtifactType.GenerativeDiagram: {
      return <GenerativeDiagramRenderer content={content} />;
    }

    case ArtifactType.ContentVisualizer: {
      return <ContentVisualizerRenderer content={content} />;
    }

    case ArtifactType.AIRendering: {
      return <AIRenderingRenderer content={content} />;
    }

    case ArtifactType.SVG: {
      return <SVGRender content={content} />;
    }

    case ArtifactType.Mermaid: {
      return <Mermaid variant={'borderless'}>{content}</Mermaid>;
    }

    case 'text/markdown': {
      return <Markdown style={{ overflow: 'auto' }}>{content}</Markdown>;
    }

    default: {
      return <HTMLRenderer htmlContent={content} />;
    }
  }
});

export default Renderer;
