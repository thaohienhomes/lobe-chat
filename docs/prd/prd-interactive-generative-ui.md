# Pho.Chat PRD: Interactive & Generative UI

> **Version:** 1.0 | **Date:** March 8, 2026 | **Status:** Implementation Ready
> **Product:** Pho.Chat (lobe-chat fork) | **Repo:** `thaohienhomes/lobe-chat`

---

## 1. Executive Summary

Pho.Chat is an AI chat assistant (lobe-chat fork, Next.js/React) serving medical, academic research, and education verticals with 70+ AI models, Artifacts, and code rendering capabilities. This PRD defines a new product pillar: **Interactive & Generative UI** — the ability for AI to generate rich, visual, interactive experiences directly within the chat interface.

Inspired by Google's Generative UI research (November 2025) and Gemini's Interactive Images, this feature suite transforms Pho.Chat from a text-based AI assistant into a visual-interactive platform.

### Strategic Vision

- Phase 1–2: Leverage existing Artifacts engine + Vision AI (minimal new infrastructure)
- Phase 2.5: Multi-agent content visualization pipeline (arXivisual-inspired)
- Phase 3: Add AI rendering capabilities via API integration (Fal.ai/Replicate)
- Phase 4–5: Build full Generative UI engine + Creator ecosystem
- New Vertical: Real Estate (BDS) with map, 3D, rendering, interactive floor plans

---

## 2. Problem Statement

### 2.1 Current Limitations

- AI chat responses are primarily text-based (markdown), insufficient for visual-heavy domains
- Users cannot interact with images or diagrams — only view static content
- Sales, teachers, doctors, researchers need rich visual tools to communicate complex info
- Competing products (Gemini, ChatGPT) are adding visual/interactive features

### 2.2 Opportunity

Google Research demonstrated Generative UI results are preferred over standard LLM markdown in the majority of cases. Pho.Chat already has the core infrastructure to implement similar capabilities focused on specific high-value verticals.

---

## 3. Target Users & Verticals

| Vertical    | Primary User     | End User          | Key Use Case                                                            |
| ----------- | ---------------- | ----------------- | ----------------------------------------------------------------------- |
| Real Estate | Sales/Agents     | Home Buyers       | Interactive floor plans, AI renders, map + POI, virtual staging         |
| Education   | Teachers         | Students          | Interactive diagrams, live demos, quiz generation, curriculum authoring |
| Medical     | Doctors/Students | Patients/Learners | Anatomy exploration, X-ray annotation, patient education                |
| Research    | Researchers      | Peers/Public      | Molecular visualization, paper figures, data exploration                |

---

## 4. Integration Architecture

### 4.1 Mechanism A: Plugin System

Each vertical has a dedicated plugin (e.g., "Pho.RealEstate", "Pho.Education") that registers:

- New Artifact types (InteractiveImage, GenerativeDiagram, PropertyMap, etc.)
- Tool definitions the AI model can call
- Domain-specific system prompts

**Plugin Lifecycle:**

1. User installs plugin from Pho.Chat Plugin Store
2. Plugin registers tools + artifact types with chat engine
3. User sends message → AI sees available tools from active plugins
4. Model decides which tool to call based on user intent
5. Tool output rendered as appropriate Artifact type
6. User interacts with Artifact; follow-ups route back to model

### 4.2 Mechanism B: Auto-Detect Intent & Generate

System automatically detects user intent and generates optimal interactive response.

**Intent Detection Pipeline:**

1. Message Analysis → AI analyzes for intent signals
2. Context Enrichment → Add user profile, vertical preference, history
3. Format Decision → Model decides: text, interactive image, diagram, mini-app, map, chart, simulation, or hybrid
4. Code Generation → For interactive formats, model generates React/HTML code
5. Artifact Rendering → Code rendered in Artifact engine with full interactivity

**System Prompt Layers:**

- Base Layer: General Generative UI instructions
- Vertical Layer: Domain-specific knowledge and UI patterns
- User Layer: Preferences from user profile
- Context Layer: Conversation state, uploaded files

**Decision Matrix:**

| User Signal                     | Detected Intent      | Output Format       | Example                                |
| ------------------------------- | -------------------- | ------------------- | -------------------------------------- |
| Uploads floor plan image        | Property exploration | Interactive Image   | Clickable floor plan with room details |
| "Show me the digestive system"  | Educational diagram  | Generative Diagram  | SVG anatomy with click-to-explore      |
| "Compare 3 apartments"          | Data comparison      | Interactive Chart   | Side-by-side Recharts + map            |
| "Explain DNA replication"       | Process explanation  | Animated Simulation | Step-by-step animated diagram          |
| "Calculate mortgage for 3B VND" | Financial tool       | Mini Calculator App | Interactive loan calculator            |
| Uploads X-ray image             | Medical annotation   | Annotated Image     | AI-labeled regions with clinical info  |

### 4.3 Recommended: Hybrid Approach

- **Plugins** provide deep vertical-specific tools and data connections
- **Auto-Detect** handles the "magic" experience for any prompt
- **Progressive Enhancement:** Auto-detect works out-of-the-box; plugins unlock deeper features

---

## 5. Feature Specifications by Phase

### 5.1 Phase 1: Interactive Images (Month 1–2)

**Codename: "Tap-to-Explore"**

Transform static images into clickable, explorable experiences.

**Core Flow:**

- Input: Any image (photo, diagram, floor plan, medical image, chart)
- Processing: Vision AI outputs structured JSON with detected regions
- Output: React Artifact with image + SVG overlay + clickable hotspots + detail panel

**AI Detection Output Schema:**

```typescript
interface InteractiveRegions {
  image_type: 'floor_plan' | 'anatomy' | 'cell_diagram' | 'molecule' | 'photo' | 'chart';
  context: string;
  regions: Array<{
    id: string;
    label: string;
    bounds: { x: number; y: number; w: number; h: number }; // percentages
    color: string;
    details: Record<string, any>; // domain-specific key-value pairs
    follow_ups: string[]; // suggested questions
  }>;
}
```

**Artifact Component Structure:**

- InteractiveImage (parent container)
  - ImageLayer (base image, zoom/pan)
  - OverlayLayer (SVG hotspots, hover/click)
  - DetailPanel (slide-out info)
  - FollowUpChips (suggested questions → route to AI)
  - LegendBar (color-coded labels)

**Tech Stack:**

- Vision Models: GPT-4o / Claude Vision / Gemini (already available)
- Rendering: React + SVG overlays (within Artifact engine)
- Optional: SAM2 (facebook/sam2) for pixel-precise segmentation
- Optional: GroundingDINO (IDEA-Research/GroundingDINO) for text-guided detection

**Technical Requirements:**

- Multi-model vision API integration for region detection
- New Artifact type: InteractiveImage
- SVG overlay with responsive percentage-based coordinates
- Touch (mobile) + mouse (desktop) support
- Zoom/pan for large images
- Smooth CSS transitions for panel animations
- Keyboard navigation + ARIA labels

---

### 5.2 Phase 2: Generative Diagrams (Month 3–4)

**Codename: "Text-to-Interactive"**

AI generates complete interactive diagrams from text descriptions.

**Diagram Types:**

| Type         | Description                     | Example Prompt                        |
| ------------ | ------------------------------- | ------------------------------------- |
| Structural   | Labeled parts of a system       | "Tạo sơ đồ hệ tuần hoàn có thể click" |
| Process/Flow | Step-by-step with animations    | "Animated diagram of DNA replication" |
| Comparison   | Side-by-side with toggle/slider | "So sánh 3 căn hộ tầng 15, 20, 25"    |
| Timeline     | Chronological with zoom         | "Timeline of Vietnam War"             |
| Map-based    | Geographic with data overlay    | "Map earthquake zones SE Asia"        |
| Simulation   | Interactive parameters          | "Simulate supply/demand curves"       |

**Education Focus — Teacher Authoring:**

- Teacher describes topic → AI generates interactive diagram
- Refine via conversation: "Make labels bigger", "Add quiz at end"
- Share via link or embed in LMS
- Students interact independently

**Education Focus — Live Classroom:**

- Teacher projects Pho.Chat on screen
- Types/speaks prompt → AI generates interactive visual immediately
- Students see generation in real-time
- Students access same visual on their devices

**Technical Requirements:**

- Enhanced system prompts for SVG/Canvas/React code generation
- Template library for common diagram types
- Post-processing pipeline for code fixes
- Version history for iterative refinement
- Export: standalone HTML, PNG, SVG, PDF

---

### 5.3 Phase 2.5: Content Visualizer (Month 4–5)

**Codename: "Paper-to-Visual"**

> Full specification in separate document: `docs/prd/phase-2.5-content-visualizer.md`

Multi-agent pipeline transforming research papers, textbooks, and educational content into interactive scrollytelling experiences with 3Blue1Brown-style animations. Inspired by arXivisual (rajshah6/arXivisual).

**7-Agent Pipeline:** ContentIngestion → ConceptAnalyzer → VisualizationPlanner → CodeGenerator (dual-track: React Artifact + Manim) → QualityValidator (4-stage + retry) → NarrationGenerator → AssemblyOrchestrator

---

### 5.4 Phase 3: AI Rendering & Virtual Staging (Month 5–7)

**Codename: "See Your Space"**

**Core Features:**

1. Floor Plan → Rendered Room (ControlNet + Stable Diffusion)
2. Virtual Staging (empty room → furnished preview)
3. Style Transfer (re-render in different style preserving layout)
4. Before/After Comparison (interactive slider)

**Tech Stack:**

- Fal.ai or Replicate API (pay-per-use, no GPU needed)
- ControlNet (lllyasviel/ControlNet): preserves spatial layout
- Stable Diffusion XL / Flux: base generation model
- IP-Adapter (tencent-ailab/IP-Adapter): style transfer
- Real-ESRGAN (xinntao/Real-ESRGAN): image upscaling
- Alternative: GPT-4o / Gemini native image generation

---

### 5.5 Phase 4: Full Generative UI Engine (Month 8–10)

**Codename: "Dynamic View for Pho.Chat"**

AI generates complete custom UIs per response (Google Generative UI paradigm).

**Architecture (3-Component Model):**

1. Tool Server: image gen, web search, map, POI, mortgage calc, medical/molecular DBs
2. System Instructions: multi-layered prompts (Base + Vertical + User + Context)
3. Post-Processing: code validation, sanitization, error correction

**Output Types:** interactive diagrams, dashboards, mini-apps, games/quizzes, maps, galleries, step-by-step guides, hybrid layouts

---

### 5.6 Phase 5: Creator Studio & Collaboration (Month 11–12)

**Codename: "Creator Studio"**

1. Template Builder: reusable interactive templates via conversation
2. Content Library: shared repository by vertical/subject/complexity
3. Live Presentation Mode: classroom projection with sync
4. Export & Embed: standalone HTML, LMS embed, shareable links
5. Analytics Dashboard: click tracking, time spent, engagement metrics

---

## 6. Real Estate Vertical Deep-Dive

| Layer                  | Feature                           | Tech Stack              | Phase   |
| ---------------------- | --------------------------------- | ----------------------- | ------- |
| Map & Routes           | Interactive map + POI + nav       | Leaflet/Mapbox + OSRM   | Phase 1 |
| Data Viz               | Compare properties, mortgage calc | Recharts + D3.js        | Phase 1 |
| Interactive Floor Plan | Click-to-explore rooms            | Vision AI + React SVG   | Phase 1 |
| AI Rendering           | Floor plan → photorealistic       | Fal.ai + ControlNet     | Phase 3 |
| Virtual Staging        | Empty room → furnished            | ControlNet + IP-Adapter | Phase 3 |
| 3D Viewer              | Upload .glb → explore             | Three.js / Model Viewer | Phase 3 |
| Full Property App      | Complete exploration mini-app     | Generative UI engine    | Phase 4 |

**Key Repos:**

- `Leaflet/Leaflet` — map rendering
- `Project-OSRM/osrm-backend` — route calculation
- `google/model-viewer` — 3D model viewer
- `pmndrs/react-three-fiber` — React Three.js wrapper
- `lllyasviel/ControlNet` — layout-preserving image gen
- `xinntao/Real-ESRGAN` — image upscaling
- `comfyanonymous/ComfyUI` — SD workflow engine
- `facebookresearch/sam2` — Segment Anything
- `IDEA-Research/GroundingDINO` — text-guided detection

---

## 7. Timeline & Milestones

| Phase | Deliverable                               | Timeline    |
| ----- | ----------------------------------------- | ----------- |
| 1     | Interactive Images (Tap-to-Explore)       | Month 1–2   |
| 2     | Generative Diagrams (Text-to-Interactive) | Month 3–4   |
| 2.5   | Content Visualizer (Paper-to-Visual)      | Month 4–5   |
| 3     | AI Rendering & Virtual Staging            | Month 5–7   |
| 4     | Full Generative UI Engine                 | Month 8–10  |
| 5     | Creator Studio & Collaboration            | Month 11–12 |

---

## 8. Technical Architecture

### 8.1 Codebase Integration Points

- `src/features/Conversation/` → Add InteractiveArtifact renderer
- `src/store/` → Add interactive-ui store slice
- `src/services/` → Add vision-analysis, rendering-api services
- `src/plugins/` → Add vertical plugins
- `src/components/InteractiveUI/` → New component library
- `src/prompts/` → System prompt templates per vertical

### 8.2 New Component Tree

```
src/components/InteractiveUI/
├── InteractiveImage/
│   ├── ImageLayer.tsx
│   ├── OverlayLayer.tsx
│   ├── DetailPanel.tsx
│   ├── FollowUpChips.tsx
│   └── RegionLabel.tsx
├── GenerativeDiagram/
│   ├── DiagramRenderer.tsx
│   └── AnimationController.tsx
└── shared/
    ├── LegendBar.tsx
    ├── MiniMap.tsx
    ├── ComparisonSlider.tsx
    └── LoadingState.tsx
```

### 8.3 System Prompt: Base Generative UI

```
You are Pho.Chat, an AI assistant that creates rich interactive visual experiences.
When a visual/interactive format would be more effective than text, generate
a complete React component instead of markdown.

FORMAT DECISION RULES:
- User uploads image → analyze and create Interactive Image with clickable regions
- User asks about spatial/structural concept → generate Interactive Diagram
- User asks to compare items → generate Comparison Chart/Table
- User needs calculator/tool → generate Mini App
- Simple factual question → respond with text

CODE STANDARDS:
- React functional components with hooks
- Tailwind CSS only (no custom CSS imports)
- All interactive elements: hover + click states
- Smooth transitions (CSS transition or animation)
- Mobile responsive (touch support)
- Dark theme preferred (#0F172A family)
- Vietnamese language support
- ARIA labels for accessibility
- NEVER use localStorage/sessionStorage
```

---

## 9. Success Metrics

| Metric                      | Target                       |
| --------------------------- | ---------------------------- |
| Interactive engagement rate | >60% viewers click ≥1 region |
| Generation success rate     | >90% render without errors   |
| User preference vs text     | >70% prefer interactive      |
| Time-to-first-interaction   | <3 seconds                   |
| BDS conversion              | >20% users share links       |
| Education content creation  | >50 templates in first month |

---

## 10. Implementation Priority for Claude Code

1. Start with Phase 1 InteractiveImage component
2. Create VisionAnalysisService with structured output prompts
3. Build InteractiveImage Artifact type, register in Artifact engine
4. Add plugin manifest system for vertical-specific tools
5. Create system prompt templates (Real Estate + Education first)
6. Build DetailPanel + FollowUpChips components
7. Add zoom/pan and touch support
8. Write tests for region detection JSON parsing and overlay rendering

**Key Dependencies to Add:**

- leaflet + react-leaflet
- @google/model-viewer
- framer-motion (optional)
- fal-client or replicate (Phase 3)

**Environment Variables:**

- `FAL_AI_KEY` or `REPLICATE_API_TOKEN` (Phase 3)
- `MAPBOX_TOKEN` (if using Mapbox)
- Vision model keys already in Pho.Chat config
