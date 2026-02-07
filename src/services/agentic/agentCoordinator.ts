/**
 * Agent Coordinator for Multi-Agent Orchestration
 *
 * Manages the coordination between specialist agents,
 * handles step routing, parallel execution, and result merging.
 */
import { AgentAssignment, getAgentById, routeStepsToAgents } from './agentRegistry';
import { executeStep } from './taskExecutor';
import type { AgenticTask, StepExecutionResult, TaskStep } from './types';

/**
 * System prompt for the coordinator LLM
 * Used when deciding how to route complex tasks
 */
export const COORDINATOR_PROMPT = `
You are a task coordinator managing a team of specialist agents. Your job is to:

1. **Analyze** the user's request to understand what skills are needed
2. **Route** each step to the most appropriate specialist agent
3. **Merge** results from multiple agents into a coherent response
4. **Handle** failures by reassigning or adapting the plan

## Available Specialist Agents:
- **researcher**: Web search, page crawling, information synthesis
- **coder**: Code writing, debugging, optimization
- **creative**: Image generation, creative writing, design
- **analyst**: Data analysis, statistics, reporting
- **integrator**: API calls, system integration, automation

## Output Format (JSON):
\`\`\`json
{
  "isMultiAgent": true,
  "reasoning": "Why this needs multiple agents",
  "plan": "High-level coordination plan",
  "steps": [
    {
      "description": "Step description",
      "tool": "tool_name",
      "agentHint": "agent_id"
    }
  ]
}
\`\`\`

Note: If the task can be handled by a single agent, set isMultiAgent to false.
Only use multi-agent when genuinely different expertise is needed.
`;

/**
 * Merge results from all agent assignments into a coherent final result
 */
export function mergeAgentResults(assignments: AgentAssignment[]): string {
    const completedAssignments = assignments.filter(
        (a) => a.status === 'done' && a.result,
    );

    if (completedAssignments.length === 0) {
        return 'No results were produced by the agents.';
    }

    if (completedAssignments.length === 1) {
        return completedAssignments[0].result!;
    }

    // Combine results with agent attribution
    const sections = completedAssignments.map((a) => {
        const agent = getAgentById(a.agentId);
        const header = agent ? `## ${agent.name} Results` : `## Agent ${a.agentId}`;
        return `${header}\n\n${a.result}`;
    });

    return sections.join('\n\n---\n\n');
}

/**
 * Coordinate multi-agent task execution
 * Groups steps by agent and executes each agent's steps
 */
export async function coordinateMultiAgentExecution(
    task: AgenticTask,
    options: {
        onAgentComplete?: (agentId: string, results: string[]) => void;
        onAgentStart?: (agentId: string, stepCount: number) => void;
        onProgress?: (completed: number, total: number) => void;
        onStepComplete?: (step: TaskStep, result: StepExecutionResult) => void;
        onStepStart?: (step: TaskStep, index: number) => void;
        shouldCancel?: () => boolean;
    } = {},
): Promise<AgenticTask> {
    task.status = 'executing';
    task.updatedAt = new Date();

    // Route steps to agents if not already done
    if (!task.agents || task.agents.length === 0) {
        task.agents = routeStepsToAgents(task.steps);
    }

    const previousResults: string[] = [];
    let completedCount = 0;

    // Execute each agent's steps sequentially (agents work one at a time for now)
    // In future: parallel execution for independent agents
    for (const assignment of task.agents) {
        if (options.shouldCancel?.()) {
            task.status = 'cancelled';
            break;
        }

        assignment.status = 'working';
        options.onAgentStart?.(assignment.agentId, assignment.stepIds.length);

        const agentResults: string[] = [];

        for (const stepId of assignment.stepIds) {
            if (options.shouldCancel?.()) break;

            const step = task.steps.find((s) => s.id === stepId);
            if (!step) continue;

            const stepIndex = task.steps.indexOf(step);
            task.currentStepIndex = stepIndex;
            options.onStepStart?.(step, stepIndex);

            // Inject agent context into step execution
            const agent = getAgentById(assignment.agentId);
            if (agent) {
                step.agentId = agent.id;
            }

            const result = await executeStep(step, { previousResults, task });
            options.onStepComplete?.(step, result);

            if (result.success && result.result) {
                previousResults.push(result.result);
                agentResults.push(result.result);
            }

            completedCount++;
            task.completedSteps = completedCount;
            options.onProgress?.(completedCount, task.totalSteps);

            if (!result.shouldContinue) {
                assignment.status = 'failed';
                assignment.error = result.error;
                task.status = 'failed';
                task.error = result.error;
                break;
            }
        }

        if (assignment.status === 'working') {
            assignment.status = 'done';
            assignment.result = agentResults.join('\n\n');
            options.onAgentComplete?.(assignment.agentId, agentResults);
        }
    }

    // All agents completed
    if (task.status === 'executing') {
        task.status = 'completed';
        task.finalResult = mergeAgentResults(task.agents);
    }

    task.completedAt = new Date();
    task.updatedAt = new Date();

    return task;
}

/**
 * Check if a task should use multi-agent mode
 * Based on the diversity of tools/skills needed
 */
export function shouldUseMultiAgent(
    steps: Array<{ description: string; tool?: string }>,
): boolean {
    // If steps need tools from 2+ different agents, use multi-agent
    const agentAssignments = routeStepsToAgents(
        steps.map((s, i) => ({ ...s, id: String(i) })),
    );

    return agentAssignments.length >= 2;
}

