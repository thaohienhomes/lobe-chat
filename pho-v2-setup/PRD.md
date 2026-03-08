# PRD — Phở Chat v2

## Product Vision
Phở Chat is a premium Vietnamese AI chat platform that combines the modern LobeHub v2 open-source foundation with exclusive features (Research Engine, Deep Research, Scientific Skills, Medical Beta) and a distinctive "Quiet Luxury" brand identity.

## Target Users
1. **Vietnamese professionals** seeking a premium AI assistant
2. **Medical/biomedical researchers** needing specialized AI research tools
3. **Students & academics** using AI for scientific research
4. **General users** wanting a beautiful, fast AI chat experience

## Core Value Propositions
1. **Research Engine** — 5-phase academic research with PubMed/ArXiv/OpenAlex integration
2. **Deep Research** — Autonomous multi-agent 10-30 page report generation
3. **170+ Scientific Skills** — 8 specialized AI agents for biomedical, chemistry, data science
4. **Medical Beta** — HIPAA-aware clinical AI with drug database
5. **Multi-platform** — Web, PWA, Desktop, Mobile (iOS + Android)
6. **Premium UX** — Jade Green branding, dark-first, Claude-level clean interface

## Functional Requirements

### Must-Have (P0)
- [ ] Chat interface with streaming AI responses
- [ ] Multi-model support (10+ providers)
- [ ] Conversation management (create, delete, export)
- [ ] User authentication (Clerk)
- [ ] Phở brand applied (Jade Green, calligraphic P logo)
- [ ] Dark mode as default

### Should-Have (P1)
- [ ] Research Engine (5-phase)
- [ ] Deep Research (multi-agent reports)
- [ ] Scientific Skills (170+)
- [ ] Payment integration (Stripe + Sepay)
- [ ] Rate limiting per subscription tier

### Nice-to-Have (P2)
- [ ] Medical Beta
- [ ] Desktop app (Windows)
- [ ] Mobile app (iOS + Android)
- [ ] RevenueCat in-app purchases
- [ ] Agentic AI with MCP integration

## Non-Functional Requirements
- **Performance**: First contentful paint < 2s, Lighthouse > 90
- **Security**: No API key exposure, rate limiting, HIPAA awareness for Medical
- **Availability**: 99.9% uptime via Vercel
- **Scalability**: Serverless architecture, Neon auto-scaling DB

## Success Metrics
| Metric | Target |
|--------|--------|
| Monthly Active Users | 500+ within 3 months |
| Paid Subscribers | 50+ within 3 months |
| Average Session Duration | > 5 minutes |
| Lighthouse Score | > 90 |
| Error Rate | < 0.1% |

## Timeline
| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 0 | Week 0 | Fork setup, CLAUDE.md, infrastructure |
| Phase 1 | Week 1-2 | Branding, clean UI, AI providers |
| Phase 2 | Week 3-6 | Research, Deep Research, payments |
| Phase 3 | Week 7-8 | Mobile, Desktop, PWA |
| Phase 4 | Week 9-10 | QA, migration, launch |
