import { Markdown, Mermaid } from '@lobehub/ui';
import dynamic from 'next/dynamic';
import { memo } from 'react';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';
import { ArtifactType } from '@/types/artifact';

import ArtifactErrorBoundary from './ErrorBoundary';
import HTMLRenderer from './HTML';
import SVGRender from './SVG';

const ReactRenderer = dynamic(() => import('./React'), { ssr: false });
const InteractiveImageRenderer = dynamic(() => import('./InteractiveImage'), { ssr: false });
const GenerativeDiagramRenderer = dynamic(() => import('./GenerativeDiagram'), { ssr: false });
const ContentVisualizerRenderer = dynamic(() => import('./ContentVisualizer'), { ssr: false });
const AIRenderingRenderer = dynamic(() => import('./AIRendering'), { ssr: false });
const TranslatedDocumentRenderer = dynamic(() => import('./TranslatedDocument'), { ssr: false });

const RendererInner = memo<{ content: string; type?: string }>(({ content, type }) => {
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

    case ArtifactType.TranslatedDocument: {
      return <TranslatedDocumentRenderer content={content} />;
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

const Renderer = memo<{ content: string; type?: string }>(({ content, type }) => {
  const artifactTitle = useChatStore((s) => chatPortalSelectors.artifactTitle(s));

  return (
    <ArtifactErrorBoundary artifactTitle={artifactTitle}>
      <RendererInner content={content} type={type} />
    </ArtifactErrorBoundary>
  );
});

export default Renderer;
