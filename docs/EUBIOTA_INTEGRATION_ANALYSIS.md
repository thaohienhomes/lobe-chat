# Eubiota Integration Analysis for pho.chat

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Eubiota Deep Dive](#eubiota-deep-dive)
3. [Feature Mapping: Eubiota → pho.chat](#feature-mapping)
4. [Feasibility Assessment](#feasibility-assessment)
5. [Integration Approaches](#integration-approaches)
6. [Implementation Plan](#implementation-plan)
7. [Risk Analysis](#risk-analysis)

---

## 1. Executive Summary

**Eubiota** is a Stanford-developed modular agentic AI platform for autonomous scientific discovery in the human gut microbiome. It combines multi-agent reasoning (Plan → Execute → Verify → Generate) with 14+ domain-specific scientific tools (PubMed, KEGG, MDIPID databases) and achieves 87.7% benchmark accuracy, outperforming GPT-5.1 by 10.4%.

**Recommendation:** Integrate Eubiota-inspired capabilities into pho.chat through a phased approach, leveraging the existing plugin/tool system, RAG infrastructure, and multi-provider model runtime. This positions pho.chat as a **scientific research copilot** — a significant differentiation in the AI chat market.

---

## 2. Eubiota Deep Dive

### 2.1 What is Eubiota?

- **Repository:** https://github.com/lupantech/Eubiota
- **Paper:** [bioRxiv preprint (Feb 28, 2026)](https://www.biorxiv.org/content/10.64898/2026.02.27.708412v1)
- **Website:** https://eubiota.ai/
- **Authors:** Pan Lu, Yifan Gao, et al. (Stanford University)
- **License:** Apache 2.0

### 2.2 Core Architecture

Eubiota uses a **4-agent orchestration** pattern with shared memory:

```
User Query
    ↓
┌─────────────────────────────────────────────────────┐
│  PLANNER                                            │
│  - Global strategy generation                       │
│  - Step-by-step action planning                     │
│  - Tool selection (fuzzy matching)                  │
└─────────┬───────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  EXECUTOR                                           │
│  - Translate plans to tool commands                 │
│  - Execute scientific database queries              │
│  - Capture results                                  │
└─────────┬───────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│  VERIFIER                                           │
│  - Reflect on execution outcomes                    │
│  - Decide: CONTINUE or STOP                         │
│  - Evidence validation                              │
└─────────┬───────────────────────────────────────────┘
          ↓ (loop back to Planner if CONTINUE)
┌─────────────────────────────────────────────────────┐
│  GENERATOR                                          │
│  - Synthesize final output                          │
│  - Multiple format support                          │
│  - Evidence-grounded answers                        │
└─────────────────────────────────────────────────────┘
          ↑
┌─────────────────────────────────────────────────────┐
│  SHARED MEMORY                                      │
│  - Global plan + timing                             │
│  - Step history (planner/executor/verifier data)    │
│  - Selective retrieval by module type               │
│  - Concise history for context management           │
└─────────────────────────────────────────────────────┘
```

### 2.3 Tool Ecosystem (14+ Tools)

| Tool                    | Source          | Purpose                              |
| ----------------------- | --------------- | ------------------------------------ |
| `pubmed_search`         | PubMed/NCBI     | Scientific literature mining         |
| `kegg_disease_search`   | KEGG Disease    | Disease pathway queries              |
| `kegg_drug_search`      | KEGG Drug       | Drug information & interactions      |
| `kegg_gene_search`      | KEGG Gene       | Gene function & pathway data         |
| `kegg_organism_search`  | KEGG Organism   | Organism-level biological data       |
| `mdipid_disease_search` | MDIPID Disease  | Microbiome-disease associations      |
| `mdipid_gene_search`    | MDIPID Gene     | Microbiome-gene associations         |
| `mdipid_microbe_search` | MDIPID Microbiota | Microbiome composition data        |
| `google_search`         | Google API      | General web knowledge                |
| `perplexity_search`     | Perplexity API  | AI-powered search                    |
| `wikipedia_search`      | Wikipedia       | Encyclopedic knowledge               |
| `url_context_search`    | Web URLs        | Context extraction                   |
| `python_coder`          | Local runtime   | Computational analysis               |
| `base_generator`        | LLM             | Text generation & synthesis          |

### 2.4 Tech Stack

- **Language:** Python 3.11+
- **Inference:** vLLM for fast model serving
- **RL Training:** VeRL + GRPO-MAS framework
- **LLM Support:** OpenAI, Anthropic, Google, Azure, DeepSeek, Ollama, etc.
- **Scientific DBs:** KEGG, PubMed, MDIPID (local SQLite copies)
- **Fine-tuned Model:** Eubiota-8b Planner (8B params, HuggingFace)

### 2.5 Validated Scientific Discoveries

1. **Gene Discovery:** Identified uvr-ruv DNA repair axis as inflammatory stress fitness determinant
2. **Therapeutic Design:** 4-strain consortium attenuating colitis severity in mice
3. **Antibiotic Design:** Commensal-sparing antibiotic cocktail
4. **Molecule Discovery:** Diet-associated metabolites suppressing NF-κB signaling

---

## 3. Feature Mapping: Eubiota → pho.chat

### 3.1 Direct Mapping to Existing pho.chat Features

| Eubiota Feature          | pho.chat Equivalent              | Gap    |
| ------------------------ | -------------------------------- | ------ |
| Multi-LLM support       | `packages/model-runtime/` (10+ providers) | ✅ None |
| Web search tools         | `src/tools/web-browsing/`        | ✅ None |
| Streaming responses      | Built-in streaming chat          | ✅ None |
| RAG / knowledge retrieval | `packages/database/src/models/chunk.ts` (semantic search) | ✅ None |
| File processing          | `packages/file-loaders/`         | ✅ None |
| Plugin system            | `src/tools/`, plugin store       | ✅ None |
| MCP tool protocol        | `src/server/services/mcp/`       | ✅ None |

### 3.2 Features Requiring New Development

| Eubiota Feature                | Effort  | Priority |
| ------------------------------ | ------- | -------- |
| Multi-agent orchestration      | High    | P0       |
| Scientific DB tools (PubMed, KEGG, MDIPID) | Medium | P0 |
| Shared memory / evidence store | Medium  | P0       |
| Plan-Execute-Verify loop       | High    | P1       |
| Python code execution sandbox  | Medium  | P1       |
| RL-trained planner model       | Very High | P2     |
| Benchmark evaluation suite     | Medium  | P2       |

---

## 4. Feasibility Assessment

### 4.1 High Feasibility (Can build within existing architecture)

**A. Scientific Database Tools as pho.chat Plugins**
- pho.chat already has a robust plugin system (`src/tools/`)
- Each Eubiota tool (PubMed, KEGG, etc.) can be implemented as a built-in tool
- Tool manifests, system roles, and API routes follow established patterns
- **Estimated effort:** 2-3 weeks for core tools

**B. Knowledge Base Enhancement for Scientific Papers**
- RAG system already supports semantic search with cosine distance
- `packages/file-loaders/` handles PDF, DOCX
- Can enhance with PubMed paper auto-ingestion
- **Estimated effort:** 1-2 weeks

**C. Multi-Provider Agent Routing**
- `packages/model-runtime/` already supports 10+ providers
- Can route different agent roles to different models
- **Estimated effort:** 1 week

### 4.2 Medium Feasibility (Requires new subsystem)

**D. Multi-Agent Orchestration Engine**
- pho.chat currently uses single-turn tool calling
- Need to implement iterative Plan→Execute→Verify loop
- Can leverage existing `context-engine` pipeline
- **Estimated effort:** 4-6 weeks

**E. Shared Memory / Evidence Store**
- Need new database schema for research sessions
- Can extend existing `messages` + `chunks` tables
- **Estimated effort:** 2-3 weeks

**F. Code Execution Sandbox**
- For Python data analysis and computation
- Can use WebAssembly (Pyodide) or containerized execution
- **Estimated effort:** 3-4 weeks

### 4.3 Low Feasibility (Long-term / Out of scope)

**G. GRPO-MAS RL Training Pipeline**
- Requires significant ML infrastructure (GPU clusters, Ray)
- Better to use Eubiota's pre-trained model via API
- **Recommendation:** Use Eubiota-8b model via Ollama/vLLM instead

---

## 5. Integration Approaches

### Approach A: "Eubiota as External Service" (Lightweight)

```
pho.chat ←→ Eubiota Python Backend (Flask/FastAPI)
   ↓                    ↓
  UI/UX          Scientific Tools + Agent Loop
```

**Pros:**
- Fastest to implement (1-2 weeks)
- Uses Eubiota's codebase directly
- Clear separation of concerns

**Cons:**
- Additional deployment complexity (Python service)
- Network latency between services
- Less integrated user experience

**Implementation:**
1. Deploy Eubiota as a standalone API service
2. Create pho.chat plugin that calls Eubiota API
3. Display results in chat with custom rendering

### Approach B: "Native Tool Integration" (Recommended)

```
pho.chat
  ├── src/tools/science/           # New built-in tool
  │   ├── pubmed-search/           # PubMed tool
  │   ├── kegg-search/             # KEGG tool
  │   └── research-agent/          # Multi-step agent
  ├── packages/science-tools/      # Scientific tool runtime
  └── src/server/services/science/ # Backend services
```

**Pros:**
- Fully integrated experience
- Leverages existing pho.chat infrastructure
- Better UX with native rendering
- No additional services to deploy

**Cons:**
- More development effort
- Need to port Python tools to TypeScript/Node.js
- Some tools may need API bridges

**Implementation:**
1. Port scientific DB tools to TypeScript
2. Build multi-agent orchestration in context-engine
3. Create custom UI components for scientific results

### Approach C: "Hybrid MCP Bridge" (Balanced) ⭐ RECOMMENDED

```
pho.chat
  ├── src/tools/science-agent/     # Agent orchestrator (TS)
  ├── mcp-servers/
  │   └── eubiota-mcp/             # MCP server wrapping Eubiota tools (Python)
  └── src/features/ScienceView/    # Custom result rendering (React)
```

**Pros:**
- Uses MCP protocol (already supported in pho.chat)
- Keeps scientific tools in Python (best ecosystem for bio)
- Agent orchestration in TypeScript (integrated with chat)
- Moderate effort with good UX

**Cons:**
- MCP server deployment needed
- Two-language architecture

**Implementation:**
1. Create MCP server wrapping Eubiota's Python tools
2. Build agent orchestrator as pho.chat built-in tool
3. Custom rendering for scientific results

---

## 6. Implementation Plan

### Phase 1: Foundation (Weeks 1-3)

#### 1.1 Scientific Database MCP Server
Create a Python MCP server that wraps Eubiota's scientific tools:

```
mcp-servers/eubiota-tools/
├── server.py              # MCP server entry
├── tools/
│   ├── pubmed.py          # PubMed search wrapper
│   ├── kegg.py            # KEGG database wrapper
│   ├── mdipid.py          # MDIPID database wrapper
│   └── base_tool.py       # Base tool interface
├── databases/             # Local DB copies
├── requirements.txt
└── README.md
```

**Key tasks:**
- [ ] Extract and adapt Eubiota's tool implementations
- [ ] Implement MCP protocol handlers for each tool
- [ ] Set up local database copies (KEGG, MDIPID)
- [ ] Add configuration for API keys (PubMed E-utilities)

#### 1.2 pho.chat Science Agent Tool
New built-in tool in pho.chat:

```
src/tools/science-agent/
├── index.ts               # Tool manifest & registration
├── systemRole.ts          # Agent system prompt
├── Render/
│   ├── index.tsx          # Result renderer
│   ├── PubMedResult.tsx   # PubMed citation card
│   ├── GeneCard.tsx       # Gene information card
│   ├── PathwayView.tsx    # Pathway visualization
│   └── EvidenceChain.tsx  # Evidence chain display
└── type.ts                # Type definitions
```

**Key tasks:**
- [ ] Define tool manifest with science-specific capabilities
- [ ] Create system role prompts for scientific reasoning
- [ ] Build result rendering components
- [ ] Register in `src/tools/index.ts`

#### 1.3 Database Schema Extension
New tables for research sessions:

```sql
-- Research sessions
CREATE TABLE research_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  topic_id UUID REFERENCES topics(id),
  query TEXT NOT NULL,
  global_plan JSONB,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Research evidence
CREATE TABLE research_evidence (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES research_sessions(id),
  step_number INTEGER,
  tool_used VARCHAR(100),
  query TEXT,
  result JSONB,
  verification_status VARCHAR(20),
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scientific references
CREATE TABLE scientific_references (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES research_sessions(id),
  pmid VARCHAR(20),
  title TEXT,
  authors TEXT[],
  journal TEXT,
  year INTEGER,
  abstract TEXT,
  doi VARCHAR(100),
  relevance_score FLOAT
);
```

### Phase 2: Multi-Agent Orchestration (Weeks 4-7)

#### 2.1 Agent Orchestrator
Implement Plan-Execute-Verify loop in the context-engine:

```
packages/context-engine/src/providers/
├── ScienceAgentOrchestrator.ts   # Main orchestration logic
├── SciencePlanner.ts             # Planning prompts & logic
├── ScienceVerifier.ts            # Verification prompts & logic
└── ScienceMemory.ts              # Shared memory management
```

**Orchestration flow in pho.chat:**
```typescript
// Simplified flow
async function runScienceAgent(query: string, tools: Tool[]) {
  const memory = new ScienceMemory();

  // Step 1: Global planning
  const globalPlan = await planner.createGlobalPlan(query, tools);
  memory.setGlobalPlan(globalPlan);

  // Step 2: Iterative execution
  while (!memory.isComplete && memory.stepCount < MAX_STEPS) {
    const stepPlan = await planner.planNextStep(memory);
    const result = await executor.execute(stepPlan, tools);
    memory.addStep(stepPlan, result);

    const verification = await verifier.verify(memory);
    if (verification.decision === 'STOP') break;
  }

  // Step 3: Generate final output
  return generator.synthesize(memory);
}
```

#### 2.2 Streaming Research UI
New chat message type for multi-step research:

```
src/features/Conversation/Messages/
├── ResearchMessage/
│   ├── index.tsx              # Research message container
│   ├── PlanningStep.tsx       # Shows planning phase
│   ├── ExecutionStep.tsx      # Shows tool execution
│   ├── VerificationStep.tsx   # Shows verification
│   ├── EvidencePanel.tsx      # Accumulated evidence
│   └── FinalSynthesis.tsx     # Final research output
```

### Phase 3: Knowledge Integration (Weeks 8-10)

#### 3.1 Scientific Paper Ingestion
Auto-import from PubMed into knowledge base:

- [ ] PubMed paper fetcher (via E-utilities API)
- [ ] PDF download and chunking pipeline
- [ ] Citation graph tracking
- [ ] Automatic embedding generation

#### 3.2 Scientific Knowledge Base Templates
Pre-configured knowledge bases for common domains:

- Gut microbiome research
- Drug-microbiome interactions
- Inflammatory disease pathways
- Gene function databases

### Phase 4: Advanced Features (Weeks 11-16)

#### 4.1 Eubiota-8b Model Integration
- Deploy Eubiota-8b planner model via Ollama
- Use as specialized planner in the agent loop
- Fallback to general models when unavailable

#### 4.2 Python Sandbox
- Pyodide (WebAssembly) for browser-side computation
- Or containerized Python execution for server mode
- Data visualization (matplotlib → image → chat)

#### 4.3 Visualization Components
- Gene pathway diagrams (D3.js / React Flow)
- Citation network graphs
- Evidence confidence heatmaps
- Molecular structure viewers (3Dmol.js)

---

## 7. Risk Analysis

### Technical Risks

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Scientific DB availability | High | Cache locally, implement fallbacks |
| Multi-agent loop latency | Medium | Stream intermediate results, set timeouts |
| Python↔TypeScript bridge complexity | Medium | Use MCP protocol as stable interface |
| Tool accuracy for real research | High | Clear disclaimers, verification step, human review |
| Database storage for evidence | Low | Extend existing PostgreSQL/PGLite schema |

### Business Risks

| Risk | Impact | Mitigation |
| ---- | ------ | ---------- |
| Niche market (biology researchers) | Medium | Start with biology, expand to other sciences |
| API costs (PubMed, LLM calls) | Medium | Caching, rate limiting, user quotas |
| Regulatory (medical advice) | High | Clear disclaimers, "research tool only" |
| Competition (Biomni, other tools) | Medium | Deep integration advantage in chat UX |

### Ethical Considerations

- **Medical Disclaimer:** Must clearly state this is a research tool, not medical advice
- **Data Privacy:** Scientific queries may contain sensitive research data
- **Reproducibility:** Track all tool calls and LLM responses for audit trail
- **Bias:** LLM-generated scientific hypotheses need human verification

---

## Summary Decision Matrix

| Approach | Effort | UX Quality | Maintenance | Recommended |
| -------- | ------ | ---------- | ----------- | ----------- |
| A: External Service | Low | Medium | High | No |
| B: Full Native | Very High | Excellent | Medium | For long-term |
| **C: Hybrid MCP** | **Medium** | **Good** | **Low** | **Yes (start here)** |

**Final Recommendation:** Start with **Approach C (Hybrid MCP Bridge)**, implement Phase 1 and 2 first. This gives pho.chat unique scientific research capabilities with manageable effort. Expand to full native integration (Approach B) as the feature proves its value.

---

## Sources

- [Eubiota GitHub Repository](https://github.com/lupantech/Eubiota)
- [Eubiota bioRxiv Preprint](https://www.biorxiv.org/content/10.64898/2026.02.27.708412v1)
- [Eubiota Official Website](https://eubiota.ai/)
- [VeRL - Reinforcement Learning for LLMs](https://github.com/verl-project/verl)
- [Biomni - Related Biomedical AI Agent](https://pmc.ncbi.nlm.nih.gov/articles/PMC12157518/)
