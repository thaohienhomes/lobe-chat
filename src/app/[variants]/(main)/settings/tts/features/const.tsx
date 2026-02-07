import { OpenAI } from '@lobehub/icons';
import type { SelectProps } from '@lobehub/ui';

import { LabelRenderer } from '@/components/ModelSelect';

export const opeanaiTTSOptions: SelectProps['options'] = [
  {
    label: <LabelRenderer Icon={OpenAI.Avatar} label={'gpt-4o-mini-tts'} />,
    value: 'gpt-4o-mini-tts',
  },
  {
    label: <LabelRenderer Icon={OpenAI.Avatar} label={'tts-1'} />,
    value: 'tts-1',
  },
  {
    label: <LabelRenderer Icon={OpenAI.Avatar} label={'tts-1-hd'} />,
    value: 'tts-1-hd',
  },
];

export const opeanaiSTTOptions: SelectProps['options'] = [
  {
    label: <LabelRenderer Icon={OpenAI.Avatar} label={'whisper-1'} />,
    value: 'whisper-1',
  },
];

export const sttOptions: SelectProps['options'] = [
  {
    label: 'OpenAI',
    value: 'openai',
  },
  {
    label: 'Browser',
    value: 'browser',
  },
];

export const elevenLabsModelOptions: SelectProps['options'] = [
  {
    label: 'Eleven Multilingual v2',
    value: 'eleven_multilingual_v2',
  },
  {
    label: 'Eleven Turbo v2.5',
    value: 'eleven_turbo_v2_5',
  },
  {
    label: 'Eleven Monolingual v1',
    value: 'eleven_monolingual_v1',
  },
];
