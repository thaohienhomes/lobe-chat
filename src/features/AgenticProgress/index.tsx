'use client';

import { Progress, Steps, Typography } from 'antd';
import { CheckCircle, Circle, Loader2, PlayCircle, XCircle } from 'lucide-react';
import { memo } from 'react';

import { TaskStep } from '@/services/agentic/types';
import { agenticSelectors, useAgenticStore } from '@/store/agentic';

const { Text, Title } = Typography;

/**
 * Get step icon based on status
 */
const getStepIcon = (status: TaskStep['status']) => {
  switch (status) {
    case 'completed': {
      return <CheckCircle color="#52c41a" size={16} />;
    }
    case 'running': {
      return <Loader2 className="animate-spin" color="#1890ff" size={16} />;
    }
    case 'failed': {
      return <XCircle color="#ff4d4f" size={16} />;
    }
    case 'skipped': {
      return <Circle color="#d9d9d9" size={16} />;
    }
    default: {
      return <Circle color="#d9d9d9" size={16} />;
    }
  }
};

/**
 * Agentic Progress Panel
 * Shows real-time progress of multi-step task execution
 */
const AgenticProgress = memo(() => {
  const activeTask = useAgenticStore(agenticSelectors.activeTask);
  const showProgress = useAgenticStore(agenticSelectors.showProgress);
  const progress = useAgenticStore(agenticSelectors.progress);
  const cancelTask = useAgenticStore((s) => s.cancelTask);

  if (!showProgress || !activeTask) return null;

  return (
    <div
      style={{
        background: 'var(--lobe-color-bg-container)',
        border: '1px solid var(--lobe-color-border)',
        borderRadius: 12,
        bottom: 80,
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
        left: '50%',
        maxHeight: 400,
        maxWidth: 480,
        overflow: 'hidden',
        padding: 16,
        position: 'fixed',
        transform: 'translateX(-50%)',
        width: '90%',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
          <PlayCircle size={20} />
          <Title level={5} style={{ margin: 0 }}>
            Agentic Mode
          </Title>
        </div>
        <Text
          onClick={() => cancelTask()}
          style={{ color: '#ff4d4f', cursor: 'pointer' }}
          type="secondary"
        >
          Cancel
        </Text>
      </div>

      {/* Progress bar */}
      <Progress
        percent={progress.percentage}
        size="small"
        status={activeTask.status === 'failed' ? 'exception' : 'active'}
        strokeColor={{
          '0%': '#108ee9',
          '100%': '#87d068',
        }}
      />

      {/* Task description */}
      <Text style={{ display: 'block', marginBottom: 12, marginTop: 8 }} type="secondary">
        {activeTask.plan || activeTask.originalRequest}
      </Text>

      {/* Steps */}
      <div style={{ maxHeight: 200, overflow: 'auto' }}>
        <Steps
          current={activeTask.currentStepIndex}
          direction="vertical"
          items={activeTask.steps.map((step) => ({
            description: step.result || step.error,
            icon: getStepIcon(step.status),
            status:
              step.status === 'completed'
                ? 'finish'
                : step.status === 'running'
                  ? 'process'
                  : step.status === 'failed'
                    ? 'error'
                    : 'wait',
            title: step.description,
          }))}
          size="small"
        />
      </div>

      {/* Footer stats */}
      <div
        style={{
          borderTop: '1px solid var(--lobe-color-border)',
          display: 'flex',
          gap: 16,
          marginTop: 12,
          paddingTop: 12,
        }}
      >
        <Text type="secondary">
          Steps: {progress.completed}/{progress.total}
        </Text>
        <Text type="secondary">Status: {activeTask.status}</Text>
      </div>
    </div>
  );
});

AgenticProgress.displayName = 'AgenticProgress';

export default AgenticProgress;
