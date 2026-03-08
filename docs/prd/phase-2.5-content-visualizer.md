# Phase 2.5: Content Visualizer — Paper-to-Visual Pipeline

> **Version:** 1.1 Addendum | **Date:** March 8, 2026 | **Status:** Implementation Ready
> **Reference:** arXivisual (`rajshah6/arXivisual`) — TartanHacks 2026 Winner

---

## 1. Overview

A multi-agent AI pipeline that transforms any academic/educational content (research papers, textbook chapters, lecture notes, clinical guidelines) into interactive scrollytelling experiences with 3Blue1Brown-style animations, explorable diagrams, and AI-generated narration — rendered directly within Pho.Chat Artifacts.

### Key Difference vs. arXivisual

| Aspect          | arXivisual                    | Pho.Chat Content Visualizer                             |
| --------------- | ----------------------------- | ------------------------------------------------------- |
| Visual output   | Manim MP4 video only          | React/SVG Artifact (instant) + Manim video (optional)   |
| Render location | Server (Modal.com containers) | Browser (Artifacts) primary, server secondary           |
| Render time     | 30–60s per visualization      | <2s for Artifact, 30–60s if Manim needed                |
| Cost per render | $0.01–0.05 (GPU container)    | $0 for Artifact, pay-per-use for Manim                  |
| Input types     | arXiv papers only             | Papers, PDFs, textbooks, URLs, topics, images, lectures |
| Language        | English only                  | Vietnamese + English + multilingual                     |
| Interactivity   | Scroll + watch video          | Click, explore, quiz, follow-up Q\&A with AI            |
| Integration     | Standalone web app            | Native in Pho.Chat — continue conversation after        |

---

## 2. Multi-Agent Pipeline Architecture

### Pipeline Overview

```
User Input (paper URL / PDF / text / topic)
  │
  ├─ Agent 1: ContentIngestion      → Structured content (sections, equations, figures)
  ├─ Agent 2: ConceptAnalyzer        → Concept map with visualization types
  ├─ Agent 3: VisualizationPlanner   → Storyboard (scenes, visual elements, narration)
  ├─ Agent 4: CodeGenerator          → Track A: React Artifact  |  Track B: Manim Python
  ├─ Agent 5: QualityValidator       → 4-stage validation + retry loop (max 3)
  ├─ Agent 6: NarrationGenerator     → Voiceover script + TTS audio (optional)
  └─ Agent 7: AssemblyOrchestrator   → Final scrollytelling Artifact
```

---

### 2.1 Agent 1: ContentIngestion

**Role:** Fetch, parse, and structure input content into normalized format.
**LLM Model:** Claude Sonnet (fast, accurate for structured extraction)

#### Input Sources & Parsing

| Input Type   | Parser                     | Fallback                      | Output                      |
| ------------ | -------------------------- | ----------------------------- | --------------------------- |
| arXiv URL    | ar5iv HTML API (preferred) | arXiv PDF → pymupdf4llm       | Structured sections + LaTeX |
| PDF upload   | pymupdf4llm                | pdf2image + Vision OCR        | Markdown with equations     |
| Web URL      | readability + cheerio      | Puppeteer screenshot + Vision | Clean article text          |
| Raw text     | Direct LLM parsing         | N/A                           | Structured sections         |
| Topic prompt | LLM generates content      | Web search + synthesis        | Generated educational text  |

#### Output Schema

```typescript
interface ParsedContent {
  metadata: {
    title: string;
    authors?: string[];
    source: 'arxiv' | 'pdf' | 'url' | 'text' | 'topic';
    sourceUrl?: string;
    language: 'vi' | 'en' | string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
  };
  sections: Array<{
    id: string;
    title: string;
    content: string;          // markdown with LaTeX preserved
    equations: Array<{
      id: string;
      latex: string;
      context: string;        // surrounding text explaining the equation
    }>;
    figures: Array<{
      id: string;
      url?: string;
      caption: string;
      base64?: string;
    }>;
    tables: Array<{
      id: string;
      headers: string[];
      rows: string[][];
      caption: string;
    }>;
    subsections?: Array<...>; // recursive
  }>;
  abstract?: string;
  references?: string[];
}
```

#### Implementation Files

```
src/services/content-visualizer/agents/content-ingestion.ts
src/services/content-visualizer/parsers/arxiv-parser.ts      ← ar5iv HTML + arXiv API
src/services/content-visualizer/parsers/pdf-parser.ts        ← pymupdf4llm wrapper
src/services/content-visualizer/parsers/url-parser.ts        ← readability extraction
src/services/content-visualizer/parsers/text-parser.ts       ← LLM-based section detection
src/services/content-visualizer/types/parsed-content.ts      ← TypeScript interfaces
```

#### Dependencies

- `pymupdf4llm` (Python): PDF extraction — run via child\_process or Python microservice
- `@mozilla/readability` (npm): Clean article extraction from URLs
- `cheerio` (npm): HTML parsing for ar5iv
- `katex` (npm): LaTeX validation and rendering
- arXiv API: `https://export.arxiv.org/api/query?id_list={id}`

---

### 2.2 Agent 2: ConceptAnalyzer

**Role:** Identify visualizable concepts per section and determine best visualization type.
**LLM Model:** Claude Sonnet or GPT-4o

#### System Prompt

```
You are an expert educational content analyst for Pho.Chat.
Given a section of academic/educational content, identify concepts that benefit from
visual explanation. For each, determine the optimal visualization type.

VISUALIZATION TYPES:
- structural_diagram: Labeled parts of a system (anatomy, cell, architecture)
- process_animation: Step-by-step with transitions (algorithm, biological process)
- mathematical_proof: Equation derivation with visual intuition (3Blue1Brown style)
- comparison_chart: Side-by-side or overlay comparison
- interactive_simulation: User-adjustable parameters (physics, statistics)
- timeline: Chronological events or steps
- spatial_map: Geographic or spatial relationships
- data_visualization: Charts, graphs, heatmaps
- flowchart: Decision trees, pipelines, workflows

SELECTION CRITERIA (rate 1-10):
- Visual Benefit: How much does seeing help vs reading?
- Complexity: How hard to understand from text alone?
- Interactivity Value: Would user interaction deepen understanding?
- Feasibility: Can this be accurately rendered in React/SVG or Manim?

Only select concepts scoring >= 7 average.
Output structured JSON matching ConceptMap schema.
```

#### Output Schema

```typescript
interface ConceptMap {
  sectionId: string;
  concepts: Array<{
    id: string;
    title: string;
    description: string;      // what to visualize
    sourceText: string;        // exact text from paper
    vizType: VisualizationType;
    renderTrack: 'artifact' | 'manim' | 'both';
    scores: {
      visualBenefit: number;   // 1-10
      complexity: number;
      interactivityValue: number;
      feasibility: number;
    };
    equations?: string[];      // LaTeX equations involved
    relatedConcepts?: string[];
  }>;
}
```

#### Track Decision Logic

| Track                  | Best For                                                                  | Render Method                               |
| ---------------------- | ------------------------------------------------------------------------- | ------------------------------------------- |
| **artifact** (primary) | Structural diagrams, comparisons, flowcharts, simulations                 | React/SVG in Artifact (instant, <2s)        |
| **manim**              | Math proofs/derivations, complex step-by-step, 3B1B-style                 | Manim Python → Modal.com → video (30–60s)   |
| **both**               | Concepts benefiting from both static exploration AND animated walkthrough | Artifact first (instant), video loads async |

#### Implementation Files

```
src/services/content-visualizer/agents/concept-analyzer.ts
src/services/content-visualizer/types/concept-map.ts
```

---

### 2.3 Agent 3: VisualizationPlanner

**Role:** Create detailed storyboard with scene breakdowns, visual elements, narration, and interaction points.
**LLM Model:** Claude Opus or Sonnet

#### Output Schema

```typescript
interface Storyboard {
  conceptId: string;
  renderTrack: 'artifact' | 'manim' | 'both';
  targetAudience: 'highschool' | 'undergraduate' | 'graduate' | 'professional';
  language: 'vi' | 'en';
  estimatedDuration: number;  // seconds
  scenes: Array<{
    sceneNumber: number;
    title: string;
    purpose: string;          // pedagogical goal
    visualElements: Array<{
      type: 'shape' | 'text' | 'equation' | 'arrow' | 'graph' | 'image' | 'group';
      description: string;
      position: { x: string; y: string };
      animation?: 'fadeIn' | 'drawLine' | 'transform' | 'highlight' | 'morph' | 'write';
      timing?: { start: number; duration: number };
    }>;
    narration: string;        // TEACHES, not DESCRIBES
    interactionPoints?: Array<{
      elementId: string;
      action: 'click' | 'hover' | 'slider' | 'toggle';
      response: string;
    }>;
    transitionToNext?: 'fade' | 'slide' | 'morph' | 'none';
  }>;
}
```

#### Pedagogical Rules (CRITICAL)

**BANNED narration phrases** (meta-commentary, not teaching):

- ✘ "Now we display..." / "Watch as..." / "Let's see..."
- ✘ "As shown above..." / "In this diagram..." / "The figure shows..."

**REQUIRED patterns** (actual teaching):

- ✔ "The key insight is..." / "This works because..." / "Think of it as..."
- ✔ "Imagine you are..." / "The reason this matters is..."
- ✔ Use analogies and real-world examples
- ✔ Explain WHY, not just WHAT

**Language:** Vietnamese narration for Vietnamese content. Default: explain like curious high-school student.

#### Implementation Files

```
src/services/content-visualizer/agents/visualization-planner.ts
src/services/content-visualizer/types/storyboard.ts
```

---

### 2.4 Agent 4: CodeGenerator (Dual-Track)

**Role:** Generate executable code from storyboard. Two parallel tracks.

#### Track A: ReactArtifactGenerator

**LLM Model:** Claude Sonnet
**Output:** Complete React functional component (.jsx) for Pho.Chat Artifact engine

**Available Libraries (already in Artifacts):**

- React 18+ with hooks
- Tailwind CSS utility classes
- D3.js, Recharts, Chart.js
- Three.js r128
- Lucide React, Lodash, MathJS

**System Prompt:**

```
Generate a complete React functional component that visualizes the storyboard.

CODE STANDARDS:
- Single file, default export, no required props
- Tailwind CSS only (no custom CSS imports)
- useState/useEffect hooks for state and animation
- requestAnimationFrame or CSS transitions for smooth animations
- Mobile responsive (touch support)
- Dark theme (#0F172A family)
- Step-by-step controls (Previous / Next / Play / Pause)
- KaTeX for equations (render as SVG text)
- Hover + click states on all interactive elements
- ARIA labels for accessibility

STRUCTURE:
1. State: currentScene, isPlaying, selectedElement
2. Scene renderer: switch on currentScene
3. Animation controller: step-through or auto-play
4. Detail panel: info on click (Phase 1 InteractiveImage pattern)
5. Navigation: scene dots + prev/next buttons

NEVER use localStorage, sessionStorage, or browser storage APIs.
NEVER import external CSS files.
```

#### Track B: ManimGenerator

**LLM Model:** Claude Sonnet + Context7 MCP for live Manim API docs
**Output:** Executable Python file using manim library

**Context7 MCP Integration:**

```javascript
// Agent configuration
mcp_servers: [
  {
    type: 'url',
    url: 'https://context7.com/mcp',
    name: 'context7-manim'
  }
]
// Fallback: cached docs in src/services/content-visualizer/docs/manim-reference.md
```

**Manim Code Standards:**

- Use ManimCE (community edition), not manimgl
- Each visualization = one Scene class
- VoiceoverScene mixin for narration
- `self.play()` for all animations (never `self.add()` for animated elements)
- 30fps, max 90 seconds, MP4 H.264 at 1920×1080

#### Output Schema

```typescript
interface GeneratedCode {
  conceptId: string;
  track: 'artifact' | 'manim';
  code: string;               // full source code
  language: 'jsx' | 'python';
  dependencies: string[];
  estimatedRenderTime: number;
  narrationScript?: string;
}
```

#### Implementation Files

```
src/services/content-visualizer/agents/react-artifact-generator.ts
src/services/content-visualizer/agents/manim-generator.ts
src/services/content-visualizer/docs/manim-reference.md         ← cached API docs
src/services/content-visualizer/templates/artifact-base.jsx      ← base template
src/services/content-visualizer/templates/manim-base.py         ← base template
```

---

### 2.5 Agent 5: QualityValidator

**Role:** 4-stage quality pipeline with retry logic. Critical for reliability — arXivisual achieved 98% success rate (from 60%) using this approach.

#### Stage 1: Syntactic Validation

- **Track A (React):** Parse JSX with `@babel/parser`. Check syntax errors, missing imports, undefined variables.
- **Track B (Manim):** Python AST parse. Valid class structure, correct imports.
- **Tool:** ast module (Python), @babel/parser (Node.js)

#### Stage 2: Spatial Validation

- **Track A:** Static analysis of coordinates. All elements within 0–100% viewport bounds.
- **Track B:** Manim coordinates within camera frame (-7 to 7 horizontal, -4 to 4 vertical).

#### Stage 3: Content Quality Scoring

**Heuristic Rules (automated, fast):**

- No banned narration phrases
- Narration references actual concepts from source
- Visualization includes labels/annotations
- Interactive elements have detail content
- Scene count between 2 and 8

**LLM Judge (slower, accurate):**

- Pedagogical quality (1–10): "Would a high school student understand better?"
- Accuracy (1–10): "Does this accurately represent source material?"
- Engagement (1–10): "Interactive enough to hold attention?"
- Minimum threshold: average >= 7

#### Stage 4: Render Test

- **Track A:** Execute React in headless browser (jsdom/Puppeteer). Verify: renders, no runtime errors, visible output, handlers attached.
- **Track B:** Execute Manim in container. Verify: produces valid video without errors.

#### Retry Loop (max 3 attempts)

```
Attempt 1: Generate code from storyboard
  │ Stage 1 fail → syntax error details → Retry
  │ Stage 2 fail → spatial issue details → Retry
  │ Stage 3 fail → quality feedback → Retry
  │ Stage 4 fail → runtime error stack trace → Retry
Attempt 2: Regenerate with error context appended
  │ Same validation pipeline
Attempt 3: Regenerate with all errors + simplified storyboard
  │ Still fails → Fall back to static image + text explanation
Result: ~98% success rate by attempt 3
```

#### Implementation Files

```
src/services/content-visualizer/agents/quality-validator.ts
src/services/content-visualizer/validators/syntax-validator.ts
src/services/content-visualizer/validators/spatial-validator.ts
src/services/content-visualizer/validators/content-scorer.ts
src/services/content-visualizer/validators/render-tester.ts
```

---

### 2.6 Agent 6: NarrationGenerator (Optional)

**Role:** Generate voiceover audio. Vietnamese + English support.

#### TTS Options

| Provider         | Vietnamese Quality     | Pricing       | Package                        |
| ---------------- | ---------------------- | ------------- | ------------------------------ |
| ElevenLabs       | Good (multilingual v2) | $5/100K chars | `elevenlabs` npm               |
| OpenAI TTS       | Decent (tts-1-hd)      | $15/1M chars  | `openai` npm                   |
| Google Cloud TTS | Excellent Vietnamese   | $4/1M chars   | `@google-cloud/text-to-speech` |
| Edge TTS (free)  | Good Vietnamese        | Free          | `edge-tts` Python              |

**Recommendation:** Start with Edge TTS (free) for MVP. Upgrade to ElevenLabs/Google for production.

#### Audio Sync

- Timing markers per scene narration (start/end timestamps)
- TTS generates audio per scene (not one long file)
- Frontend syncs playback with scene transitions
- Manual navigation → audio jumps to corresponding timestamp

#### Implementation Files

```
src/services/content-visualizer/agents/narration-generator.ts
src/services/content-visualizer/tts/edge-tts.ts              ← free fallback
src/services/content-visualizer/tts/elevenlabs-tts.ts
src/services/content-visualizer/tts/types.ts
```

---

### 2.7 Agent 7: AssemblyOrchestrator

**Role:** Combine all outputs into final scrollytelling Artifact. Deterministic assembler (NOT an LLM agent).

#### Final Artifact Schema

```typescript
interface ContentVisualizerArtifact {
  metadata: ParsedContent['metadata'];
  layout: 'scrollytelling' | 'presentation' | 'explorer';
  sections: Array<{
    sectionId: string;
    title: string;
    contentHtml: string;        // markdown → HTML with KaTeX
    visualizations: Array<{
      conceptId: string;
      artifactCode?: string;    // React JSX (Track A)
      videoUrl?: string;         // Manim MP4 URL (Track B)
      audioUrl?: string;
      narration?: string;
      isInteractive: boolean;
    }>;
  }>;
  quizQuestions?: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    relatedConceptId: string;
  }>;
}
```

#### Scrollytelling UI Components

- Section cards expanding to full-screen on scroll
- Inline React Artifact visualizations (activate when visible)
- Video auto-play when visible (muted default)
- KaTeX equations inline
- Floating navigation sidebar
- Quiz checkpoints between sections
- Audio controls (play/pause, speed)
- Export: standalone HTML or PDF

#### Implementation Files

```
src/services/content-visualizer/agents/assembly-orchestrator.ts
src/components/ContentVisualizer/
  ScrollytellingLayout.tsx
  SectionCard.tsx
  InlineArtifact.tsx
  VideoEmbed.tsx
  EquationBlock.tsx
  QuizCheckpoint.tsx
  NarrationPlayer.tsx
  SectionNavigator.tsx
  ExportButton.tsx
```

---

## 3. Pipeline Orchestrator

```typescript
// src/services/content-visualizer/orchestrator.ts

class ContentVisualizerOrchestrator {
  private agents: {
    ingestion: ContentIngestionAgent;
    analyzer: ConceptAnalyzerAgent;
    planner: VisualizationPlannerAgent;
    reactGen: ReactArtifactGeneratorAgent;
    manimGen: ManimGeneratorAgent;
    validator: QualityValidatorAgent;
    narration: NarrationGeneratorAgent;
    assembler: AssemblyOrchestratorAgent;
  };

  async process(input: UserInput): Promise<ContentVisualizerArtifact> {
    // 1. Ingest content
    this.emit('progress', { stage: 'ingestion', percent: 5 });
    const parsed = await this.agents.ingestion.run(input);

    // 2. Analyze concepts (parallel across sections)
    this.emit('progress', { stage: 'analysis', percent: 15 });
    const concepts = await Promise.all(
      parsed.sections.map(s => this.agents.analyzer.run(s))
    );

    // 3. Plan visualizations
    this.emit('progress', { stage: 'planning', percent: 25 });
    const storyboards = await Promise.all(
      concepts.flat().map(c => this.agents.planner.run(c))
    );

    // 4. Generate code (parallel, dual-track)
    this.emit('progress', { stage: 'generating', percent: 40 });
    const codeResults = await this.generateWithRetry(storyboards);

    // 5. Narration (parallel, optional)
    this.emit('progress', { stage: 'narration', percent: 70 });
    const narrations = await this.agents.narration.run(codeResults);

    // 6. Render Manim videos (if Track B results exist)
    this.emit('progress', { stage: 'rendering', percent: 80 });
    const videos = await this.renderManimVideos(codeResults);

    // 7. Assemble final artifact
    this.emit('progress', { stage: 'assembling', percent: 95 });
    return this.agents.assembler.run(parsed, codeResults, narrations, videos);
  }

  private async generateWithRetry(storyboards, maxRetries = 3) { ... }
}
```

---

## 4. Manim Rendering Infrastructure

### Option A: Serverless via Modal.com (Recommended)

```python
# modal_render.py
import modal

image = modal.Image.debian_slim(python_version='3.11') \
  .apt_install('ffmpeg', 'libcairo2-dev', 'libpango1.0-dev',
               'texlive-full', 'texlive-latex-extra') \
  .pip_install('manim', 'manim-voiceover')

app = modal.App('pho-chat-manim')

@app.function(image=image, timeout=120)
def render_scene(python_code: str) -> bytes:
    import tempfile, subprocess, os
    with tempfile.TemporaryDirectory() as tmpdir:
        script_path = os.path.join(tmpdir, 'scene.py')
        with open(script_path, 'w') as f:
            f.write(python_code)
        subprocess.run([
            'manim', 'render', '-qm', '--fps', '30',
            '-o', 'output.mp4', script_path
        ], cwd=tmpdir, check=True)
        with open(os.path.join(tmpdir, 'media/videos/scene/720p30/output.mp4'), 'rb') as f:
            return f.read()
```

### Option B: Self-Hosted Docker

- Docker with Manim + FFmpeg + LaTeX
- FastAPI wrapper: POST Python code → return MP4
- Queue: Redis/BullMQ for concurrent renders

### Video Storage

- Cloudflare R2 (S3-compatible, free egress) — recommended
- Cache by content hash (same paper = no re-render)
- CDN delivery for fast playback

---

## 5. Dependencies

### NPM Packages

| Package                | Purpose                                |
| ---------------------- | -------------------------------------- |
| `@mozilla/readability` | Article extraction from URLs           |
| `cheerio`              | HTML parsing (ar5iv, web pages)        |
| `katex`                | LaTeX equation rendering               |
| `@babel/parser`        | JSX syntax validation                  |
| `marked`               | Markdown → HTML                        |
| `framer-motion`        | Scroll-triggered animations            |
| `elevenlabs`           | TTS API (optional)                     |
| `modal`                | Serverless rendering client (optional) |
| `@aws-sdk/client-s3`   | Cloudflare R2 upload                   |

### Python Packages

| Package           | Purpose                          |
| ----------------- | -------------------------------- |
| `manim` (^0.18)   | 3Blue1Brown animations           |
| `manim-voiceover` | Voiceover integration            |
| `pymupdf4llm`     | PDF → structured markdown        |
| `fastapi`         | Render service API (Option B)    |
| `modal`           | Serverless containers (Option A) |
| `edge-tts`        | Free TTS with Vietnamese         |

### Environment Variables

```bash
CONTENT_VIZ_ENABLED=true

# Manim Rendering (choose one)
MODAL_TOKEN_ID=...
MODAL_TOKEN_SECRET=...
MANIM_RENDER_URL=...          # self-hosted alternative

# TTS (choose one, or leave empty for Edge TTS)
ELEVENLABS_API_KEY=...

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=pho-chat-visualizations

# Context7 MCP (optional, fallback to cached docs)
CONTEXT7_API_KEY=...
```

---

## 6. Implementation Priority (12 Steps)

| Step | Task                                     | Files                                         | MVP? |
| ---- | ---------------------------------------- | --------------------------------------------- | ---- |
| 1    | Type definitions                         | `types/*.ts`                                  | ✅    |
| 2    | ContentIngestion + parsers               | `agents/content-ingestion.ts`, `parsers/*`    | ✅    |
| 3    | ConceptAnalyzer + system prompt          | `agents/concept-analyzer.ts`                  | ✅    |
| 4    | VisualizationPlanner + pedagogical rules | `agents/visualization-planner.ts`             | ✅    |
| 5    | ReactArtifactGenerator (Track A)         | `agents/react-artifact-generator.ts`          | ✅    |
| 6    | QualityValidator (4-stage + retry)       | `agents/quality-validator.ts`, `validators/*` | ✅    |
| 7    | AssemblyOrchestrator                     | `agents/assembly-orchestrator.ts`             | ✅    |
| 8    | ScrollytellingLayout + UI components     | `components/ContentVisualizer/*`              | ✅    |
| 9    | Pipeline Orchestrator + progress         | `orchestrator.ts`                             | ✅    |
| 10   | NarrationGenerator + Edge TTS            | `agents/narration-generator.ts`, `tts/*`      | ⬜    |
| 11   | ManimGenerator + Modal.com               | `agents/manim-generator.ts`, `rendering/*`    | ⬜    |
| 12   | Caching layer                            | `orchestrator.ts` (extend)                    | ⬜    |

**Steps 1–9 = Working MVP** (3–4 weeks): React Artifacts only, no video/voice
**Steps 10–12 = Full version** (+2 weeks): adds narration + Manim video + caching

---

## 7. Complete File Structure

```
src/services/content-visualizer/
├── orchestrator.ts                 # Main pipeline controller
├── types/
│   ├── parsed-content.ts           # Step 1
│   ├── concept-map.ts              # Step 1
│   ├── storyboard.ts               # Step 1
│   └── generated-code.ts           # Step 1
├── agents/
│   ├── content-ingestion.ts        # Step 2
│   ├── concept-analyzer.ts         # Step 3
│   ├── visualization-planner.ts    # Step 4
│   ├── react-artifact-generator.ts # Step 5
│   ├── manim-generator.ts          # Step 11
│   ├── quality-validator.ts        # Step 6
│   ├── narration-generator.ts      # Step 10
│   └── assembly-orchestrator.ts    # Step 7
├── parsers/
│   ├── arxiv-parser.ts             # Step 2
│   ├── pdf-parser.ts               # Step 2
│   ├── url-parser.ts               # Step 2
│   └── text-parser.ts              # Step 2
├── validators/
│   ├── syntax-validator.ts         # Step 6
│   ├── spatial-validator.ts        # Step 6
│   ├── content-scorer.ts           # Step 6
│   └── render-tester.ts            # Step 6
├── tts/
│   ├── edge-tts.ts                 # Step 10
│   ├── elevenlabs-tts.ts           # Step 10
│   └── types.ts                    # Step 10
├── rendering/
│   ├── modal-renderer.ts           # Step 11
│   └── storage.ts                  # Step 11
├── templates/
│   ├── artifact-base.jsx           # Step 5
│   └── manim-base.py               # Step 11
└── docs/
    └── manim-reference.md          # Step 11

src/components/ContentVisualizer/
├── ScrollytellingLayout.tsx        # Step 8
├── SectionCard.tsx                 # Step 8
├── InlineArtifact.tsx              # Step 8
├── VideoEmbed.tsx                  # Step 8
├── EquationBlock.tsx               # Step 8
├── QuizCheckpoint.tsx              # Step 8
├── NarrationPlayer.tsx             # Step 10
├── SectionNavigator.tsx            # Step 8
└── ExportButton.tsx                # Step 8
```
