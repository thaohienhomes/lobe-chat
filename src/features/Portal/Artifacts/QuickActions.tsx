'use client';

import { ArtifactType } from '@lobechat/types';
import { ActionIcon, Icon } from '@lobehub/ui';
import { Dropdown, type MenuProps } from 'antd';
import { createStyles } from 'antd-style';
import {
  AlertTriangle,
  BookOpenCheck,
  Bug,
  ClipboardList,
  Crosshair,
  FileText,
  MessageSquarePlus,
  Minimize2,
  Pencil,
  Rocket,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';

const useStyles = createStyles(({ css, token }) => ({
  fab: css`
    position: absolute;
    z-index: 10;
    inset-block-end: 16px;
    inset-inline-end: 16px;

    width: 36px;
    height: 36px;
    border-radius: 50%;

    color: ${token.colorBgContainer};

    background: ${token.colorPrimary};
    box-shadow: ${token.boxShadow};

    transition:
      transform 0.2s,
      box-shadow 0.2s;

    &:hover {
      transform: scale(1.1);
      box-shadow: ${token.boxShadowSecondary};
    }
  `,
}));

// ── Action definitions per type ──────────────────────────────────────────

interface QuickAction {
  icon: any;
  key: string;
  label: string;
  prompt: string;
}

const TEXT_ACTIONS: QuickAction[] = [
  {
    icon: Pencil,
    key: 'suggest-edits',
    label: 'Suggest edits',
    prompt:
      'Please review this artifact and suggest inline edits. Show what should be changed and why.',
  },
  {
    icon: Minimize2,
    key: 'make-shorter',
    label: 'Make shorter',
    prompt:
      'Make this artifact more concise. Remove unnecessary words and tighten the writing while keeping all key information.',
  },
  {
    icon: ScrollText,
    key: 'make-longer',
    label: 'Make longer',
    prompt:
      'Expand this artifact with more detail, examples, and deeper explanations. Keep the same structure.',
  },
  {
    icon: Wand2,
    key: 'simplify',
    label: 'Simplify language',
    prompt:
      'Simplify the language in this artifact. Use shorter sentences, common words, and clearer phrasing. Target a general audience reading level.',
  },
];

const CODE_ACTIONS: QuickAction[] = [
  {
    icon: BookOpenCheck,
    key: 'review',
    label: 'Review code',
    prompt:
      'Review this code artifact. Point out potential bugs, performance issues, and suggest improvements. Add explanatory comments.',
  },
  {
    icon: Bug,
    key: 'fix-bugs',
    label: 'Fix bugs',
    prompt:
      'Scan this code for bugs and fix them. Look for: null reference errors, off-by-one mistakes, missing edge cases, and logic errors. Return the corrected artifact.',
  },
  {
    icon: Rocket,
    key: 'optimize',
    label: 'Optimize',
    prompt:
      'Optimize this code for better performance. Look for: unnecessary re-renders, expensive computations, memory leaks, and missing memoization. Return the optimized artifact.',
  },
  {
    icon: ShieldCheck,
    key: 'add-error-handling',
    label: 'Add error handling',
    prompt:
      'Add proper error handling to this code: try/catch blocks, error boundaries, fallback states, and user-friendly error messages. Return the updated artifact.',
  },
  {
    icon: MessageSquarePlus,
    key: 'add-comments',
    label: 'Add comments',
    prompt:
      'Add clear, helpful comments to this code. Focus on explaining the "why" not the "what". Include JSDoc for exported functions.',
  },
];

const RESEARCH_ACTIONS: QuickAction[] = [
  {
    icon: FileText,
    key: 'add-citations',
    label: 'Add citations',
    prompt:
      'Find and add relevant academic citations to support the claims in this artifact. Format citations in Vancouver style.',
  },
  {
    icon: ShieldCheck,
    key: 'grade-evidence',
    label: 'Grade evidence (GRADE)',
    prompt:
      'Assess the quality of evidence presented using the GRADE framework. Rate each key finding as High, Moderate, Low, or Very Low certainty. Show a summary table.',
  },
  {
    icon: BookOpenCheck,
    key: 'check-methodology',
    label: 'Check methodology',
    prompt:
      'Review the methodology section against CONSORT/STROBE reporting guidelines. Highlight any gaps or areas that need improvement.',
  },
  {
    icon: Crosshair,
    key: 'extract-pico',
    label: 'Extract PICO',
    prompt:
      'Extract the PICO elements from this research: Population (who), Intervention (what treatment/exposure), Comparison (versus what), Outcome (measured results). Present in a structured table.',
  },
  {
    icon: ClipboardList,
    key: 'check-prisma',
    label: 'Check PRISMA',
    prompt:
      'Validate this content against the PRISMA 2020 checklist. List each checklist item, whether it is adequately addressed (✅), partially addressed (⚠️), or missing (❌), with specific suggestions for improvement.',
  },
  {
    icon: AlertTriangle,
    key: 'risk-of-bias',
    label: 'Risk of Bias',
    prompt:
      'Assess the risk of bias using the RoB 2 framework (for RCTs) or ROBINS-I (for non-randomized studies). Evaluate each domain: randomization, deviations from intervention, missing data, outcome measurement, selection of reported results. Rate overall bias as Low, Some Concerns, or High.',
  },
];

// ── Determine which actions to show ──────────────────────────────────────

function getActionsForType(type?: string): QuickAction[] {
  switch (type) {
    case ArtifactType.React:
    case ArtifactType.Code:
    case ArtifactType.Python: {
      return CODE_ACTIONS;
    }

    case ArtifactType.ContentVisualizer: {
      return [...TEXT_ACTIONS, ...RESEARCH_ACTIONS];
    }

    case ArtifactType.Mermaid:
    case ArtifactType.SVG:
    case ArtifactType.InteractiveImage:
    case ArtifactType.GenerativeDiagram: {
      return TEXT_ACTIONS.slice(0, 2);
    }

    default: {
      return TEXT_ACTIONS;
    }
  }
}

// ── Component ────────────────────────────────────────────────────────────

const QuickActions = memo(() => {
  const { styles } = useStyles();

  const [artifactType, artifactTitle] = useChatStore((s) => [
    chatPortalSelectors.artifactType(s),
    chatPortalSelectors.artifactTitle(s),
  ]);

  const actions = useMemo(() => getActionsForType(artifactType), [artifactType]);

  const handleAction = useCallback(
    (action: QuickAction) => {
      const state = useChatStore.getState();
      const messageId = chatPortalSelectors.artifactMessageId(state) || '';
      const artifactCode = chatPortalSelectors.artifactCode(messageId)(state);

      if (!artifactCode) return;

      // Build full prompt with artifact context
      const fullPrompt = `Here is the current artifact "${artifactTitle || 'Untitled'}":\n\`\`\`\n${artifactCode.slice(0, 8000)}\n\`\`\`\n\n${action.prompt}`;

      // Use chat store to set the input message
      useChatStore.getState().updateInputMessage(fullPrompt);
    },
    [artifactTitle],
  );

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      actions.map((action) => ({
        icon: <Icon icon={action.icon} size={'small'} />,
        key: action.key,
        label: action.label,
        onClick: () => handleAction(action),
      })),
    [actions, handleAction],
  );

  if (actions.length === 0) return null;

  return (
    <Dropdown menu={{ items: menuItems }} placement="topRight" trigger={['click']}>
      <ActionIcon
        className={styles.fab}
        icon={Sparkles}
        size={{ blockSize: 36 }}
        title={'Quick Actions'}
      />
    </Dropdown>
  );
});

QuickActions.displayName = 'QuickActions';

export default QuickActions;
