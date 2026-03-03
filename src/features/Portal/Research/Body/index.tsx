'use client';

import { createStyles } from 'antd-style';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { type ResearchPhase, useResearchStore } from '@/store/research';

import AnalysisPhase from './Analysis';
import DiscoveryPhase from './Discovery';
import PublishingPhase from './Publishing';
import ScreeningPhase from './Screening';
import WritingPhase from './Writing';
import ResearchFeedback from '../Feedback';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    overflow-y: auto;
    width: 100%;
    height: 100%;
    padding: 16px;
  `,
  phaseActive: css`
    padding: 4px 12px;

    font-weight: 600;
    color: ${token.colorPrimary};

    background: ${token.colorPrimaryBg};
    border: 1px solid ${token.colorPrimaryBorder};
    border-radius: 20px;
  `,
  phaseBar: css`
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;

    padding: 8px 16px;

    font-size: 12px;
    color: ${token.colorTextSecondary};

    background: ${token.colorFillQuaternary};
    border-radius: ${token.borderRadiusLG}px;
  `,
  phaseDone: css`
    padding: 4px 12px;

    color: ${token.colorSuccess};

    background: ${token.colorSuccessBg};
    border-radius: 20px;
  `,
  phaseItem: css`
    padding: 4px 12px;

    color: ${token.colorTextQuaternary};

    border-radius: 20px;
  `,
}));

const PHASES: { key: ResearchPhase; label: string }[] = [
  { key: 'discovery', label: '🔍 Tìm kiếm' },
  { key: 'screening', label: '📋 Sàng lọc' },
  { key: 'analysis', label: '📊 Phân tích' },
  { key: 'writing', label: '✍️ Soạn thảo' },
  { key: 'publishing', label: '📤 Xuất bản' },
];

const ResearchBody = memo(() => {
  const { styles, cx } = useStyles();
  const activePhase = useResearchStore((s) => s.activePhase);
  const setActivePhase = useResearchStore((s) => s.setActivePhase);

  const getPhaseClass = (phaseKey: ResearchPhase) => {
    const phaseIndex = PHASES.findIndex((p) => p.key === phaseKey);
    const activeIndex = PHASES.findIndex((p) => p.key === activePhase);

    if (phaseKey === activePhase) return styles.phaseActive;
    if (phaseIndex < activeIndex) return styles.phaseDone;
    return styles.phaseItem;
  };

  return (
    <Flexbox className={styles.container} gap={16}>
      {/* Phase Progress Bar */}
      <div className={styles.phaseBar}>
        {PHASES.map((phase) => (
          <span
            className={cx(getPhaseClass(phase.key))}
            key={phase.key}
            onClick={() => setActivePhase(phase.key)}
            style={{ cursor: 'pointer' }}
          >
            {phase.label}
          </span>
        ))}
      </div>

      {/* Feedback widget — shown on discovery phase */}
      {activePhase === 'discovery' && <ResearchFeedback featureName="Research Mode" />}

      {/* Active Phase Content */}
      {activePhase === 'discovery' && <DiscoveryPhase />}
      {activePhase === 'screening' && <ScreeningPhase />}
      {activePhase === 'analysis' && <AnalysisPhase />}
      {activePhase === 'writing' && <WritingPhase />}
      {activePhase === 'publishing' && <PublishingPhase />}
    </Flexbox>
  );
});

ResearchBody.displayName = 'ResearchBody';

export default ResearchBody;
