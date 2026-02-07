/**
 * Agentic Store Selectors
 */
import { AgenticStore } from './store';

export const agenticSelectors = {
  // Multi-agent selectors
  activeAgents: (s: AgenticStore) => s.activeAgents,
  // Task selectors
  activeTask: (s: AgenticStore) => s.activeTask,
  agentAssignments: (s: AgenticStore) => s.agentAssignments,
  allSteps: (s: AgenticStore) => s.activeTask?.steps ?? [],

  currentStep: (s: AgenticStore) => {
    if (!s.activeTask) return null;
    return s.activeTask.steps[s.activeTask.currentStepIndex] ?? null;
  },

  isExecuting: (s: AgenticStore) => s.isExecuting,

  isMultiAgent: (s: AgenticStore) => s.activeTask?.isMultiAgent ?? false,

  isPlanning: (s: AgenticStore) => s.isPlanning,

  isTaskActive: (s: AgenticStore) => s.activeTask !== null,

  // Progress selectors
  progress: (s: AgenticStore) => {
    if (!s.activeTask) return { completed: 0, percentage: 0, total: 0 };
    const { completedSteps, totalSteps } = s.activeTask;
    return {
      completed: completedSteps,
      percentage: totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0,
      total: totalSteps,
    };
  },

  // History selectors
  recentTasks: (s: AgenticStore) => s.taskHistory.slice(0, 10),

  // UI selectors
  showProgress: (s: AgenticStore) => s.showProgress && s.activeTask !== null,

  taskById: (id: string) => (s: AgenticStore) => s.taskHistory.find((t) => t.id === id) ?? null,
  taskStatus: (s: AgenticStore) => s.activeTask?.status ?? 'pending',
};

