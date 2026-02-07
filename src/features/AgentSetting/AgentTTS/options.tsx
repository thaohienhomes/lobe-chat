import { Azure, OpenAI } from '@lobehub/icons';
import { Icon } from '@lobehub/ui';
import type { SelectProps } from '@lobehub/ui';
import { Mic } from 'lucide-react';

import { LabelRenderer } from '@/components/ModelSelect';

const ElevenLabsIcon: any = (props: any) => <Icon icon={Mic} {...props} />;

export const ttsOptions: SelectProps['options'] = [
  {
    label: <LabelRenderer Icon={OpenAI.Avatar} label={'OpenAI'} />,
    value: 'openai',
  },
  {
    label: <LabelRenderer Icon={Azure.Avatar} label={'Edge Speech'} />,
    value: 'edge',
  },
  {
    label: <LabelRenderer Icon={Azure.Avatar} label={'Microsoft Speech'} />,
    value: 'microsoft',
  },
  {
    label: <LabelRenderer Icon={ElevenLabsIcon} label={'ElevenLabs'} />,
    value: 'elevenlabs',
  },
];
