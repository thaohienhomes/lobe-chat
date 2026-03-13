# Visualizer Integration Map

> Generated from codebase exploration for Content Visualizer Engine v2.0 integration.
> Reference: `docs/prd/prd-content-visualizer-v2.md`, `docs/prd/visualizer-kickstart.md`

---

## Message Rendering

### Chat Message Flow
```
VirtualizedList
  -> ChatItem (src/features/Conversation/components/ChatItem/index.tsx)
    -> AssistantMessage (src/features/Conversation/Messages/Assistant/index.tsx)
      -> SearchGrounding, FileChunks, Reasoning (optional)
      -> DefaultMessage (text content via MarkdownRenderer)
      -> ImageFileListViewer, VideoFileListViewer (optional)
      -> BibliographySection (optional)
      -> Tool[] (tool calls rendered at bottom)
```

### Key Components
- **AssistantMessage**: `src/features/Conversation/Messages/Assistant/index.tsx`
  - Main message renderer. Receives `tools` array from message data.
  - Tools rendered at the bottom of the message in a horizontal flex-wrap container.
  - Each tool rendered via `<Tool>` component.
- **Tool**: `src/features/Conversation/Messages/Assistant/Tool/index.tsx`
  - Wraps `<Inspectors>` (header bar with tool name, loading state) + `<Render>` (body content).
  - `<Render>` is collapsible via `<AnimatedCollapsed>`.
- **Tool Render**: `src/features/Conversation/Messages/Assistant/Tool/Render/index.tsx`
  - Dispatches to `CustomRender` for plugin/builtin tools.
- **CustomRender**: `src/features/Conversation/Messages/Assistant/Tool/Render/CustomRender.tsx`
  - Routes rendering based on `plugin.type`. Uses `<PluginRender>` for non-default/non-mcp types.
  - For default types: shows `<Arguments>` + `<PluginResult>`.

### Tool Call Render (current behavior)
- Tool calls appear as collapsible cards at the **bottom** of the assistant message.
- Each card shows: tool name, arguments (collapsible), result (collapsible).
- No inline rendering between text blocks currently.

### Integration Point for Visualizer
- **Option A (inline)**: Modify `AssistantMessage` to detect `show_widget` tool calls and render `<VisualizerRenderer>` inline between content and tool section.
- **Option B (replace tool card)**: In `Tool/index.tsx` or `CustomRender.tsx`, detect `show_widget` apiName and render `<VisualizerRenderer>` instead of default tool UI.
- **Recommended**: Option A for inline placement + Option B for hiding the tool card for `show_widget`.

---

## Plugin/Tool System

### Builtin Tool Registry
- **Registry file**: `src/tools/index.ts`
  - Exports `builtinTools` array of `LobeBuiltinTool` objects.
  - Current builtin tools: `lobe-artifacts`, `slides`, `dalle`, `local-system`, `web-browsing`, `scientific-skills`.
- **Tool manifest structure**: `src/tools/artifacts/index.ts` (example)
  ```typescript
  export const ArtifactsManifest: BuiltinToolManifest = {
    api: [],
    identifier: 'lobe-artifacts',
    meta: { avatar, title },
    systemRole: systemPrompt,
    type: 'builtin',
  };
  ```
- **Custom renders**: `src/tools/renders.ts`
  - Maps tool identifier -> React component for custom UI rendering.
  - Example: `DalleManifest.identifier -> DalleRender`.

### Tool Store
- **Builtin tool state**: `src/store/tool/slices/builtin/initialState.ts`
  - Loads from `builtinTools` array.
- **Tool selectors**: `src/store/tool/selectors/tool.ts`
- **Plugin actions**: `src/store/chat/slices/plugin/action.ts`
  - Handles tool invocation, re-invocation, argument updates.

### How to Register a New Builtin Tool
1. Create tool directory: `src/tools/visualizer/`
2. Create manifest: `src/tools/visualizer/index.ts` with `BuiltinToolManifest`
3. Add to `src/tools/index.ts` `builtinTools` array
4. (Optional) Add custom render in `src/tools/renders.ts`
5. Add system prompt in manifest's `systemRole` field

### Tool Call Handler
- **Server-side**: `src/store/chat/slices/plugin/action.ts`
  - `triggerToolCalls(id, params)` dispatches tool execution after streaming completes
  - Invocation chain: `triggerToolCalls` -> `internal_invokeDifferentTypePlugin` -> one of:
    - `invokeBuiltinTool()` for builtin tools (DALL-E, scientific-skills, etc.)
    - `invokeDefaultTypePlugin()` for standard plugins with apiName
    - `invokeMCPTypePlugin()` for Model Context Protocol tools
    - `invokeMarkdownTypePlugin()` for markdown-rendering plugins
    - `invokeStandaloneTypePlugin()` for standalone plugins
- **Tool type field**: `ChatPluginPayload.type` can be `'builtin'`, `'mcp'`, `'default'`, etc.
- **Tool schema conversion**: `src/utils/toolManifest.ts` `convertPluginManifestToToolsCalling()` converts manifests to OpenAI `ChatCompletionTool[]` format
- **Tool selection**: `src/store/tool/selectors/tool.ts` `enabledSchema()` returns tools for enabled plugins

### Plugin Service Layer
- **Factory**: `src/services/plugin/index.ts` (selects server or client implementation)
- **Server**: `src/services/plugin/server.ts` (tRPC-based)
- **Client**: `src/services/plugin/client.ts` (direct DB)
- **tRPC router**: `src/server/routers/lambda/plugin.ts`

### Tool Store Slices
- `src/store/tool/slices/builtin/` -- builtin tool state + actions
- `src/store/tool/slices/plugin/` -- installed plugin management
- `src/store/tool/slices/customPlugin/` -- user-created custom plugins
- `src/store/tool/slices/scientific/` -- scientific tools (PubMed, ClinicalTrials, ChEMBL)
- `src/store/tool/slices/mcpStore/` -- MCP plugin management

---

## Streaming

### SSE Streaming Pipeline
```
chatService.createAssistantMessage()  (src/services/chat/index.ts)
  -> fetchSSE()  (packages/utils/src/fetch/fetchSSE.ts)
    -> EventSource (SSE)
      -> onMessageHandle(chunk)  callback
```

### Streaming Handler Location
- **Main handler (v2)**: `src/store/chat/slices/aiChat/actions/generateAIChatV2.ts`
  - Line ~442: `onMessageHandle: async (chunk) => { ... }`
- **Main handler (v1)**: `src/store/chat/slices/aiChat/actions/generateAIChat.ts`
  - Line ~437: similar `onMessageHandle` callback
- **fetchSSE implementation**: `packages/utils/src/fetch/fetchSSE.ts`

### Chunk Types Available
From `packages/utils/src/fetch/fetchSSE.ts`:
```typescript
type MessageChunk =
  | MessageTextChunk        // { type: 'text', text: string }
  | MessageToolCallsChunk   // { type: 'tool_calls', tool_calls: MessageToolCall[], isAnimationActives?: boolean[] }
  | MessageReasoningChunk   // { type: 'reasoning', text?: string, signature?: string }
  | MessageGroundingChunk   // { type: 'grounding', grounding: GroundingSearch }
  | MessageUsageChunk       // { type: 'usage', usage: ModelTokensUsage }
  | MessageBase64ImageChunk // { type: 'base64_image', ... }
  | MessageSpeedChunk       // { type: 'speed', speed: ModelSpeed }
```

### Tool Call Streaming Behavior
- `chunk.type === 'tool_calls'` fires with **accumulated** `tool_calls` array (not deltas).
- `internal_transformToolCalls(chunk.tool_calls)` transforms raw tool calls to app format.
- `internal_toggleToolCallingStreaming(messageId, isAnimationActives)` tracks animation state per tool.
- **No separate `tool_call_delta` event** -- tool calls are received as accumulated state updates.
- **Smooth animation**: `createSmoothToolCalls()` in fetchSSE.ts manages per-tool-call animation queues, incrementally updating `function.arguments` string with controlled speed.
- `isAnimationActives` boolean array tracks which tool calls are still animating (arguments still being revealed).

### Integration Point for Streaming Visualizer
- In `onMessageHandle`, when `chunk.type === 'tool_calls'`:
  - Check if any tool_call has `apiName === 'show_widget'`
  - Extract partial `widget_code` from `tool_call.arguments` (may be incomplete JSON during streaming)
  - Feed to `StreamingManager` for progressive iframe rendering
- The `parseToolCalls` function (from `@lobechat/model-runtime`) handles partial JSON parsing.

---

## Artifacts Reference

### Artifact Tag in Markdown
- **LobeArtifact Render**: `src/features/Conversation/components/MarkdownElements/LobeArtifact/Render/index.tsx`
  - Renders a clickable card in chat that opens the artifact in the Portal side panel.
  - Has `PREVIEWABLE_TYPES` set including custom types like:
    - `text/html`, `image/svg+xml`
    - `application/lobe.artifacts.react`
    - `application/lobe.artifacts.mermaid`
    - `application/lobe.artifacts.interactive-image`
    - `application/lobe.artifacts.generative-diagram`
    - `application/lobe.artifacts.content-visualizer`
    - `application/lobe.artifacts.ai-rendering`

### Portal Artifact Renderers
- **Base directory**: `src/features/Portal/Artifacts/Body/Renderer/`
- **HTML Renderer**: `src/features/Portal/Artifacts/Body/Renderer/HTML.tsx`
  - Uses **Blob URL** approach (not srcdoc)
  - `sandbox="allow-scripts allow-same-origin"` (NOTE: allows same-origin!)
  - No CSP meta tag injected
  - Auto-fixes AI-generated syntax errors
- **ContentVisualizer**: `src/features/Portal/Artifacts/Body/Renderer/ContentVisualizer.tsx` (exists)
- **Other renderers**: SVG.tsx, React/, GenerativeDiagram.tsx, InteractiveImage.tsx, AIRendering.tsx

### Sandbox Config (current Artifacts)
```html
<iframe
  sandbox="allow-scripts allow-same-origin"
  src={blobUrl}
  style={{ border: 'none', height, width }}
/>
```
**NOTE**: Current artifacts use `allow-same-origin` which is less restrictive than the Visualizer spec.
The Visualizer MUST use stricter sandboxing: `sandbox="allow-scripts"` only (no allow-same-origin).

---

## Theme

### System
- **Primary**: `antd` v5.27.3 + `antd-style` v3.7.1 (CSS-in-JS with `createStyles`)
- **UI library**: `@lobehub/ui` v2.12.4 (wraps antd with `ThemeProvider`, `ConfigProvider`)
- **No Tailwind CSS** in main app (Tailwind only for Artifact components per CLAUDE.md)

### Theme Provider
- **File**: `src/layout/GlobalProvider/AppTheme.tsx`
- **Wrapper**: `<ThemeProvider>` from `@lobehub/ui` wrapping entire app
- **Theme mode**: `useGlobalStore(systemStatusSelectors.themeMode)` returns `'light' | 'dark' | 'auto'`
- Uses antd CSS variables (`cssVar: true` in theme config)

### Get Current Theme in Components
```typescript
// Option 1: antd-style hook (most common in codebase)
import { createStyles } from 'antd-style';
const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  // isDarkMode: boolean
  // token: antd design token (colorText, colorBg, etc.)
}));

// Option 2: antd useToken
import { theme } from 'antd';
const { token } = theme.useToken();

// Option 3: Global store
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';
const themeMode = useGlobalStore(systemStatusSelectors.themeMode);
// Returns 'light' | 'dark' | 'auto'

// Option 4: antd-style useThemeMode
import { useThemeMode } from 'antd-style';
const { isDarkMode, themeMode } = useThemeMode();
```

### Mapping antd Tokens to Visualizer CSS Variables
```
--color-bg       -> token.colorBgContainer / transparent
--color-text     -> token.colorText
--color-text-secondary -> token.colorTextSecondary
--color-border   -> token.colorBorder
--color-accent   -> token.colorPrimary
--color-surface  -> token.colorBgElevated
```

---

## Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| React | ^19.2.1 | React 19 (latest) |
| Next.js | ~15.5.7 | App Router |
| antd | ^5.27.3 | UI framework |
| antd-style | ^3.7.1 | CSS-in-JS (createStyles, useThemeMode) |
| @lobehub/ui | ^2.12.4 | ThemeProvider, ConfigProvider, UI components |
| react-layout-kit | (via @lobehub/ui) | Flexbox, Center layout components |
| zustand | (workspace) | State management |
| partial-json | (workspace) | Partial JSON parsing (useful for streaming tool args) |
| morphdom | NOT installed | Must load from CDN inside iframe |

---

## Summary: Key Integration Points for Visualizer

| Component | File | Action |
|-----------|------|--------|
| Builtin tool registry | `src/tools/index.ts` | Add visualizer manifest |
| Tool render mapping | `src/tools/renders.ts` | Add visualizer custom render |
| Assistant message | `src/features/Conversation/Messages/Assistant/index.tsx` | Detect `show_widget` in tools, render inline |
| Tool component | `src/features/Conversation/Messages/Assistant/Tool/index.tsx` | Hide/replace for `show_widget` |
| Streaming handler | `src/store/chat/slices/aiChat/actions/generateAIChatV2.ts` | Intercept `tool_calls` for streaming widget |
| Theme integration | `src/layout/GlobalProvider/AppTheme.tsx` | Map antd tokens to CSS variables |
| Feature flag | `.env` / `next.config.ts` | `NEXT_PUBLIC_VISUALIZER_ENABLED` |
| New feature dir | `src/features/visualizer/` | All visualizer code |
