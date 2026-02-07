/**
 * Task Executor for Agentic AI System
 * Executes individual steps and manages task lifecycle
 * Enhanced with real tool implementations
 */
import { AgenticTask, AgenticTool, StepExecutionResult, TaskStep } from './types';

/**
 * Tool execution handlers
 */
type ToolHandler = (input: Record<string, unknown>) => Promise<StepExecutionResult>;

/**
 * Web Search Tool - integrates with existing search infrastructure
 */
const webSearchHandler: ToolHandler = async (input) => {
  const query = input.query as string;

  try {
    // Call the internal search API
    const response = await fetch('/api/search', {
      body: JSON.stringify({ query }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      return {
        error: `Search failed with status: ${response.status}`,
        shouldContinue: false,
        success: false,
      };
    }

    const results = await response.json();
    return {
      output: results,
      result: `Found ${results.length || 0} results for: ${query}`,
      shouldContinue: true,
      success: true,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Search failed',
      shouldContinue: false,
      success: false,
    };
  }
};

/**
 * Web Crawler Tool - fetch page content
 */
const crawlPageHandler: ToolHandler = async (input) => {
  const url = input.url as string;

  try {
    const response = await fetch('/api/webtools/crawl', {
      body: JSON.stringify({ url }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      return {
        error: `Crawl failed with status: ${response.status}`,
        shouldContinue: false,
        success: false,
      };
    }

    const content = await response.json();
    return {
      output: content,
      result: `Crawled page: ${content.title || url}`,
      shouldContinue: true,
      success: true,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Crawl failed',
      shouldContinue: false,
      success: false,
    };
  }
};

/**
 * Image Generation Tool
 */
const generateImageHandler: ToolHandler = async (input) => {
  const prompt = input.prompt as string;
  const model = (input.model as string) || 'flux-schnell';

  try {
    const response = await fetch('/api/generate/image', {
      body: JSON.stringify({ model, prompt }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      return {
        error: `Image generation failed with status: ${response.status}`,
        shouldContinue: false,
        success: false,
      };
    }

    const result = await response.json();
    return {
      output: result,
      result: `Generated image for: ${prompt.slice(0, 50)}...`,
      shouldContinue: true,
      success: true,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Image generation failed',
      shouldContinue: false,
      success: false,
    };
  }
};

/**
 * Registry of tool handlers
 */
const toolHandlers: Partial<Record<AgenticTool, ToolHandler>> = {
  // Web crawling
  crawl_page: crawlPageHandler,

  // Delegate to specialist agent (handled by coordinator, stub here)
  delegate_agent: async (input) => ({
    result: `Delegated to agent: ${input.agentId || 'auto'}`,
    shouldContinue: true,
    success: true,
  }),

  // Image generation
  generate_image: generateImageHandler,

  // File operations (placeholder - can be enhanced)
  read_file: async (input) => ({
    result: `Read file: ${input.path}`,
    shouldContinue: true,
    success: true,
  }),

  // Code execution (placeholder - requires sandboxed environment)
  run_code: async (input) => ({
    error: `Code execution not available for: ${input.language || 'unknown language'}`,
    shouldContinue: false,
    success: false,
  }),

  // Web search
  web_search: webSearchHandler,

  // Write file (placeholder)
  write_file: async (input) => ({
    result: `Would write to: ${input.path}`,
    shouldContinue: true,
    success: true,
  }),
};

/**
 * Execute a single step
 */
export async function executeStep(
  step: TaskStep,
  context: { previousResults: string[]; task: AgenticTask },
): Promise<StepExecutionResult> {
  // Reference context for potential future use
  void context.task.id;

  // Mark step as running
  step.status = 'running';
  step.startedAt = new Date();

  try {
    // If step has a tool, execute it
    if (step.tool) {
      const handler = toolHandlers[step.tool as AgenticTool];

      if (!handler) {
        return {
          error: `Unknown tool: ${step.tool}`,
          shouldContinue: false,
          success: false,
        };
      }

      const result = await handler(step.toolInput || {});

      step.status = result.success ? 'completed' : 'failed';
      step.result = result.result;
      step.error = result.error;
      step.toolOutput = result.output;
      step.completedAt = new Date();

      return result;
    }

    // Pure reasoning step (no tool)
    step.status = 'completed';
    step.result = `Reasoning completed for: ${step.description}`;
    step.completedAt = new Date();

    return {
      result: step.result,
      shouldContinue: true,
      success: true,
    };
  } catch (error) {
    step.status = 'failed';
    step.error = error instanceof Error ? error.message : String(error);
    step.completedAt = new Date();

    return {
      error: step.error,
      shouldContinue: false,
      success: false,
    };
  }
}

/**
 * Execute all steps in a task
 */
export async function executeTask(
  task: AgenticTask,
  options: {
    onProgress?: (completed: number, total: number) => void;
    onStepComplete?: (step: TaskStep, result: StepExecutionResult) => void;
    onStepStart?: (step: TaskStep, index: number) => void;
    shouldCancel?: () => boolean;
  } = {},
): Promise<AgenticTask> {
  task.status = 'executing';
  task.updatedAt = new Date();

  const previousResults: string[] = [];

  for (let i = task.currentStepIndex; i < task.steps.length; i++) {
    // Check for cancellation
    if (options.shouldCancel?.()) {
      task.status = 'cancelled';
      break;
    }

    const step = task.steps[i];
    task.currentStepIndex = i;

    options.onStepStart?.(step, i);

    const result = await executeStep(step, { previousResults, task });

    options.onStepComplete?.(step, result);

    if (result.success && result.result) {
      previousResults.push(result.result);
    }

    task.completedSteps = i + 1;
    options.onProgress?.(task.completedSteps, task.totalSteps);

    if (!result.shouldContinue) {
      task.status = result.success ? 'completed' : 'failed';
      task.error = result.error;
      break;
    }
  }

  // All steps completed
  if (task.status === 'executing') {
    task.status = 'completed';
    task.finalResult = previousResults.join('\n\n');
  }

  task.completedAt = new Date();
  task.updatedAt = new Date();

  return task;
}

/**
 * Resume a paused task
 */
export async function resumeTask(
  task: AgenticTask,
  options: Parameters<typeof executeTask>[1] = {},
): Promise<AgenticTask> {
  if (task.status !== 'paused') {
    throw new Error(`Cannot resume task with status: ${task.status}`);
  }

  return executeTask(task, options);
}

/**
 * Cancel a running task
 */
export function cancelTask(task: AgenticTask): AgenticTask {
  if (task.status !== 'executing' && task.status !== 'pending') {
    return task;
  }

  task.status = 'cancelled';
  task.updatedAt = new Date();

  // Mark remaining steps as skipped
  for (let i = task.currentStepIndex; i < task.steps.length; i++) {
    if (task.steps[i].status === 'pending') {
      task.steps[i].status = 'skipped';
    }
  }

  return task;
}

/**
 * Get task progress summary
 */
export function getTaskProgress(task: AgenticTask): {
  currentStep: string;
  eta: number;
  percentage: number;
} {
  const percentage =
    task.totalSteps > 0 ? Math.round((task.completedSteps / task.totalSteps) * 100) : 0;

  const currentStep = task.steps[task.currentStepIndex]?.description || 'Unknown';

  // Rough ETA based on remaining steps
  const remainingSteps = task.totalSteps - task.completedSteps;
  const avgStepTime = 5000; // 5 seconds average
  const eta = remainingSteps * avgStepTime;

  return { currentStep, eta, percentage };
}
