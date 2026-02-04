/**
 * Task Planner for Agentic AI System
 * Decomposes user requests into executable steps
 */
import { v4 as uuidv4 } from 'uuid';

import { AgenticTask, CreateTaskRequest, TaskPlan, TaskStep, shouldUseAgenticMode } from './types';

/**
 * System prompt for task planning
 */
export const TASK_PLANNING_PROMPT = `
You are an autonomous task planner. Your job is to analyze user requests and determine if they require multi-step execution.

## When to use Agentic Mode:
- Research tasks requiring multiple sources
- Tasks with explicit steps ("first... then... finally...")
- Complex analysis requiring multiple tool calls
- Automation workflows
- Content creation from multiple inputs

## When NOT to use Agentic Mode:
- Simple questions
- Single-action requests
- Creative writing without research
- Direct conversations

## Output Format (JSON):
\`\`\`json
{
  "isAgentic": true/false,
  "reasoning": "Brief explanation of decision",
  "plan": "High-level description of the plan (if agentic)",
  "steps": [
    {
      "description": "What this step does",
      "tool": "tool_name (optional)",
      "estimatedDuration": 5000
    }
  ]
}
\`\`\`

## Available Tools:
- web_search: Search the internet for information
- read_file: Read content from a file
- write_file: Create or update a file
- run_code: Execute code snippets
- generate_image: Create images with AI
- send_message: Send notifications/messages
- query_database: Query stored data
- call_api: Call external APIs

Remember: Only return steps if isAgentic is true.
`;

/**
 * Parse task planning response from LLM
 */
export function parseTaskPlanResponse(response: string): TaskPlan | null {
  try {
    const jsonMatch = response.match(/```json\s*([\S\s]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;

    const parsed = JSON.parse(jsonStr.trim()) as TaskPlan;

    return {
      isAgentic: Boolean(parsed.isAgentic),
      plan: parsed.plan,
      reasoning: parsed.reasoning || '',
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
    };
  } catch {
    return null;
  }
}

/**
 * Create initial task from request
 */
export function createTask(request: CreateTaskRequest): AgenticTask {
  const now = new Date();

  return {
    completedSteps: 0,
    createdAt: now,
    currentStepIndex: 0,
    id: uuidv4(),
    originalRequest: request.request,
    sessionId: request.sessionId,
    status: 'pending',
    steps: [],
    topicId: request.topicId,
    totalSteps: 0,
    updatedAt: now,
  };
}

/**
 * Convert plan steps to task steps
 */
export function planToSteps(plan: TaskPlan): TaskStep[] {
  return plan.steps.map((step) => ({
    description: step.description,
    id: uuidv4(),
    status: 'pending' as const,
    tool: step.tool,
  }));
}

/**
 * Quick check if request might be agentic (client-side, before LLM)
 */
export function quickAgenticCheck(request: string): boolean {
  // First check with regex patterns
  if (shouldUseAgenticMode(request)) return true;

  // Check for word count (complex requests tend to be longer)
  const wordCount = request.split(/\s+/).length;
  if (wordCount > 30) return true;

  // Check for question chaining
  const questionCount = (request.match(/\?/g) || []).length;
  if (questionCount > 1) return true;

  return false;
}

/**
 * Estimate total task duration based on steps
 */
export function estimateTaskDuration(steps: TaskStep[]): number {
  const basePerStep = 3000; // 3 seconds per step base
  const toolOverhead: Record<string, number> = {
    call_api: 5000,
    generate_image: 30_000,
    query_database: 2000,
    read_file: 1000,
    run_code: 10_000,
    send_message: 2000,
    web_search: 5000,
    write_file: 1000,
  };

  return steps.reduce((total, step) => {
    const overhead = step.tool ? toolOverhead[step.tool] || 0 : 0;
    return total + basePerStep + overhead;
  }, 0);
}
