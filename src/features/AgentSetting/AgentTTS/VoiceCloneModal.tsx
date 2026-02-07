'use client';

import { Form, Icon, Modal } from '@lobehub/ui';
import { Button, type ModalProps, Upload, message } from 'antd';
import { Plus } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { API_ENDPOINTS } from '@/services/_url';

interface VoiceCloneModalProps extends ModalProps {
  onSuccess?: (voiceId: string) => void;
}

const VoiceCloneModal = memo(({ open, onCancel, onSuccess, ...rest }: VoiceCloneModalProps) => {
  const { t } = useTranslation('setting');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [fileList, setFileList] = useState<any[]>([]);

  const handleUpload = async () => {
    if (!name || fileList.length === 0) {
      message.error('Please provide a name and at least one audio sample');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      fileList.forEach((file) => {
        formData.append('files', file.originFileObj);
      });

      const res = await fetch(API_ENDPOINTS.voiceClone, {
        body: formData,
        method: 'POST',
      });

      const data = await res.json();

      if (res.ok) {
        message.success('Voice cloned successfully!');
        onSuccess?.(data.voice_id);
        onCancel?.(null as any);
        // Reset
        setName('');
        setFileList([]);
      } else {
        message.error(data.error || 'Failed to clone voice');
      }
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      footer={null}
      onCancel={onCancel}
      open={open}
      title={t('settingTTS.voiceClone.title') || 'Clone New Voice'}
      {...rest}
    >
      <Form layout="vertical">
        <Form.Item label={'Voice Name'} required>
          <input
            className={'ant-input'}
            onChange={(e) => setName(e.target.value)}
            placeholder={'e.g. My Secret Agent Voice'}
            value={name}
          />
        </Form.Item>
        <Form.Item
          desc={'Upload 1-2 minutes of clear audio for best results (WAV/MP3)'}
          label={'Audio Samples'}
          required
        >
          <Upload
            beforeUpload={() => false}
            fileList={fileList}
            multiple
            onChange={(info: any) => setFileList(info.fileList)}
          >
            <Button icon={<Icon icon={Plus} />}>Select Files</Button>
          </Upload>
        </Form.Item>
        <Form.Item>
          <Button block loading={loading} onClick={handleUpload} type={'primary'}>
            Start Cloning
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
});

export default VoiceCloneModal;
