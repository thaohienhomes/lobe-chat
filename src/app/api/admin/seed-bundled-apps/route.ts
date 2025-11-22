import { NextResponse } from 'next/server';

import { BundledAppModel } from '@/database/models/bundledApp';
import { NewBundledApp } from '@/database/schemas';
import { serverDB } from '@/database/server';

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
];

export const GET = async () => {
  try {
    // First, check if table exists by trying a simple query
    let tableExists = false;
    try {
      const model = new BundledAppModel(serverDB);
      await model.findById('test-check');
      tableExists = true;
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('relation "bundled_apps" does not exist')) {
        return NextResponse.json(
          {
            error: 'Table "bundled_apps" does not exist. Please run database migration first.',
            hint: 'Set MIGRATE_ON_BUILD=1 in Vercel environment variables and redeploy, or run migration manually.',
            success: false,
          },
          { status: 500 },
        );
      }
      // Other errors mean table exists but query failed for other reasons
      tableExists = true;
    }

    if (!tableExists) {
      return NextResponse.json(
        {
          error: 'Database table not ready',
          success: false,
        },
        { status: 500 },
      );
    }

    const model = new BundledAppModel(serverDB);

    const results = {
      created: [] as string[],
      errors: [] as string[],
      skipped: [] as string[],
    };

    for (const app of BUNDLED_APPS) {
      try {
        const existing = await model.findById(app.id);

        if (existing) {
          results.skipped.push(app.title);
          continue;
        }

        await model.create(app);
        results.created.push(app.title);
      } catch (error) {
        results.errors.push(`${app.title}: ${(error as Error).message}`);
      }
    }

    return NextResponse.json({
      message: 'Bundled apps seed completed',
      results,
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
        success: false,
      },
      { status: 500 },
    );
  }
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;
