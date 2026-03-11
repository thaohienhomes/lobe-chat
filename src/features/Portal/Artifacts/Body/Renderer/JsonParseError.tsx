import { ActionIcon, Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { AlertTriangle, Code2, Sparkles } from 'lucide-react';
import { memo, useCallback } from 'react';
import { Center, Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { ArtifactDisplayMode } from '@/store/chat/slices/portal/initialState';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    padding: 24px;
    border-radius: 8px;
    background: ${token.colorBgContainer};
  `,
  rawPreview: css`
    overflow: auto;

    width: 100%;
    max-height: 100px;
    padding: 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 6px;

    font-family: monospace;
    font-size: 11px;
    line-height: 1.4;
    color: ${token.colorTextSecondary};
    word-break: break-all;

    background: ${token.colorFillQuaternary};
  `,
  title: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorText};
  `,
  typeBadge: css`
    font-size: 11px;
    color: ${token.colorTextTertiary};
  `,
}));

interface JsonParseErrorProps {
  /** Raw content that failed to parse */
  content: string;
  /** Artifact type name for display */
  typeName: string;
}

const JsonParseError = memo<JsonParseErrorProps>(({ content, typeName }) => {
  const { styles } = useStyles();

  const handleFixWithAI = useCallback(() => {
    const errorPrompt = `The ${typeName} artifact failed to parse. The generated JSON is malformed:\n\`\`\`\n${content.slice(0, 300)}\n\`\`\`\nPlease fix the JSON format and regenerate.`;

    const inputElement = document.querySelector('textarea') as HTMLTextAreaElement;
    if (inputElement) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value',
      )?.set;
      nativeInputValueSetter?.call(inputElement, errorPrompt);
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.focus();
    }
  }, [content, typeName]);

  const handleViewCode = useCallback(() => {
    useChatStore.setState(
      { portalArtifactDisplayMode: ArtifactDisplayMode.Code },
      false,
      'jsonErrorViewCode',
    );
  }, []);

  return (
    <Center className={styles.container} gap={12} height={'100%'}>
      <Icon color={'warning'} icon={AlertTriangle} size={32} />
      <Flexbox align={'center'} className={styles.title} gap={2}>
        Invalid JSON for {typeName}
      </Flexbox>
      <div className={styles.rawPreview}>{content.slice(0, 200)}...</div>
      <Flexbox gap={8} horizontal>
        <ActionIcon
          icon={Sparkles}
          onClick={handleFixWithAI}
          size={'small'}
          title={'Fix with AI'}
        />
        <ActionIcon icon={Code2} onClick={handleViewCode} size={'small'} title={'View Raw'} />
      </Flexbox>
    </Center>
  );
});

JsonParseError.displayName = 'JsonParseError';

export default JsonParseError;
