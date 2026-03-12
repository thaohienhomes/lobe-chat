'use client';

import { ArtifactType } from '@lobechat/types';
import { Highlighter, Mermaid } from '@lobehub/ui';
import { Result } from 'antd';
import { createStyles } from 'antd-style';
import { useSearchParams } from 'next/navigation';
import { Suspense, memo, useMemo } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    max-width: 960px;
    min-height: 100vh;
    margin-block: 0;
    margin-inline: auto;
    padding-block: 32px;
    padding-inline: 24px;

    background: ${token.colorBgLayout};
  `,
  content: css`
    overflow: auto;

    padding: 24px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 12px;

    background: ${token.colorBgContainer};
  `,
  header: css`
    font-size: 20px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  subtitle: css`
    font-size: 13px;
    color: ${token.colorTextSecondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,
}));

/**
 * Decodes a shared artifact from URL search param `d`.
 * Format: base64url(JSON({type, title, content}))
 */
function decodeArtifact(encoded: string): { content: string; title: string; type: string } | null {
  try {
    // base64url → base64 → binary → Uint8Array → UTF-8 string
    const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/');
    const binStr = atob(base64);
    const bytes = Uint8Array.from(binStr, (c) => c.codePointAt(0)!);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const ArtifactViewer = memo(() => {
  const { styles } = useStyles();
  const searchParams = useSearchParams();
  const encoded = searchParams.get('d');

  const artifact = useMemo(() => {
    if (!encoded) return null;
    return decodeArtifact(encoded);
  }, [encoded]);

  if (!artifact) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Result
          status="warning"
          subTitle="The artifact link is invalid or has expired."
          title="No artifact found"
        />
      </Center>
    );
  }

  const renderContent = () => {
    switch (artifact.type) {
      case ArtifactType.SVG: {
        return <div dangerouslySetInnerHTML={{ __html: artifact.content }} />;
      }
      case ArtifactType.Mermaid: {
        return <Mermaid>{artifact.content}</Mermaid>;
      }
      case ArtifactType.React:
      case ArtifactType.Code:
      case ArtifactType.Python: {
        const lang = artifact.type === ArtifactType.Python ? 'python' : 'tsx';
        return (
          <Highlighter language={lang} style={{ fontSize: 13 }}>
            {artifact.content}
          </Highlighter>
        );
      }
      default: {
        // For HTML and other types, render in sandboxed iframe
        const blob = new Blob([artifact.content], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        return (
          <iframe
            sandbox="allow-scripts"
            src={blobUrl}
            style={{ border: 'none', height: '70vh', width: '100%' }}
            title={artifact.title}
          />
        );
      }
    }
  };

  return (
    <div className={styles.container}>
      <Flexbox gap={24}>
        <Flexbox gap={4}>
          <span className={styles.subtitle}>{artifact.type}</span>
          <span className={styles.header}>{artifact.title}</span>
        </Flexbox>
        <div className={styles.content}>{renderContent()}</div>
        <Center>
          <span style={{ color: '#888', fontSize: 12 }}>Shared from Phở Chat · pho.chat</span>
        </Center>
      </Flexbox>
    </div>
  );
});

ArtifactViewer.displayName = 'ArtifactViewer';

export default function ArtifactPage() {
  return (
    <Suspense>
      <ArtifactViewer />
    </Suspense>
  );
}
