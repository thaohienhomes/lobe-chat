# 🦞 OpenClaw × Phở Chat — Complete Integration Guide

> **Branch:** `claude/openclaw-integration-proposal-eGps2`  
> **Status:** Deployed Preview (chưa production)  
> **Files:** +4,663 lines across 35 files

---

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────┐
│                    PHỞ CHAT PLATFORM                         │
│                    (Vercel + Neon DB)                         │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │ /openclaw     │   │ /api/openclaw │   │ /api/openclaw    │ │
│  │ Landing Page  │──▶│ /deploy      │──▶│ /webhook/[botId] │ │
│  │ (8 sections)  │   │ (One-Click)  │   │ (AI Responder)   │ │
│  └──────────────┘   └──────┬───────┘   └───────┬──────────┘ │
│                            │                    │            │
│                     ┌──────▼──────┐     ┌───────▼──────┐    │
│                     │ Neon DB      │     │ Vercel AI    │    │
│                     │ openclaw_bots│     │ Gateway      │    │
│                     └─────────────┘     │ (Gemini/GPT) │    │
│                                         └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
              │                             ▲
              ▼                             │
    ┌──────────────────┐          ┌─────────┴──────────┐
    │ Telegram Bot API  │          │  End User's Bot    │
    │ setWebhook()      │          │  (Telegram chat)   │
    └──────────────────┘          └────────────────────┘
```

**Điểm mấu chốt:** OpenClaw **KHÔNG cần VPS riêng**. Phở Chat host mọi thứ trên Vercel serverless — user chỉ cần paste bot token là xong.

---

## 👤 GÓC NHÌN 1: End-User của Phở Chat (Khách hàng)

### End-user được gì?

**Tạo AI Telegram Bot cá nhân trong 30 giây:**
1. Vào `pho.chat/openclaw` → paste Telegram Bot Token
2. Click "Deploy" → Bot online ngay
3. Chat với bot trên Telegram → AI trả lời

**Không cần:**
- ❌ VPS / Cloud server
- ❌ Biết code
- ❌ Setup phức tạp
- ❌ Quản lý infrastructure

### Tính năng hiện tại

| Tính năng | Free | Pro | Enterprise |
|-----------|------|-----|------------|
| Telegram Bot | ✅ | ✅ | ✅ |
| Messages/ngày | 100 | Unlimited | Unlimited |
| WhatsApp, Slack, Discord | ❌ | ✅ | ✅ |
| REST API access | ❌ | ❌ | ✅ |
| Custom System Prompt | ❌ | ✅ | ✅ |
| Watermark "Powered by pho.chat" | Có | Không | Không |

### Flow chi tiết

```
User gõ tin nhắn trên Telegram
  → Telegram gửi webhook tới /api/openclaw/webhook/[botId]
  → Server check: bot active? secret valid? daily limit ok?
  → Gọi Vercel AI Gateway (Gemini Flash)
  → Trả lời + watermark "⚡ pho.chat"
  → Tăng dailyMessageCount
```

**Khi hết quota (100/ngày):**
```
"⚠️ Daily message limit reached (100/day on free plan).
Upgrade at https://pho.chat/openclaw for unlimited messages!"
```

### Landing Page (8 sections)

| Section | Nội dung |
|---------|----------|
| **Hero** | Deploy box + channel icons (Telegram free, WhatsApp/Slack/Discord paid) |
| **Pain Points** | "Mất 2h setup?" → "Chỉ 30 giây" |
| **Features** | AI nhanh, multi-channel, không cần code |
| **Templates** | Customer support, Medical assistant, Sales bot |
| **Pricing** | 3 tiers (Free/Pro/Enterprise) |
| **Social Proof** | Testimonials, stats |
| **Trust** | Powered by Claude/GPT, Vercel hosting |
| **Final CTA** | "Deploy Now" |

---

## 🔧 GÓC NHÌN 2: Anh — Người vận hành Phở Chat

### OpenClaw giúp anh vận hành pho.chat thế nào?

#### A. Hệ thống Error Monitoring (đã implement)

**Telegram Bot admin** (`/api/agents/telegram/route.ts`) — anh chat trực tiếp trên Telegram:
```
Anh: "Check user thaohienhomes@gmail.com"
Bot:  👤 USER FOUND
      Plan: medical_beta | Status: ACTIVE | Phở Points: 500,000

Anh: "Fix sync for user abc@gmail.com"  
Bot:  ✅ SYNC HOTFIX APPLIED — Upgraded to Medical Beta

Anh: "error summary"  → Tổng hợp lỗi gần đây
Anh: "health check"   → DB, APIs, Clerk status
```

**Cron Alerts** (auto mỗi giờ):
```
⚠️ Phở Chat Error Monitor
🔴 2 user(s) with NEGATIVE Phở Points balance
🟡 1 stuck pending payment(s) (>1 hour)
🟠 API error rate: 15 errors in last hour
🔵 3 requests to deprecated model claude-3-7-sonnet-latest
```

**Client-side Error Reporter** (inline script, 0 bundle size):
- Bắt JS errors, API 500s, unhandled rejections
- Deduplicate → burst detection (≥3 lần/5 phút)
- → Gửi Telegram alert real-time cho anh

#### B. Revenue từ OpenClaw Bot Service

| Metric | Free Tier | Tiềm năng |
|--------|-----------|-----------|
| Chi phí Vercel | ~$0 (serverless) | Scale with Pro plan |
| Chi phí AI | ~$0.001/msg (Gemini Flash) | Pass-through + margin |
| Revenue | $0 | Pro tier subscription |
| Upsell | Watermark → pho.chat brand awareness | |

#### C. User Acquisition Funnel

```
User tạo bot free (100 msg/ngày)
  → Bot có watermark "⚡ pho.chat"
  → Bot's users thấy pho.chat brand
  → Một số click → tạo bot của họ (viral loop)
  → Khi đạt limit → upsell Pro plan
```

#### D. Data insights
- `openclaw_bots.messageCount` — tổng messages per bot
- `openclaw_bots.dailyMessageCount` — usage patterns
- Biết user nào active nhất → target upsell

---

## 🌐 GÓC NHÌN 3: External Users muốn dùng OpenClaw trực tiếp

### OpenClaw gốc (self-hosted) vs Phở Chat OpenClaw

| | **OpenClaw gốc** (github) | **Phở Chat OpenClaw** |
|---|---|---|
| **Setup** | Cài trên VPS/local, `openclaw onboard` | 30 giây, paste token |
| **Cần VPS?** | ✅ CÓ (Gateway chạy Node.js) | ❌ KHÔNG (Vercel serverless) |
| **Channels** | 22+ channels (Telegram, WhatsApp, Zalo...) | Telegram (free), thêm channels ở paid tier |
| **AI Model** | Tự config (OpenAI, Anthropic, etc.) | Vercel AI Gateway (managed) |
| **Skills** | ClawHub registry, workspace skills | Phở Chat plugins/tools |
| **Cost** | Tự trả API keys + VPS | Free tier + paid plans |
| **Control** | Full control (system prompt, tools, browser) | Limited (system prompt ở paid tier) |
| **Target** | Developer, power user | Non-technical end user |
| **Voice** | Voice Wake, Talk Mode | Chưa có |
| **Browser** | CDP Chrome control | Chưa có |
| **Multi-agent** | session routing, agent-to-agent | Chưa có |

### Khi nào dùng cái nào?

- **Dùng Phở Chat OpenClaw** khi: cần bot nhanh, không muốn quản lý server, non-technical
- **Dùng OpenClaw gốc** khi: cần full control, 22+ channels, voice, browser control, multi-agent, developer

### Cơ hội kết hợp
Phở Chat có thể cung cấp **"managed OpenClaw hosting"** — users deploy OpenClaw full-featured nhưng Phở Chat quản lý VPS:
```
User → pho.chat/openclaw → chọn plan
  → Phở Chat provision VPS (affiliate link DigitalOcean/Vultr)
  → Auto-install OpenClaw trên VPS
  → User manage qua Phở Chat dashboard
  → Anh nhận commission từ VPS provider
```

---

## Database Schema

```sql
CREATE TABLE openclaw_bots (
  id              TEXT PRIMARY KEY,        -- 'ocbot_1710..._abc123'
  user_id         TEXT REFERENCES users,   -- Phở Chat user
  bot_token       TEXT NOT NULL,           -- Telegram token
  bot_username    VARCHAR(256),            -- @bot_username
  bot_name        VARCHAR(256),            -- Display name
  status          VARCHAR(20) DEFAULT 'active',  -- active|paused|error
  channel_type    VARCHAR(20) DEFAULT 'telegram',
  system_prompt   TEXT,                    -- Custom AI prompt (paid)
  message_count   INTEGER DEFAULT 0,       -- Lifetime total
  daily_message_count INTEGER DEFAULT 0,   -- Today's count
  daily_reset_at  TIMESTAMPTZ,            -- Reset time
  webhook_secret  VARCHAR(64),            -- Verify Telegram requests
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ
);
```

---

## Branch Commits (8 commits)

| # | Commit | Nội dung |
|---|--------|----------|
| 1 | `fb859cc` | UI mockups (HTML) |
| 2 | `2954e46` | Sales funnel landing page (8 sections) |
| 3 | `44c115e` | Middleware + public routes |
| 4 | `c055381` | i18n JSON locales (EN/VI/ZH) |
| 5 | `bd1f29c` | Landing page UI/UX polish |
| 6 | `5f3eec0` | Vietnamese translations + SEO |
| 7 | `6fecb35` | Real Telegram bot deploy backend |
| 8 | `dd5f259` | Error monitoring expansion via Telegram |

---

## Tính năng cần phát triển tiếp

### Ưu tiên cao
- [ ] Custom system prompt (UI cho paid tier)
- [ ] Bot analytics dashboard (messages/day chart)
- [ ] WhatsApp channel support
- [ ] Zalo channel support (critical cho VN market)
- [ ] Payment integration (cho OpenClaw Pro plan)

### Ưu tiên trung bình
- [ ] Bot templates (pre-made system prompts)
- [ ] Multiple bots per user
- [ ] Bot pause/resume
- [ ] Chat history viewer
- [ ] VPS affiliate deploy (DigitalOcean/Vultr commission)

### Ưu tiên thấp
- [ ] Slack/Discord channels
- [ ] REST API connector
- [ ] Voice capabilities
- [ ] Multi-agent routing
