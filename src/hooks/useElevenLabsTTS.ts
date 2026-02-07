import { TTSOptions } from '@lobehub/tts/react';
// @ts-ignore
import { useTTS } from '@lobehub/tts/react/useTTS';
import { useCallback, useMemo } from 'react';

import { API_ENDPOINTS } from '@/services/_url';

export interface ElevenLabsTTSOptions extends TTSOptions {
  model_id?: string;
  voice?: string;
}

export const useElevenLabsTTS = (
  content: string,
  { model_id, voice, ...options }: ElevenLabsTTSOptions,
) => {
  const fetchTTS = useCallback(
    async (segmentText: string) => {
      const response = await fetch(API_ENDPOINTS.elevenlabs, {
        body: JSON.stringify({
          model_id,
          text: segmentText,
          voice_id: voice,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('ElevenLabs TTS fetch failed');
      }

      return await response.arrayBuffer();
    },
    [model_id, voice],
  );

  const ttsOptions = useMemo(
    () => ({
      ...options,
    }),
    [options],
  );

  return useTTS(content, content, fetchTTS, ttsOptions);
};
