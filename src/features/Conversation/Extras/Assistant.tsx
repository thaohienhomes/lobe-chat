import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { LOADING_FLAT } from '@/const/message';
import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';
import { ChatMessage } from '@/types/message';

import { RenderMessageExtra } from '../types';
import ExtraContainer from './ExtraContainer';
import ResearchSuggestion from './ResearchSuggestion';
import TTS from './TTS';
import Translate from './Translate';
import Usage from './Usage';

export const AssistantMessageExtra: RenderMessageExtra = memo<ChatMessage>(
  ({ extra, id, content, metadata, tools }) => {
    const loading = useChatStore(chatSelectors.isMessageGenerating(id));

    // Find the user's original question (the message just before this assistant reply)
    const userQuestion = useChatStore((s) => {
      const messages = chatSelectors.activeBaseChats(s);
      const idx = messages.findIndex((m) => m.id === id);
      if (idx > 0) {
        const prev = messages[idx - 1];
        if (prev.role === 'user') return prev.content;
      }
      return '';
    });

    return (
      <Flexbox gap={8} style={{ marginTop: !!tools?.length ? 8 : 4 }}>
        {content !== LOADING_FLAT && extra?.fromModel && (
          <Usage
            metadata={metadata || {}}
            model={extra?.fromModel}
            provider={extra.fromProvider!}
          />
        )}
        <>
          {!!extra?.tts && (
            <ExtraContainer>
              <TTS content={content} id={id} loading={loading} {...extra?.tts} />
            </ExtraContainer>
          )}
          {!!extra?.translate && (
            <ExtraContainer>
              <Translate id={id} loading={loading} {...extra?.translate} />
            </ExtraContainer>
          )}
        </>
        {/* Research suggestion banner — shown when user question has research intent */}
        {content !== LOADING_FLAT && !loading && userQuestion && (
          <ResearchSuggestion userQuestion={userQuestion} />
        )}
      </Flexbox>
    );
  },
);
