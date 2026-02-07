'use client';

import { Form, type FormGroupItemType, Icon, Select } from '@lobehub/ui';
import { Button, Skeleton, message } from 'antd';
import isEqual from 'fast-deep-equal';
import { Loader2Icon, Mic, Plus } from 'lucide-react';
import { memo, useState } from 'react';
import useSWR from 'swr';

import { FORM_STYLE } from '@/const/layoutTokens';
import VoiceCloneModal from '@/features/AgentSetting/AgentTTS/VoiceCloneModal';
import { API_ENDPOINTS } from '@/services/_url';
import { useUserStore } from '@/store/user';
import { settingsSelectors } from '@/store/user/selectors';

import { elevenLabsModelOptions } from './const';

const ElevenLabs = memo(() => {
    const [form] = Form.useForm();
    const { tts } = useUserStore(settingsSelectors.currentSettings, isEqual);
    const [setSettings, isUserStateInit] = useUserStore((s) => [s.setSettings, s.isUserStateInit]);
    const [loading, setLoading] = useState(false);
    const [cloneModalOpen, setCloneModalOpen] = useState(false);

    // Fetch cloned voices from ElevenLabs API
    const { data: voicesData, mutate: refreshVoices } = useSWR(
        API_ENDPOINTS.voiceClone,
        async (url: string) => {
            const res = await fetch(url);
            if (!res.ok) return { voices: [] };
            return res.json();
        },
        { revalidateOnFocus: false },
    );

    const voiceOptions = (voicesData?.voices || []).map((v: any) => ({
        label: v.name,
        value: v.voice_id,
    }));

    if (!isUserStateInit) return <Skeleton active paragraph={{ rows: 5 }} title={false} />;

    const elevenlabs: FormGroupItemType = {
        children: [
            {
                children: <Select options={elevenLabsModelOptions} />,
                desc: 'TTS model to use for voice synthesis',
                label: 'ElevenLabs Model',
                name: ['elevenlabs', 'modelId'],
            },
            {
                children: (
                    <Select
                        notFoundContent={'No voices found. Clone a voice first.'}
                        options={voiceOptions}
                        placeholder={'Select a cloned voice'}
                    />
                ),
                desc: 'Select a cloned voice to use for speech',
                label: 'Voice',
                name: ['elevenlabs', 'voiceId'],
            },
            {
                children: (
                    <Button
                        icon={<Icon icon={Plus} />}
                        onClick={() => setCloneModalOpen(true)}
                        type={'primary'}
                    >
                        Clone New Voice
                    </Button>
                ),
                desc: 'Upload audio samples to create a custom voice clone',
                label: 'Voice Cloning',
            },
        ],
        extra: loading && <Icon icon={Loader2Icon} size={16} spin style={{ opacity: 0.5 }} />,
        title: (
            <span style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
                <Icon icon={Mic} size={16} />
                ElevenLabs
            </span>
        ),
    };

    return (
        <>
            <Form
                form={form}
                initialValues={tts}
                items={[elevenlabs]}
                itemsType={'group'}
                onValuesChange={async (values) => {
                    setLoading(true);
                    await setSettings({
                        tts: values,
                    });
                    setLoading(false);
                }}
                variant={'borderless'}
                {...FORM_STYLE}
            />
            <VoiceCloneModal
                onCancel={() => setCloneModalOpen(false)}
                onSuccess={() => {
                    refreshVoices();
                    message.success('Voice cloned successfully!');
                }}
                open={cloneModalOpen}
            />
        </>
    );
});

export default ElevenLabs;
