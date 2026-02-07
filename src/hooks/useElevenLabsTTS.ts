import { type TTSOptions, useStreamAudioPlayer } from '@lobehub/tts/react';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';

import { API_ENDPOINTS } from '@/services/_url';

export interface ElevenLabsTTSOptions extends TTSOptions {
  model_id?: string;
  voice?: string;
}

export const useElevenLabsTTS = (
  content: string,
  {
    model_id,
    voice,
    onError: _onError,
    onSuccess: _onSuccess,
    onFinish,
    onStart,
    onStop,
    ...restSWRConfig
  }: ElevenLabsTTSOptions = {},
) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  const { load, reset, ...restAudio } = useStreamAudioPlayer();

  const fetchTTS = useCallback(
    async () => {
      const response = await fetch(API_ENDPOINTS.elevenlabs, {
        body: JSON.stringify({
          model_id: model_id || 'eleven_multilingual_v2',
          text: content,
          voice_id: voice,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('ElevenLabs TTS fetch failed');
      }

      return response.arrayBuffer();
    },
    [content, model_id, voice],
  );

  const handleReset = useCallback(() => {
    setShouldFetch(false);
    setIsGlobalLoading(false);
    reset();
  }, [reset]);

  const handleStop = useCallback(() => {
    onStop?.();
    handleReset();
  }, [handleReset, onStop]);

  const { isLoading, error, mutate } = useSWR(
    shouldFetch && content ? ['elevenlabs-tts', content, voice, model_id].join('-') : null,
    fetchTTS,
    {
      onError: (err: any, key: string, config: any) => {
        _onError?.(err, key, config);
        console.error('Error ElevenLabs TTS:', err);
        handleReset();
      },
      onSuccess: (data: ArrayBuffer, key: string, config: any) => {
        _onSuccess?.(data, key, config);
        load(data);
        const buffers = [...restAudio.arrayBuffers, data].filter(Boolean);
        onFinish?.(buffers as any, key, config);
        setShouldFetch(false);
        setIsGlobalLoading(false);
      },
      ...restSWRConfig,
    },
  );

  const handleStart = useCallback(() => {
    if (!content || isLoading) return;
    onStart?.();
    reset();
    setShouldFetch(true);
    setIsGlobalLoading(true);
  }, [content, isLoading, onStart, reset]);

  useEffect(() => {
    handleReset();
    return () => {
      handleReset();
    };
  }, [content]);

  return {
    audio: restAudio,
    canStart: !isLoading && !!content,
    error,
    isGlobalLoading,
    isLoading,
    mutate,
    start: handleStart,
    stop: handleStop,
  };
};
