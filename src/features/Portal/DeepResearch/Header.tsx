'use client';

import { ActionIcon, Icon } from '@lobehub/ui';
import { Dropdown, type MenuProps } from 'antd';
import {
  BarChart3,
  ClipboardList,
  FileText,
  FlaskConical,
  GitBranch,
  LayoutGrid,
  Palette,
} from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';

interface VisualFormat {
  icon: any;
  key: string;
  label: string;
  prompt: string;
}

const VISUALIZE_FORMATS: VisualFormat[] = [
  {
    icon: GitBranch,
    key: 'prisma-flowchart',
    label: '📊 PRISMA Flowchart',
    prompt:
      'Based on the deep research results above, generate a PRISMA 2020-compliant flowchart as a Mermaid diagram artifact. Include: Identification (records identified from databases), Screening (records screened, excluded), Eligibility (full-text articles assessed), and Included (studies in final synthesis). Use exact numbers from the research.',
  },
  {
    icon: LayoutGrid,
    key: 'evidence-table',
    label: '📋 Evidence Summary Table',
    prompt:
      'Based on the deep research results above, create a React artifact with an interactive evidence summary table. Columns: Study (Author/Year), Design, Population (N), Intervention, Comparator, Primary Outcome, Effect Size (95% CI), GRADE Quality. Style with Tailwind: dark theme, sortable headers, zebra striping. Include a summary row at bottom.',
  },
  {
    icon: BarChart3,
    key: 'forest-plot',
    label: '🌲 Forest Plot',
    prompt:
      'Based on the deep research results above, create a React artifact with an interactive forest plot (SVG-based). Show each study with point estimate (diamond) and 95% CI (horizontal line). Include pooled effect size at bottom with diamond. Add I² heterogeneity stat. Use a dark-themed design with Tailwind.',
  },
  {
    icon: FileText,
    key: 'structured-report',
    label: '📄 Structured Report',
    prompt:
      'Based on the deep research results above, generate a comprehensive structured report as an HTML artifact. Include: Executive Summary, Background, Methods (search strategy, inclusion criteria), Results (study characteristics, quality assessment, main findings), Discussion (limitations, implications), Conclusions, and References. Professional medical report styling.',
  },
  {
    icon: ClipboardList,
    key: 'pico-summary',
    label: '🎯 PICO Summary Cards',
    prompt:
      'Based on the deep research results above, create a React artifact with PICO summary cards. For each key study/comparison: show Population (who), Intervention (treatment/exposure), Comparison (vs what), Outcome (what was measured + result). Use attractive card layout with color-coded PICO sections. Dark theme, Tailwind styling.',
  },
];

const DeepResearchHeader = memo(() => {
  const handleVisualize = useCallback((format: VisualFormat) => {
    const store = useChatStore.getState();
    // Inject prompt into chat input
    store.updateInputMessage(format.prompt);
    // Close Deep Research portal so user can see the chat input
    store.closeDeepResearch();
  }, []);

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      VISUALIZE_FORMATS.map((format) => ({
        icon: <Icon icon={format.icon} size={'small'} />,
        key: format.key,
        label: format.label,
        onClick: () => handleVisualize(format),
      })),
    [handleVisualize],
  );

  return (
    <Flexbox
      align={'center'}
      gap={8}
      horizontal
      justify={'space-between'}
      style={{ width: '100%' }}
    >
      <Flexbox align={'center'} gap={8} horizontal>
        <FlaskConical size={16} />
        <span>📚 Deep Research</span>
      </Flexbox>
      <Dropdown menu={{ items: menuItems }} placement={'bottomRight'} trigger={['click']}>
        <ActionIcon icon={Palette} size={'small'} title={'Visualize As...'} />
      </Dropdown>
    </Flexbox>
  );
});

DeepResearchHeader.displayName = 'DeepResearchHeader';
export default DeepResearchHeader;
