# Phở Chat — Product Backlog
> Last updated: 2026-02-24
> Status: 🔒 Hardening Sprint active (Feb 24 — Mar 10, 2026)

---

## 🔴 Hardening Sprint (NOW — 2 tuần)

### Critical Path Tests
- [x] Test onboarding flow end-to-end
- [x] Test PubMed plugin search accuracy ✅ (5 studies, DOI, PMID, real-time)
- [x] Test drug interaction checker plugin ✅ (HIGH RISK warfarin+aspirin)
- [x] Test clinical calculator plugin ✅ (10 formulas)
- [x] Test pho-gateway failover ✅ (3-tier chains audited)
- [ ] Test Phở Points deduction + balance accuracy
- [ ] Test /usage page with real user data
- [x] Test /models page rendering ✅ (fixed middleware, SEO-only)
- [ ] Test /invite referral link generation + copy

### Security Hardening
- [x] Secure API keys (random tokens + SHA-256 hashed DB storage)
- [x] Rate limiting on /api/v1/chat (60 req/min)
- [x] Rate limiting on plugin APIs (30 req/min per IP) ✅
- [x] Health check endpoint /api/health ✅ (all subsystems green, 182ms)
- [x] Verify admin role check on all admin API routes ✅ (6 routes fixed)
- [ ] Review Clerk webhook security

### Deploy & Monitor
- [ ] Run `npx tsx scripts/ensure-admin-tables.ts` on production
- [ ] Monitor error logs for 48h after deploy

---

## 🟠 Medical Research Sprint (After Hardening — 4 weeks)

### Sprint 1: Search + Cite (3-5 days)
- [ ] PubMed v2: clickable links, MeSH terms, pagination
- [ ] Citation Manager plugin (PMID/DOI → APA/BibTeX/Vancouver)
- [ ] Search results as markdown table
- [ ] "Export all citations" as .bib file

### Sprint 2: Read + New Databases (1 week)
- [ ] ClinicalTrials.gov plugin (free API, no auth)
- [ ] OpenAlex plugin (citation count, OA PDF links)
- [ ] FDA openFDA upgrade (real-time, replace hardcoded 42-drug DB)
- [ ] Medical PDF processing (Gemini multimodal, IMRAD chunking)
- [ ] Background PDF job + progress indicator

### Sprint 3: Extract + Compare + Write (3-5 days)
- [ ] "Phở Medical Research" assistant preset (GRADE, PICO, IMRAD)
- [ ] Evidence Summary template (auto-formatted after search)
- [ ] Auto-detect medical context → suggest plugins
- [ ] Vietnamese summary option for medical responses
- [ ] Legal disclaimer system (footer on every medical response)

### Sprint 4: Polish + Workspace (2 weeks)
- [ ] Clinical calculators (eGFR, CHA₂DS₂-VASc, MELD-Na, BMI, NNT)
- [ ] Research Session Memory (tag, save, bibliography)
- [ ] Search history for researchers
- [ ] Plugin response card rendering (paper cards, severity badges, trial cards)
- [ ] Mobile quick-action buttons (PubMed, Drug Check, Calculator)

### Cross-Cutting (Throughout)
- [ ] Redis caching for PubMed/OpenAlex (1h TTL)
- [ ] Error handling: fallback OpenAlex when PubMed down
- [ ] Drug not found → "Did you mean...?" suggestions
- [ ] VN-EN medical terminology mapping

---

## 🟡 Phase 16: Admin Roadmap Tracker

- [ ] DB schema: `roadmapItems` table
- [ ] API: GET/POST/PATCH /api/admin/roadmap
- [ ] Admin page: kanban view
- [ ] "Notify Customers" button

---

## 🟡 Phase 17: Admin Second Brain

- [ ] DB schema: `adminNotes` table
- [ ] AI analysis agent for feasibility
- [ ] "Add to Roadmap" flow

---

## 🟢 Future Ideas

### User-Facing
- [ ] Weekly email digest
- [ ] API key generation UI (/settings/api)
- [ ] Public changelog page
- [ ] User feedback widget

### Admin Tools
- [ ] Health check dashboard
- [ ] Cost alert system
- [ ] Feature flags for beta access

### Growth
- [ ] Referral bonus automation
- [ ] SEO: programmatic pages for medical AI topics
- [ ] Community forum for medical users
