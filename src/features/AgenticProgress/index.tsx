'use client';

import { Progress, Steps, Tag, Typography } from 'antd';
import {
  Bot,
  CheckCircle,
  Circle,
  Code,
  Cpu,
  Loader2,
  Palette,
  PlayCircle,
  Search,
  XCircle,
  Zap,
} from 'lucide-react';
import { memo } from 'react';

import { getAgentById } from '@/services/agentic/agentRegistry';
import { TaskStep } from '@/services/agentic/types';
import { agenticSelectors, useAgenticStore } from '@/store/agentic';

const { Text, Title } = Typography;

/**
 * Agent icon mapping
 */
const agentIcons: Record<string, typeof Search> = {
  analyst: Cpu,
  coder: Code,
  creative: Palette,
  integrator: Zap,
  researcher: Search,
};

const agentColors: Record<string, string> = {
  analyst: '#722ed1',
  coder: '#1890ff',
  creative: '#fa541c',
  integrator: '#13c2c2',
  researcher: '#52c41a',
};

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
 * Supports both single-agent and multi-agent display modes
 */
const AgenticProgress = memo(() => {
  const activeTask = useAgenticStore(agenticSelectors.activeTask);
  const showProgress = useAgenticStore(agenticSelectors.showProgress);
  const progress = useAgenticStore(agenticSelectors.progress);
  const isMultiAgent = useAgenticStore(agenticSelectors.isMultiAgent);
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
            {isMultiAgent ? 'Multi-Agent Mode' : 'Agentic Mode'}
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

      {/* Multi-agent badges */}
      {isMultiAgent && activeTask.agents && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {activeTask.agents.map((assignment) => {
            const agent = getAgentById(assignment.agentId);
            const AgentIcon = agentIcons[assignment.agentId] || Bot;
            const color = agentColors[assignment.agentId] || '#666';
            return (
              <Tag
                color={assignment.status === 'working' ? 'processing' : assignment.status === 'done' ? 'success' : assignment.status === 'failed' ? 'error' : 'default'}
                icon={<AgentIcon size={12} />}
                key={assignment.agentId}
                style={{ alignItems: 'center', display: 'flex', gap: 4 }}
              >
                <span style={{ color }}>{agent?.name || assignment.agentId}</span>
              </Tag>
            );
          })}
        </div>
      )}

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
          items={activeTask.steps.map((step) => {
            const agent = step.agentId ? getAgentById(step.agentId) : undefined;
            return {
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
              title: (
                <span>
                  {step.description}
                  {agent && (
                    <Tag
                      color={agentColors[agent.id] || '#666'}
                      style={{ fontSize: 10, marginLeft: 6 }}
                    >
                      {agent.name}
                    </Tag>
                  )}
                </span>
              ),
            };
          })}
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
        {isMultiAgent && activeTask.agents && (
          <Text type="secondary">
            Agents: {activeTask.agents.filter((a) => a.status === 'done').length}/{activeTask.agents.length}
          </Text>
        )}
      </div>
    </div>
  );
});

AgenticProgress.displayName = 'AgenticProgress';

export default AgenticProgress;

