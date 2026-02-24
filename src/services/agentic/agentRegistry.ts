/**
 * Agent Registry for Multi-Agent Orchestration
 *
 * Defines specialist agents that can be assigned to task steps
 * based on their expertise and available tools.
 */
import type { AgenticTool } from './types';

/**
 * Specialist agent definition
 */
export interface SpecialistAgent {
    /** Agent description for coordinator LLM */
    description: string;
    /** Unique agent identifier */
    id: string;
    /** Display name */
    name: string;
    /** Higher = preferred when multiple agents match */
    priority: number;
    /** System prompt injected when this agent executes steps */
    systemPrompt: string;
    /** Tools this agent can use */
    tools: AgenticTool[];
    /** Patterns that auto-route requests to this agent */
    triggerPatterns: RegExp[];
}

/**
 * Agent assignment for a task
 */
export interface AgentAssignment {
    /** Which agent */
    agentId: string;
    /** Optional error */
    error?: string;
    /** Combined result from this agent's work */
    result?: string;
    /** Current status */
    status: 'idle' | 'working' | 'done' | 'failed';
    /** Which steps are assigned to this agent */
    stepIds: string[];
}

/**
 * Built-in specialist agents
 */
export const SPECIALIST_AGENTS: SpecialistAgent[] = [
    {
        description:
            'Expert at finding, analyzing, and synthesizing information from the web. Best for research tasks, fact-finding, and competitive analysis.',
        id: 'researcher',
        name: 'Research Agent',
        priority: 80,
        systemPrompt: `You are a meticulous research analyst. Your role is to:
- Search multiple sources for comprehensive information
- Cross-reference facts between sources
- Provide structured summaries with citations
- Identify gaps in available information
Always cite your sources and distinguish between verified facts and speculation.`,
        tools: ['web_search', 'crawl_page', 'read_file'],
        triggerPatterns: [
            /research\s+(about|on|into)/i,
            /find\s+(out|information|data)\s+(about|on)/i,
            /investigate/i,
            /analyze\s+and\s+summarize/i,
            /look\s+up/i,
            /what\s+are\s+the\s+(latest|recent)/i,
        ],
    },
    {
        description:
            'Expert at writing, debugging, and optimizing code. Handles implementation tasks, bug fixes, and technical solutions.',
        id: 'coder',
        name: 'Code Agent',
        priority: 85,
        systemPrompt: `You are a senior software engineer. Your role is to:
- Write clean, well-documented code
- Debug issues systematically
- Follow best practices and design patterns
- Provide explanations for technical decisions
Always consider edge cases and write production-quality code.`,
        tools: ['run_code', 'write_file', 'read_file'],
        triggerPatterns: [
            /write\s+(code|a\s+script|a\s+function|a\s+program)/i,
            /implement/i,
            /debug/i,
            /fix\s+(the\s+)?(bug|error|issue)/i,
            /refactor/i,
            /optimize\s+(the\s+)?code/i,
        ],
    },
    {
        description:
            'Expert at generating images, designing visual content, and creative writing. Best for content creation tasks.',
        id: 'creative',
        name: 'Creative Agent',
        priority: 70,
        systemPrompt: `You are a creative director and artist. Your role is to:
- Generate compelling visual content
- Write engaging creative copy
- Design user interfaces and layouts
- Create brand-consistent assets
Focus on aesthetics, clarity, and emotional impact.`,
        tools: ['generate_image', 'write_file'],
        triggerPatterns: [
            /design/i,
            /create\s+(an?\s+)?(image|illustration|graphic|logo)/i,
            /generate\s+(an?\s+)?(image|visual|artwork)/i,
            /creative\s+writing/i,
            /write\s+(a\s+)?(story|poem|article)/i,
        ],
    },
    {
        description:
            'Expert at data analysis, statistics, and deriving insights. Best for spreadsheet analysis, trend detection, and reporting.',
        id: 'analyst',
        name: 'Data Analyst',
        priority: 75,
        systemPrompt: `You are a data analyst and statistician. Your role is to:
- Analyze datasets for patterns and insights
- Generate statistical summaries and visualizations
- Compare and benchmark data points
- Provide actionable recommendations from data
Always quantify your findings and explain methodology.`,
        tools: ['query_database', 'run_code', 'web_search'],
        triggerPatterns: [
            /analyze\s+(the\s+)?data/i,
            /statistics/i,
            /compare\s+(and|then)/i,
            /trend/i,
            /report\s+on/i,
            /metrics/i,
        ],
    },
    {
        description:
            'Expert at integrating external services, managing APIs, and orchestrating workflows between systems.',
        id: 'integrator',
        name: 'Integration Agent',
        priority: 65,
        systemPrompt: `You are a systems integration specialist. Your role is to:
- Connect external services and APIs
- Transform data between formats
- Build automation workflows
- Handle error recovery and retries
Always validate inputs/outputs and handle edge cases gracefully.`,
        tools: ['call_api', 'run_code', 'read_file', 'write_file'],
        triggerPatterns: [
            /integrate/i,
            /connect\s+to/i,
            /call\s+(the\s+)?api/i,
            /automate/i,
            /workflow/i,
        ],
    },
];

/**
 * Find the best matching agent for a step based on its tool requirement
 */
export function findAgentForTool(tool: string): SpecialistAgent | undefined {
    const candidates = SPECIALIST_AGENTS.filter((agent) =>
        agent.tools.includes(tool as AgenticTool),
    ).sort((a, b) => b.priority - a.priority);

    return candidates[0];
}

/**
 * Find agents matching a text query using trigger patterns
 */
export function findAgentsForQuery(query: string): SpecialistAgent[] {
    return SPECIALIST_AGENTS.filter((agent) =>
        agent.triggerPatterns.some((pattern) => pattern.test(query)),
    ).sort((a, b) => b.priority - a.priority);
}

/**
 * Route task steps to specialist agents
 * Returns a map of agentId -> stepIds
 */
export function routeStepsToAgents(
    steps: Array<{ description: string, id: string; tool?: string; }>,
): AgentAssignment[] {
    const assignments = new Map<string, string[]>();

    for (const step of steps) {
        let agentId = 'coordinator'; // Default fallback

        if (step.tool) {
            const agent = findAgentForTool(step.tool);
            if (agent) agentId = agent.id;
        } else {
            // For reasoning steps, try to match by description
            const matchedAgents = findAgentsForQuery(step.description);
            if (matchedAgents.length > 0) agentId = matchedAgents[0].id;
        }

        if (!assignments.has(agentId)) {
            assignments.set(agentId, []);
        }
        assignments.get(agentId)!.push(step.id);
    }

    return Array.from(assignments.entries()).map(([agentId, stepIds]) => ({
        agentId,
        status: 'idle' as const,
        stepIds,
    }));
}

/**
 * Get agent by ID
 */
export function getAgentById(id: string): SpecialistAgent | undefined {
    return SPECIALIST_AGENTS.find((agent) => agent.id === id);
}

/**
 * Get all registered agent IDs
 */
export function getRegisteredAgentIds(): string[] {
    return SPECIALIST_AGENTS.map((agent) => agent.id);
}
