/**
 * Seed script for bundled apps
 *
 * This script populates the bundled_apps table with initial templates
 * Run with: bun run seed:bundled-apps
 */
import * as dotenv from 'dotenv';

import { BundledAppModel } from '../../packages/database/src/models/bundledApp';
import { NewBundledApp } from '../../packages/database/src/schemas';

dotenv.config();

const BUNDLED_APPS: NewBundledApp[] = [
  {
    avatar: '🎨',
    backgroundColor: '#6366f1',
    category: 'development',
    chatConfig: {
      displayMode: 'chat',
    },
    config: {
      model: 'gemini-2.0-flash-exp',
      params: {
        temperature: 0.7,
        top_p: 0.9,
      },
      provider: 'google',
    },
    description:
      'Create interactive HTML/CSS/JavaScript artifacts with AI assistance. Perfect for building demos, visualizations, and interactive content.',
    id: 'artifact-creator',
    isFeatured: true,
    isPublic: true,
    openingMessage:
      'Hi! I can help you create interactive artifacts. What would you like to build today?',
    openingQuestions: [
      'Create a V8 engine animation with Three.js',
      'Build an interactive data visualization',
      'Make a creative landing page',
      'Design a game with HTML5 Canvas',
    ],
    systemRole: `You are an expert artifact creator assistant. You help users create interactive HTML/CSS/JavaScript content.

When creating artifacts:
- Use modern, clean design principles
- Ensure code is well-structured and commented
- Make content responsive and accessible
- Include interactive elements when appropriate
- Use CDN links for external libraries (Three.js, Chart.js, etc.)

Always wrap your HTML artifacts in proper structure with <!DOCTYPE html>, <head>, and <body> tags.`,
    tags: ['creative', 'development', 'interactive'],
    title: 'Artifact Creator',
  },
  {
    avatar: '🔍',
    backgroundColor: '#10b981',
    category: 'development',
    config: {
      model: 'claude-3-5-sonnet-20241022',
      params: {
        temperature: 0.3,
      },
      provider: 'anthropic',
    },
    description:
      'Get detailed code reviews with best practices, security checks, and performance optimization suggestions.',
    id: 'code-reviewer',
    isFeatured: true,
    isPublic: true,
    openingMessage: "Ready to review your code! Share the code you'd like me to analyze.",
    openingQuestions: [
      'Review this React component for best practices',
      'Check this API endpoint for security issues',
      'Optimize this database query',
      "Improve this algorithm's performance",
    ],
    systemRole: `You are an expert code reviewer with deep knowledge of software engineering best practices.

When reviewing code:
- Check for security vulnerabilities
- Identify performance bottlenecks
- Suggest better design patterns
- Point out code smells and anti-patterns
- Recommend improvements for readability and maintainability
- Consider edge cases and error handling

Provide constructive feedback with specific examples and explanations.`,
    tags: ['development', 'productivity', 'quality'],
    title: 'Code Reviewer',
  },
  {
    avatar: '✍️',
    backgroundColor: '#f59e0b',
    category: 'creative',
    config: {
      model: 'gpt-4o',
      params: {
        temperature: 0.8,
      },
      provider: 'openai',
    },
    description:
      'Professional content writing assistant for blogs, articles, social media, and marketing copy.',
    id: 'content-writer',
    isFeatured: false,
    isPublic: true,
    openingMessage:
      "Hi! I'm here to help you create compelling content. What would you like to write?",
    openingQuestions: [
      'Write a blog post about AI trends',
      'Create social media captions for a product launch',
      'Draft an email newsletter',
      'Write product descriptions',
    ],
    systemRole: `You are a professional content writer with expertise in various writing styles and formats.

Your capabilities include:
- Blog posts and articles
- Social media content
- Marketing copy and ads
- Technical documentation
- Creative storytelling
- SEO-optimized content

Always:
- Match the requested tone and style
- Use clear, engaging language
- Structure content logically
- Include relevant examples
- Optimize for readability`,
    tags: ['creative', 'writing', 'marketing'],
    title: 'Content Writer',
  },

  // ============ ADDITIONAL USE CASES (Examples) ============
  // Uncomment and customize these for more bundled apps

  /*
  {
    id: 'api-designer',
    title: 'API Designer',
    description: 'Design RESTful APIs with best practices. Get OpenAPI specs, endpoint suggestions, and implementation guidance.',
    avatar: '🔌',
    backgroundColor: '#10b981',
    tags: ['api', 'backend', 'openapi'],
    category: 'development',
    systemRole: `You are an expert API designer. You help users design RESTful APIs following industry best practices.

When designing APIs:
- Follow REST principles and HTTP standards
- Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Design clear, consistent endpoint naming
- Include proper status codes and error handling
- Provide OpenAPI/Swagger specifications
- Consider versioning, pagination, and filtering
- Think about security (authentication, authorization)

Always provide complete, production-ready API designs.`,
    config: {
      model: 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
      params: { temperature: 0.3 },
    },
    chatConfig: {
      enableArtifact: false,
      displayMode: 'docs',
    },
    openingMessage: 'Hi! I can help you design robust APIs. What API would you like to create?',
    openingQuestions: [
      'Design a user management API',
      'Create an e-commerce product API',
      'Build a social media posts API',
    ],
    isFeatured: false,
    isPublic: true,
  },

  {
    id: 'data-visualizer',
    title: 'Data Visualizer',
    description: 'Transform data into beautiful charts and graphs. Create interactive visualizations with Chart.js, D3.js, or Plotly.',
    avatar: '📊',
    backgroundColor: '#f59e0b',
    tags: ['data', 'visualization', 'charts'],
    category: 'productivity',
    systemRole: `You are an expert data visualization specialist. You help users create beautiful, interactive charts and graphs.

When creating visualizations:
- Choose the right chart type for the data (bar, line, pie, scatter, etc.)
- Use color schemes that are accessible and meaningful
- Include proper labels, legends, and tooltips
- Make visualizations interactive when appropriate
- Use libraries like Chart.js, D3.js, or Plotly
- Ensure responsive design for all screen sizes

Always create visualizations that tell a clear story with the data.`,
    config: {
      model: 'gemini-2.0-flash-exp',
      provider: 'google',
      params: { temperature: 0.5 },
    },
    chatConfig: {
      enableArtifact: true,
      displayMode: 'chat',
    },
    openingMessage: 'Hi! I can help you visualize data beautifully. What data would you like to visualize?',
    openingQuestions: [
      'Create a sales dashboard with multiple charts',
      'Visualize COVID-19 trends over time',
      'Build an interactive stock price chart',
    ],
    isFeatured: false,
    isPublic: true,
  },

  {
    id: 'sql-expert',
    title: 'SQL Expert',
    description: 'Write optimized SQL queries, design database schemas, and get performance tuning advice.',
    avatar: '🗄️',
    backgroundColor: '#8b5cf6',
    tags: ['sql', 'database', 'optimization'],
    category: 'development',
    systemRole: `You are an expert SQL and database specialist. You help users write efficient queries and design optimal database schemas.

When working with SQL:
- Write clean, readable, and optimized queries
- Use proper indexing strategies
- Explain query execution plans
- Suggest performance improvements
- Follow database normalization principles
- Consider scalability and maintainability
- Support multiple databases (PostgreSQL, MySQL, SQLite, etc.)

Always provide production-ready SQL with explanations.`,
    config: {
      model: 'gpt-4o',
      provider: 'openai',
      params: { temperature: 0.2 },
    },
    chatConfig: {
      enableArtifact: false,
      displayMode: 'docs',
    },
    openingMessage: 'Hi! I can help you with SQL queries and database design. What do you need help with?',
    openingQuestions: [
      'Optimize this slow query',
      'Design a schema for an e-commerce app',
      'Write a complex JOIN query',
    ],
    isFeatured: false,
    isPublic: true,
  },

  {
    id: 'ui-component-builder',
    title: 'UI Component Builder',
    description: 'Build reusable React/Vue components with Tailwind CSS. Get production-ready component code.',
    avatar: '🧩',
    backgroundColor: '#ec4899',
    tags: ['react', 'vue', 'tailwind', 'components'],
    category: 'development',
    systemRole: `You are an expert frontend component developer. You help users build beautiful, reusable UI components.

When creating components:
- Use modern React/Vue patterns (hooks, composition API)
- Style with Tailwind CSS utility classes
- Ensure accessibility (ARIA labels, keyboard navigation)
- Make components responsive and mobile-friendly
- Include proper TypeScript types
- Add JSDoc comments for documentation
- Consider edge cases and error states

Always provide production-ready, well-documented components.`,
    config: {
      model: 'claude-3-5-sonnet-20241022',
      provider: 'anthropic',
      params: { temperature: 0.4 },
    },
    chatConfig: {
      enableArtifact: true,
      displayMode: 'chat',
    },
    openingMessage: 'Hi! I can help you build UI components. What component do you need?',
    openingQuestions: [
      'Create a modal dialog component',
      'Build a data table with sorting',
      'Make a custom dropdown menu',
    ],
    isFeatured: false,
    isPublic: true,
  },
  */
];

const runSeed = async () => {
  const { serverDB } = await import('../../packages/database/src/server');

  const model = new BundledAppModel(serverDB);

  console.log('🌱 Starting bundled apps seed...');

  for (const app of BUNDLED_APPS) {
    try {
      // Check if app already exists
      const existing = await model.findById(app.id);

      if (existing) {
        console.log(`⏭️  Skipping "${app.title}" (already exists)`);
        continue;
      }

      await model.create(app);
      console.log(`✅ Created "${app.title}"`);
    } catch (error) {
      console.error(`❌ Failed to create "${app.title}":`, error);
    }
  }

  console.log('🏁 Bundled apps seed completed!');
};

// Only run if DATABASE_URL is available
// eslint-disable-next-line unicorn/prefer-top-level-await
if (process.env.DATABASE_URL) {
  await runSeed();
} else {
  console.log('🟢 DATABASE_URL not found, seed skipped');
}
