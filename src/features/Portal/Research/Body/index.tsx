'use client';

import { createStyles } from 'antd-style';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { type ResearchPhase, useResearchStore } from '@/store/research';

import DiscoveryPhase from './Discovery';
import ScreeningPhase from './Screening';

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
  { key: 'discovery', label: '🔍 Discovery' },
  { key: 'screening', label: '📋 Screening' },
  { key: 'analysis', label: '📊 Analysis' },
  { key: 'writing', label: '✍️ Writing' },
  { key: 'publishing', label: '📤 Publishing' },
];

const ResearchBody = memo(() => {
  const { styles, cx } = useStyles();
  const activePhase = useResearchStore((s) => s.activePhase);

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
          <span className={cx(getPhaseClass(phase.key))} key={phase.key}>
            {phase.label}
          </span>
        ))}
      </div>

      {/* Active Phase Content */}
      {activePhase === 'discovery' && <DiscoveryPhase />}
      {activePhase === 'screening' && <ScreeningPhase />}
    </Flexbox>
  );
});

ResearchBody.displayName = 'ResearchBody';

export default ResearchBody;
