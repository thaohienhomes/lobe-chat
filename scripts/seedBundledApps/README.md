# Bundled Apps System

## 📖 Overview

Bundled Apps are **shareable prompt templates** that allow you to create pre-configured AI assistants for specific use cases. Each bundled app has:

- **Clean URL**: `https://pho.chat/apps/bundled/[id]`
- **Pre-configured settings**: Model, system role, chat config
- **One-click setup**: Auto-creates session and redirects to chat

## 🚀 Quick Start

### 1. Seed Initial Apps

```bash
bun run seed:bundled-apps
```

This creates 3 default bundled apps:

- 🎨 **Artifact Creator** - Create interactive HTML/CSS/JS
- 🔍 **Code Reviewer** - Code review with best practices
- ✍️ **Content Writer** - Professional content writing

### 2. Share Links

Share these URLs with your community:

```
https://pho.chat/apps/bundled/artifact-creator
https://pho.chat/apps/bundled/code-reviewer
https://pho.chat/apps/bundled/content-writer
```

## ➕ Adding New Use Cases

### Method 1: Edit Seed Script (Recommended)

1. Open `scripts/seedBundledApps/index.ts`
2. Add new app to `BUNDLED_APPS` array:

```typescript
{
  id: 'my-custom-app',
  title: 'My Custom App',
  description: 'What this app does...',
  avatar: '🎯',
  backgroundColor: '#3b82f6',
  tags: ['tag1', 'tag2'],
  category: 'development', // or 'productivity', 'content', etc.
  systemRole: `Your custom system prompt here...`,
  config: {
    model: 'gpt-4o',
    provider: 'openai',
    params: { temperature: 0.7 },
  },
  chatConfig: {
    enableArtifact: true, // Enable for HTML/interactive content
    displayMode: 'chat',
  },
  openingMessage: 'Hi! How can I help?',
  openingQuestions: [
    'Question 1',
    'Question 2',
  ],
  isFeatured: false,
  isPublic: true,
}
```

3. Run seed script:

```bash
bun run seed:bundled-apps
```

### Method 2: Use tRPC API (Advanced)

```typescript
// In your admin panel or script
await trpc.bundledApp.createApp.mutate({
  id: 'my-app',
  title: 'My App',
  // ... other fields
});
```

## 📋 Available Categories

- `development` - Code, APIs, databases
- `productivity` - Tools, automation
- `content` - Writing, marketing
- `education` - Learning, tutoring
- `business` - Email, proposals

## 🎨 Customization Options

### Model Selection

```typescript
config: {
  model: 'gpt-4o',           // OpenAI
  // model: 'claude-3-5-sonnet-20241022', // Anthropic
  // model: 'gemini-2.0-flash-exp',       // Google
  provider: 'openai',
}
```

### Enable Artifacts

For interactive HTML/CSS/JS content:

```typescript
chatConfig: {
  enableArtifact: true,
  displayMode: 'chat',
}
```

### Temperature Settings

- `0.0-0.3` - Precise, deterministic (SQL, code review)
- `0.4-0.7` - Balanced (general purpose)
- `0.8-1.0` - Creative (content writing, brainstorming)

## 📊 Examples Included

The seed script includes **4 commented examples** you can uncomment:

1. **API Designer** 🔌 - RESTful API design with OpenAPI specs
2. **Data Visualizer** 📊 - Interactive charts with Chart.js/D3.js
3. **SQL Expert** 🗄️ - Database queries and schema design
4. **UI Component Builder** 🧩 - React/Vue components with Tailwind

To enable them:

1. Open `scripts/seedBundledApps/index.ts`
2. Uncomment the examples (remove `/*` and `*/`)
3. Run `bun run seed:bundled-apps`

## 🔗 URL Structure

```
https://pho.chat/apps/bundled/[id]
                              ↑
                              Your app ID
```

## 🎯 Best Practices

1. **Use descriptive IDs**: `artifact-creator` not `app1`
2. **Write clear system roles**: Be specific about capabilities
3. **Add opening questions**: Help users get started
4. **Choose right model**: Match model to task complexity
5. **Set appropriate temperature**: Lower for precision, higher for creativity
6. **Use categories & tags**: Make apps discoverable

## 🛠️ Troubleshooting

### App not found

- Check if seed script ran successfully
- Verify app ID matches URL

### Session not created

- Check user authentication
- Verify database connection

### Wrong model used

- Check `config.model` and `config.provider` match
- Ensure API keys are configured

## 📚 Related Files

- Schema: `packages/database/src/schemas/bundledApp.ts`
- Model: `packages/database/src/models/bundledApp.ts`
- Router: `src/server/routers/lambda/bundledApp.ts`
- Page: `src/app/apps/bundled/[id]/page.tsx`
- Seed: `scripts/seedBundledApps/index.ts`
