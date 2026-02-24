# Phở Chat — Product Backlog
> Last updated: 2026-02-24
> Status: 🔒 Frozen during Hardening Sprint (Feb 24 — Mar 10, 2026)

---

## 🔴 Hardening Sprint (NOW — 2 tuần)

Focus: Test stability cho medical/research users trên production.

### Critical Path Tests
- [x] Test onboarding flow end-to-end (profession → recommendations → tips)
- [ ] Test PubMed plugin search accuracy
- [ ] Test drug interaction checker plugin
- [ ] Test clinical calculator plugin
- [ ] Test pho-gateway failover (kill 1 provider, verify auto-switch)
- [ ] Test Phở Points deduction + balance accuracy
- [ ] Test /usage page with real user data
- [ ] Test /models page rendering
- [ ] Test /invite referral link generation + copy

### Security Hardening
- [x] Fix API key: replace deterministic base64 with random tokens + hashed DB storage
- [ ] Verify admin role check works on all admin API routes
- [x] Rate limiting on /api/v1/chat (prevent abuse)
- [ ] Review Clerk webhook security

### Medical User Experience
- [ ] Test MedicalOnboarding flow for medical_beta users
- [ ] Test specialty plugins (PubMed, Semantic Scholar, DOI resolver)
- [ ] Test long-context research queries with Gemini 2.5 Pro
- [ ] Gather feedback from 3-5 real medical users
- [ ] Fix any reported bugs

### Deploy & Monitor
- [ ] Run `npx tsx scripts/ensure-admin-tables.ts` on production
- [ ] Set UPSTASH_REDIS_REST_URL + token on Vercel
- [ ] Monitor error logs for 48h after deploy
- [x] Add health check endpoint /api/health

---

## 🟡 After Hardening — Phase 16: Admin Roadmap Tracker

**Mục đích:** Admin page quản lý roadmap, track features done/pending, trigger email updates.

- [ ] DB schema: `roadmapItems` table (title, status, phase, priority, category, emailSentAt)
- [ ] API: GET/POST/PATCH /api/admin/roadmap
- [ ] Admin page: kanban view (Planned → In Progress → Done → Cancelled)
- [ ] "Notify Customers" button: 1-click gửi email về features mới
- [ ] Seed data: import tất cả Phase 1-15 items vào roadmap table

**Effort:** ~4-5 hours

---

## 🟡 After Hardening — Phase 17: Admin Second Brain (AI Notes)

**Mục đích:** Ghi chú + AI phân tích khả thi tích hợp feature mới.

- [ ] DB schema: `adminNotes` table (title, content, sourceUrl, tags, aiAnalysis, feasibilityScore, status)
- [ ] API: CRUD /api/admin/notes + /api/admin/notes/analyze
- [ ] AI analysis agent: Gemini 2.5 Pro phân tích khả thi tích hợp vào Phở Chat
- [ ] Admin page: quick capture bar + notes list + AI analysis panel
- [ ] "Add to Roadmap" flow: promote note → create roadmap item

**Effort:** ~8-10 hours

---

## 🟢 Future Ideas (No Timeline)

### User-Facing
- [ ] Weekly email digest (Resend template + Vercel Cron)
- [ ] API key generation UI (/settings/api)
- [ ] Public changelog page (/changelog — auto from roadmap)
- [ ] User feedback widget (in-app → admin dashboard)
- [ ] Dynamic model catalog (DB-backed, admin toggleable)

### Admin Tools
- [ ] Health check dashboard (/admin/health — response times, provider uptime, error rate)
- [ ] Cost alert system (auto notify khi provider cost vượt threshold)
- [ ] Feature flags for users (beta access management)
- [ ] Scheduled maintenance mode

### Medical-Specific
- [ ] Medical literature summarizer (PubMed → AI summary)
- [ ] Drug interaction knowledge graph visualization
- [ ] Clinical trial search integration
- [ ] DICOM image viewer plugin
- [ ] Medical terminology glossary (EN ↔ VI)

### Growth
- [ ] Referral bonus automation (auto award Phở Points)
- [ ] Affiliate conversion tracking dashboard (real data)
- [ ] SEO: programmatic pages for medical AI topics
- [ ] Community forum / Q&A for medical users
