import { ArtifactType } from '@lobechat/types';
import { ActionIcon, Icon, Segmented, Text } from '@lobehub/ui';
import { ConfigProvider, Dropdown, type MenuProps } from 'antd';
import { cx } from 'antd-style';
import { ArrowLeft, CodeIcon, Columns2 as ColumnsIcon, Download, EyeIcon } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';
import { ArtifactDisplayMode } from '@/store/chat/slices/portal/initialState';
import { oneLineEllipsis } from '@/styles';

const Header = () => {
  const { t } = useTranslation('portal');

  const [displayMode, artifactType, artifactTitle, isArtifactTagClosed, closeArtifact] =
    useChatStore((s) => {
      const messageId = chatPortalSelectors.artifactMessageId(s) || '';

      return [
        s.portalArtifactDisplayMode,
        chatPortalSelectors.artifactType(s),
        chatPortalSelectors.artifactTitle(s),
        chatPortalSelectors.isArtifactTagClosed(messageId)(s),
        s.closeArtifact,
      ];
    });

  // show switch only when artifact is closed and the type is not code
  const showSwitch = isArtifactTagClosed && artifactType !== ArtifactType.Code;

  const getArtifactCode = useCallback(() => {
    const state = useChatStore.getState();
    const messageId = chatPortalSelectors.artifactMessageId(state) || '';
    return chatPortalSelectors.artifactCode(messageId)(state);
  }, []);

  const handleDownloadHTML = useCallback(() => {
    const code = getArtifactCode();
    if (!code) return;
    const blob = new Blob([code], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatPortalSelectors.artifactTitle(useChatStore.getState()) || 'artifact'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [getArtifactCode]);

  const handlePrintPDF = useCallback(() => {
    const code = getArtifactCode();
    if (!code) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(code);
    printWindow.document.close();
    // Wait for content and styles to load before printing
    printWindow.addEventListener('load', () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    });
  }, [getArtifactCode]);

  const downloadMenuItems: MenuProps['items'] = [
    {
      key: 'pdf',
      label: '📄 Download PDF',
      onClick: handlePrintPDF,
    },
    {
      key: 'html',
      label: '🌐 Download HTML',
      onClick: handleDownloadHTML,
    },
  ];

  const showDownload = isArtifactTagClosed;

  return (
    <Flexbox align={'center'} flex={1} gap={12} horizontal justify={'space-between'} width={'100%'}>
      <Flexbox align={'center'} gap={4} horizontal>
        <ActionIcon icon={ArrowLeft} onClick={() => closeArtifact()} size={'small'} />
        <Text className={cx(oneLineEllipsis)} type={'secondary'}>
          {artifactTitle}
        </Text>
      </Flexbox>
      <Flexbox align={'center'} gap={8} horizontal>
        <ConfigProvider
          theme={{
            token: {
              borderRadiusSM: 16,
              borderRadiusXS: 16,
              fontSize: 12,
            },
          }}
        >
          {showSwitch && (
            <Segmented
              onChange={(value) => {
                useChatStore.setState({ portalArtifactDisplayMode: value as ArtifactDisplayMode });
              }}
              options={[
                {
                  icon: <Icon icon={EyeIcon} />,
                  label: t('artifacts.display.preview'),
                  value: ArtifactDisplayMode.Preview,
                },
                {
                  icon: <Icon icon={CodeIcon} />,
                  label: t('artifacts.display.code'),
                  value: ArtifactDisplayMode.Code,
                },
                {
                  icon: <Icon icon={ColumnsIcon} />,
                  label: t('artifacts.display.split', 'Split'),
                  value: ArtifactDisplayMode.Split,
                },
              ]}
              size={'small'}
              value={displayMode}
            />
          )}
        </ConfigProvider>
        {showDownload && (
          <Dropdown menu={{ items: downloadMenuItems }} trigger={['click']}>
            <ActionIcon icon={Download} size={'small'} title={'Download'} />
          </Dropdown>
        )}
      </Flexbox>
    </Flexbox>
  );
};

export default Header;
