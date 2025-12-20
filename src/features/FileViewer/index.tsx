'use client';

import { css, cx } from 'antd-style';
import dynamic from 'next/dynamic';
import { CSSProperties, memo } from 'react';

import CircleLoading from '@/components/Loading/CircleLoading';
import { FileListItem } from '@/types/files';

import NotSupport from './NotSupport';
import { FileViewRenderers } from './Renderer';

// Lazy load heavy components for better bundle size
const PDFRenderer = dynamic(() => import('./Renderer/PDF'), {
  loading: () => <CircleLoading />,
  ssr: false,
});

const DocViewer = dynamic(() => import('@cyntler/react-doc-viewer'), {
  loading: () => <CircleLoading />,
  ssr: false,
});

const container = css`
  background: transparent !important;

  #proxy-renderer {
    height: 100%;
  }
`;

interface FileViewerProps extends FileListItem {
  className?: string;
  style?: CSSProperties;
}

const FileViewer = memo<FileViewerProps>(({ id, style, fileType, url, name }) => {
  if (fileType?.toLowerCase() === 'pdf' || name?.toLowerCase().endsWith('.pdf')) {
    return <PDFRenderer fileId={id} url={url} />;
  }

  return (
    <DocViewer
      className={cx(container)}
      config={{
        header: { disableHeader: true },
        noRenderer: { overrideComponent: NotSupport },
      }}
      documents={[{ fileName: name, fileType, uri: url }]}
      pluginRenderers={FileViewRenderers}
      style={style}
    />
  );
});

export default FileViewer;
