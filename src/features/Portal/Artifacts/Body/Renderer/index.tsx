import { Markdown, Mermaid } from '@lobehub/ui';
import dynamic from 'next/dynamic';
import { memo } from 'react';

import { ArtifactType } from '@/types/artifact';

import HTMLRenderer from './HTML';
import SVGRender from './SVG';

const ReactRenderer = dynamic(() => import('./React'), { ssr: false });

const Renderer = memo<{ content: string; type?: string }>(({ content, type }) => {
  switch (type) {
    case ArtifactType.React: {
      return <ReactRenderer code={content} />;
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
