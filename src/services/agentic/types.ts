/**
 * Agentic AI System Types
 * Multi-step autonomous task execution for Phở Chat
 */

/**
 * Task status throughout execution
 */
export type TaskStatus =
  | 'pending' // Not started
  | 'planning' // Decomposing into steps
  | 'executing' // Running steps
  | 'paused' // Waiting for user input
  | 'completed' // Successfully finished
  | 'failed' // Failed with error
  | 'cancelled'; // User cancelled

/**
 * Individual step within a task
 */
export interface TaskStep {
  /** Agent assigned to this step (for multi-agent mode) */
  agentId?: string;
  completedAt?: Date;
  description: string;
  error?: string;

  id: string;
  // Step result
  result?: string;
  // Timing
  startedAt?: Date;

  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  // Tool to use (optional - some steps are pure LLM reasoning)
  tool?: string;

  toolInput?: Record<string, unknown>;
  toolOutput?: unknown;
}

/**
 * Complete agentic task
 */
export interface AgenticTask {
  /** Agent assignments (for multi-agent mode) */
  agents?: import('./agentRegistry').AgentAssignment[];
  completedAt?: Date;

  completedSteps: number;

  /** Coordinator agent ID (for multi-agent mode) */
  coordinatorId?: string;
  createdAt: Date;
  currentStepIndex: number;
  error?: string;
  // Results
  finalResult?: string;

  id: string;
  /** Whether this task uses multi-agent orchestration */
  isMultiAgent?: boolean;
  // Original user request
  originalRequest: string;
  // Planning
  plan?: string;

  // Execution context
  sessionId: string;
  // Task metadata
  status: TaskStatus;

  // LLM-generated plan description
  steps: TaskStep[];
  topicId?: string;

  // Progress tracking
  totalSteps: number;
  updatedAt: Date;
}

/**
 * Request to create a new agentic task
 */
export interface CreateTaskRequest {
  allowedTools?: string[];
  // Optional constraints
  maxSteps?: number;
  request: string;

  sessionId: string;
  timeout?: number;
  topicId?: string; // ms
}

/**
 * Result from task planning
 */
export interface TaskPlan {
  isAgentic: boolean;
  // Why/why not
  plan?: string;
  // Whether this needs agentic mode
  reasoning: string; // High-level plan description
  steps: Array<{
    /** Hint for which specialist agent should handle this step */
    agentHint?: string;
    description: string;
    estimatedDuration?: number;
    tool?: string;
  }>;
}

/**
 * Result from step execution
 */
export interface StepExecutionResult {
  error?: string;
  nextStepModification?: Partial<TaskStep>;
  output?: unknown;
  result?: string;
  shouldContinue: boolean;
  success: boolean;
}

/**
 * Agentic detection patterns
 * Requests matching these patterns should trigger agentic mode
 */
export const AGENTIC_PATTERNS = [
  // Research patterns
  /research\s+(about|on|into)/i,
  /find\s+out\s+about/i,
  /investigate/i,
  /analyze\s+and\s+summarize/i,

  // Multi-step patterns
  /then\s+(do|create|make|generate)/i,
  /after\s+that/i,
  /step\s+by\s+step/i,
  /first.*then.*finally/i,

  // Automation patterns
  /automate/i,
  /automatically/i,
  /do\s+this\s+for\s+me/i,

  // Complex task patterns
  /create\s+.*\s+based\s+on/i,
  /generate\s+.*\s+from/i,
  /compare\s+.*\s+and\s+.*\s+then/i,
];

/**
 * Check if a request should trigger agentic mode
 */
export function shouldUseAgenticMode(request: string): boolean {
  return AGENTIC_PATTERNS.some((pattern) => pattern.test(request));
}

/**
 * Available tools for agentic execution
 */
export const AGENTIC_TOOLS = [
  'web_search', // Search the web
  'crawl_page', // Crawl page content
  'read_file', // Read file content
  'write_file', // Create/update file
  'run_code', // Execute code
  'generate_image', // Create image
  'send_message', // Send message/notification
  'query_database', // Query data
  'call_api', // External API call
  'delegate_agent', // Delegate to a specialist agent
] as const;

export type AgenticTool = (typeof AGENTIC_TOOLS)[number];
