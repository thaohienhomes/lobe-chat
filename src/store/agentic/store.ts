/**
 * Agentic AI Store
 * Manages state for multi-step autonomous task execution
 */
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import type { AgentAssignment } from '@/services/agentic/agentRegistry';
import { AgenticTask, TaskStep } from '@/services/agentic/types';

import { createDevtools } from '../middleware/createDevtools';

/**
 * Agentic Store State
 */
interface AgenticState {
  // Multi-agent state
  activeAgents: string[];
  // Current active task (if any)
  activeTask: AgenticTask | null;
  agentAssignments: AgentAssignment[];

  isExecuting: boolean;

  // UI state
  isPlanning: boolean;
  showProgress: boolean;
  // Task history
  taskHistory: AgenticTask[];
}

/**
 * Agentic Store Actions
 */
interface AgenticAction {
  cancelTask: () => void;
  // History
  clearHistory: () => void;
  completeTask: (result?: string) => void;
  setCurrentStep: (index: number) => void;

  setIsExecuting: (value: boolean) => void;
  // UI actions
  setIsPlanning: (value: boolean) => void;

  // Task lifecycle
  startTask: (task: AgenticTask) => void;
  toggleProgress: () => void;
  // Step management
  updateStep: (stepId: string, updates: Partial<TaskStep>) => void;

  updateTask: (updates: Partial<AgenticTask>) => void;

  // Multi-agent actions
  setActiveAgents: (agentIds: string[]) => void;
  updateAgentAssignment: (agentId: string, updates: Partial<AgentAssignment>) => void;
}

export type AgenticStore = AgenticState & AgenticAction;

const initialState: AgenticState = {
  activeAgents: [],
  activeTask: null,
  agentAssignments: [],
  isExecuting: false,
  isPlanning: false,
  showProgress: false,
  taskHistory: [],
};

const createStore = (set: any, get: any): AgenticStore => ({
  ...initialState,

  cancelTask: () =>
    set((state: AgenticState) => {
      const cancelledTask = state.activeTask
        ? { ...state.activeTask, status: 'cancelled' as const }
        : null;

      return {
        activeTask: null,
        isExecuting: false,
        taskHistory: cancelledTask ? [cancelledTask, ...state.taskHistory] : state.taskHistory,
      };
    }),

  // History
  clearHistory: () => set({ taskHistory: [] }),

  completeTask: (result) =>
    set((state: AgenticState) => {
      const completedTask = state.activeTask
        ? {
          ...state.activeTask,
          completedAt: new Date(),
          finalResult: result,
          status: 'completed' as const,
        }
        : null;

      return {
        activeTask: null,
        isExecuting: false,
        taskHistory: completedTask
          ? [completedTask, ...state.taskHistory].slice(0, 50) // Keep last 50
          : state.taskHistory,
      };
    }),

  setCurrentStep: (index) =>
    set((state: AgenticState) => ({
      activeTask: state.activeTask ? { ...state.activeTask, currentStepIndex: index } : null,
    })),

  setIsExecuting: (value) => set({ isExecuting: value }),

  // UI actions
  setIsPlanning: (value) => set({ isPlanning: value }),

  // Task lifecycle
  startTask: (task) =>
    set({
      activeTask: task,
      isExecuting: true,
      showProgress: true,
    }),

  toggleProgress: () =>
    set((state: AgenticState) => ({
      showProgress: !state.showProgress,
    })),

  // Step management
  updateStep: (stepId, updates) =>
    set((state: AgenticState) => {
      if (!state.activeTask) return state;

      const updatedSteps = state.activeTask.steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step,
      );

      const completedSteps = updatedSteps.filter((s) => s.status === 'completed').length;

      return {
        activeTask: {
          ...state.activeTask,
          completedSteps,
          steps: updatedSteps,
          updatedAt: new Date(),
        },
      };
    }),

  updateTask: (updates) =>
    set((state: AgenticState) => {
      void get; // Reference to satisfy lint
      return {
        activeTask: state.activeTask
          ? { ...state.activeTask, ...updates, updatedAt: new Date() }
          : null,
      };
    }),

  // Multi-agent actions
  setActiveAgents: (agentIds) => set({ activeAgents: agentIds }),

  updateAgentAssignment: (agentId, updates) =>
    set((state: AgenticState) => ({
      agentAssignments: state.agentAssignments.map((a) =>
        a.agentId === agentId ? { ...a, ...updates } : a,
      ),
    })),
});

const devtools = createDevtools('agentic');

export const useAgenticStore = createWithEqualityFn<AgenticStore>()(
  subscribeWithSelector(devtools(createStore)),
  shallow,
);

export const getAgenticStoreState = () => useAgenticStore.getState();
