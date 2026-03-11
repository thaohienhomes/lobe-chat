'use client';

import { ActionIcon, Icon } from '@lobehub/ui';
import { Input } from 'antd';
import { createStyles } from 'antd-style';
import { Bug, MessageSquare, Minimize2, Pencil, Send, X } from 'lucide-react';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';

const useStyles = createStyles(({ css, token }) => ({
  backdrop: css`
    position: fixed;
    z-index: 999;
    inset: 0;
  `,
  input: css`
    flex: 1;
    font-size: 12px;
  `,
  presetBtn: css`
    cursor: pointer;

    padding-block: 2px;
    padding-inline: 8px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 4px;

    font-size: 11px;
    color: ${token.colorTextSecondary};
    white-space: nowrap;

    background: ${token.colorBgContainer};

    transition: all 0.15s;

    &:hover {
      border-color: ${token.colorPrimary};
      color: ${token.colorPrimary};
    }
  `,
  selectedText: css`
    overflow: hidden;

    max-height: 48px;
    padding-block: 4px;
    padding-inline: 8px;
    border-radius: 4px;

    font-size: 11px;
    line-height: 1.4;
    color: ${token.colorTextSecondary};
    text-overflow: ellipsis;
    white-space: nowrap;

    background: ${token.colorFillQuaternary};
  `,
  toolbar: css`
    position: fixed;
    z-index: 1000;

    min-width: 320px;
    max-width: 420px;
    padding-block: 8px;
    padding-inline: 12px;
    border: 1px solid ${token.colorBorderSecondary};
    border-radius: 10px;

    background: ${token.colorBgElevated};
    box-shadow: ${token.boxShadowSecondary};
  `,
}));

// ── Preset actions ───────────────────────────────────────────────────────
const PRESET_ACTIONS = [
  { icon: Pencil, key: 'edit', label: 'Edit', prompt: '' }, // opens text input
  { icon: Bug, key: 'fix', label: 'Fix', prompt: 'Fix any issues in this section.' },
  {
    icon: MessageSquare,
    key: 'explain',
    label: 'Explain',
    prompt: 'Explain this section in detail.',
  },
  {
    icon: Minimize2,
    key: 'simplify',
    label: 'Simplify',
    prompt: 'Make this section simpler and more concise.',
  },
];

interface SelectionToolbarProps {
  containerRef: React.RefObject<HTMLElement | null>;
}

const SelectionToolbar = memo<SelectionToolbarProps>(({ containerRef }) => {
  const { styles } = useStyles();
  const [selectedText, setSelectedText] = useState<string>('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);

  // ── Detect text selection within the artifact container ─────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      // Small delay to let browser finalize selection
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.rangeCount) {
          return;
        }

        const text = selection.toString().trim();
        if (text.length < 3) return; // ignore tiny selections

        // Check that selection is within our container
        const range = selection.getRangeAt(0);
        if (!container.contains(range.commonAncestorContainer)) return;

        // Position toolbar near selection
        const rect = range.getBoundingClientRect();
        setSelectedText(text);
        setPosition({
          x: Math.max(16, rect.left + rect.width / 2 - 160), // center toolbar
          y: rect.bottom + 8, // below selection
        });
        setShowInput(false);
        setInputValue('');
      }, 50);
    };

    container.addEventListener('mouseup', handleMouseUp);
    return () => container.removeEventListener('mouseup', handleMouseUp);
  }, [containerRef]);

  // ── Close the toolbar ──────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setSelectedText('');
    setPosition(null);
    setShowInput(false);
    setInputValue('');
    window.getSelection()?.removeAllRanges();
  }, []);

  // ── Build and send the prompt ──────────────────────────────────────────
  const sendPrompt = useCallback(
    (instruction: string) => {
      const state = useChatStore.getState();
      const messageId = chatPortalSelectors.artifactMessageId(state) || '';
      const artifactCode = chatPortalSelectors.artifactCode(messageId)(state);
      const artifactTitle = chatPortalSelectors.artifactTitle(state);

      if (!artifactCode) return;

      const fullPrompt = `Here is the full artifact "${artifactTitle || 'Untitled'}":\n\`\`\`\n${artifactCode.slice(0, 8000)}\n\`\`\`\n\nThe user has selected this portion:\n\`\`\`\n${selectedText}\n\`\`\`\n\nUser instruction: ${instruction}\n\nPlease update ONLY the selected portion. Return the complete updated artifact.`;

      // Set chat input
      const inputElement = document.querySelector('textarea') as HTMLTextAreaElement;
      if (inputElement) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          'value',
        )?.set;
        nativeInputValueSetter?.call(inputElement, fullPrompt);
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        inputElement.focus();
      }

      // Close toolbar
      handleClose();
    },
    [selectedText, handleClose],
  );

  const handlePresetClick = useCallback(
    (action: (typeof PRESET_ACTIONS)[0]) => {
      if (action.key === 'edit') {
        setShowInput(true);
        return;
      }
      sendPrompt(action.prompt);
    },
    [sendPrompt],
  );

  const handleSubmit = useCallback(() => {
    if (!inputValue.trim()) return;
    sendPrompt(inputValue.trim());
  }, [inputValue, sendPrompt]);

  if (!selectedText || !position) return null;

  return (
    <>
      {/* Invisible backdrop to catch clicks outside */}
      <div className={styles.backdrop} onClick={handleClose} />

      <div
        className={styles.toolbar}
        ref={toolbarRef}
        style={{ left: position.x, top: position.y }}
      >
        {/* Selected text preview */}
        <div className={styles.selectedText}>
          &ldquo;{selectedText.slice(0, 80)}
          {selectedText.length > 80 ? '...' : ''}&rdquo;
        </div>

        {/* Preset buttons or input field */}
        <Flexbox gap={6} horizontal style={{ marginTop: 8 }} wrap={'wrap'}>
          {!showInput ? (
            <>
              {PRESET_ACTIONS.map((action) => (
                <button
                  className={styles.presetBtn}
                  key={action.key}
                  onClick={() => handlePresetClick(action)}
                  type="button"
                >
                  <Flexbox align={'center'} gap={4} horizontal>
                    <Icon icon={action.icon} size={'small'} />
                    {action.label}
                  </Flexbox>
                </button>
              ))}
              <ActionIcon
                icon={X}
                onClick={handleClose}
                size={'small'}
                style={{ marginLeft: 'auto' }}
              />
            </>
          ) : (
            <Flexbox flex={1} gap={6} horizontal>
              <Input
                autoFocus
                className={styles.input}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={handleSubmit}
                placeholder="Describe the change..."
                size="small"
                value={inputValue}
              />
              <ActionIcon icon={Send} onClick={handleSubmit} size={'small'} title="Send" />
              <ActionIcon icon={X} onClick={handleClose} size={'small'} title="Cancel" />
            </Flexbox>
          )}
        </Flexbox>
      </div>
    </>
  );
});

SelectionToolbar.displayName = 'SelectionToolbar';

export default SelectionToolbar;
