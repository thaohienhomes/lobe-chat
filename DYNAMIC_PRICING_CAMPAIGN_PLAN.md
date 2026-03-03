# 🔥 Phở Chat - Dynamic Pricing Campaign Plan

## TL;DR

Chiến dịch **"Phở AI Early Bird"** - bán gói Pro (199k/tháng) với giá khởi điểm chỉ **83k/tháng (996k/năm)**. Giá tăng **1,000đ mỗi lượt mua**, tạo FOMO cực mạnh. Mục tiêu: **1,660+ buyers → 3 tỷ VND** trong 30 ngày.

---

## 1. Revenue Math (Toán doanh thu)

### Pricing Model

| Thông số | Giá trị |
|---|---|
| **Giá khởi điểm** | 996,000đ/năm (83k/tháng) |
| **Giá trần (cap)** | 2,388,000đ/năm (199k/tháng) |
| **Bước tăng giá** | +1,000đ/năm mỗi lượt mua |
| **Số bước tăng** | 1,392 lượt mua → đạt giá trần |
| **Features** | = gói vn_pro (2M points, Unlimited T1&T2, 50 T3/ngày) |

### Doanh thu dự kiến

```
Giai đoạn 1 (Graduated): 1,392 buyers
├── Buyer #1:    996,000đ/năm
├── Buyer #100:  1,095,000đ/năm
├── Buyer #500:  1,495,000đ/năm
├── Buyer #1000: 1,995,000đ/năm
├── Buyer #1392: 2,387,000đ/năm (gần cap)
└── Subtotal:    ~2,354,000,000đ (2.35 tỷ)

Giai đoạn 2 (At cap): 272+ buyers @ 2,388,000đ
└── Subtotal:    ~650,000,000đ (0.65 tỷ)

═══════════════════════════════════════════
TỔNG (1,664 buyers): ~3,000,000,000đ (3 tỷ)
═══════════════════════════════════════════
```

### Kịch bản tối ưu / bi quan

| Kịch bản | Buyers | Revenue |
|---|---|---|
| Bi quan (50 buyers/ngày × 30 ngày) | 1,500 | ~2.7 tỷ |
| **Mục tiêu (55/ngày × 30 ngày)** | **1,664** | **~3 tỷ** |
| Tối ưu (80/ngày × 30 ngày) | 2,400 | ~3.6 tỷ |
| Viral (100+/ngày) | 3,000+ | ~4+ tỷ |

---

## 2. Dynamic Pricing Engine

### 2.1 Thuật toán giá

```typescript
// Core pricing formula
function getCurrentCampaignPrice(totalPurchases: number): {
  yearlyPrice: number;
  monthlyEquivalent: number;
  savings: string;
  nextPriceIncrease: number;
} {
  const BASE_YEARLY = 996_000;      // 83k/tháng
  const CAP_YEARLY = 2_388_000;     // 199k/tháng
  const INCREMENT = 1_000;          // +1k mỗi lượt mua

  const yearlyPrice = Math.min(
    BASE_YEARLY + (totalPurchases * INCREMENT),
    CAP_YEARLY
  );

  const monthlyEquivalent = Math.round(yearlyPrice / 12);
  const regularYearlyPrice = 2_388_000; // giá gốc Pro
  const savingsPercent = Math.round((1 - yearlyPrice / regularYearlyPrice) * 100);

  return {
    yearlyPrice,
    monthlyEquivalent,
    savings: `${savingsPercent}%`,
    nextPriceIncrease: Math.min(yearlyPrice + INCREMENT, CAP_YEARLY) - yearlyPrice,
  };
}
```

### 2.2 Database Schema

```sql
-- Bảng campaign tracking (mới)
CREATE TABLE campaign_purchases (
  id SERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL DEFAULT 'early_bird_2026',
  purchase_number INT NOT NULL,        -- sequential purchase #
  user_id VARCHAR(255) NOT NULL,
  price_paid INT NOT NULL,             -- giá tại thời điểm mua (VND)
  created_at TIMESTAMP DEFAULT NOW(),
  sepay_payment_id INT REFERENCES sepay_payments(id)
);

-- Bảng campaign config
CREATE TABLE campaigns (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  base_yearly_price INT NOT NULL,      -- 996000
  cap_yearly_price INT NOT NULL,       -- 2388000
  price_increment INT NOT NULL,        -- 1000
  plan_id VARCHAR(50) NOT NULL,        -- 'vn_campaign_pro'
  total_purchases INT DEFAULT 0,       -- counter, updated atomically
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.3 API Endpoints

```
GET  /api/campaign/price          → Lấy giá hiện tại + stats
POST /api/campaign/purchase       → Tạo đơn mua (lock price + tạo Sepay QR)
POST /api/campaign/webhook        → Xác nhận thanh toán → cấp plan
GET  /api/campaign/stats          → Realtime stats (SSE/polling)
```

### 2.4 Race Condition Handling

```typescript
// Atomic counter + price lock khi tạo đơn
// Dùng PostgreSQL transaction + SELECT FOR UPDATE
async function reserveCampaignSlot(userId: string) {
  return db.transaction(async (tx) => {
    // Lock campaign row
    const campaign = await tx
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, 'early_bird_2026'))
      .for('update')
      .limit(1);

    const purchaseNumber = campaign.totalPurchases + 1;
    const price = calculatePrice(purchaseNumber);

    // Tăng counter
    await tx.update(campaigns)
      .set({ totalPurchases: purchaseNumber })
      .where(eq(campaigns.id, 'early_bird_2026'));

    // Tạo purchase record (pending payment)
    const purchase = await tx.insert(campaignPurchases).values({
      campaignId: 'early_bird_2026',
      purchaseNumber,
      userId,
      pricePaid: price.yearlyPrice,
    }).returning();

    return { purchase, price };
  });
}
```

---

## 3. Campaign Plan Config

```typescript
// Thêm vào src/config/pricing.ts
export const VN_CAMPAIGN_PLAN: PlanConfig = {
  code: 'vn_campaign_pro',
  displayName: 'Phở Pro - Early Bird 🔥',
  // Giá hiển thị sẽ dynamic, đây là giá gốc để so sánh
  price: 199_000,           // giá gốc monthly
  priceYearly: 2_388_000,   // giá gốc yearly
  monthlyPoints: 2_000_000, // = vn_pro
  advancedAI: true,
  enableCustomAPI: true,
  enableKnowledgeBase: true,
  storageGB: 5,
  vectorEntries: 20_000,
  prioritySupport: false,
  dailyTier2Limit: undefined,  // unlimited
  dailyTier3Limit: 50,
  features: [
    '2M Phở Points/tháng',
    'Unlimited Tier 1 & Tier 2',
    '50 lượt Tier 3/ngày (Claude Opus 4.6, Gemini 3.1 Pro)',
    'Phở Studio - tạo AI agents',
    'Knowledge Base 5GB',
    'Hỗ trợ ưu tiên',
    'Early Bird badge 🔥',
  ],
  keyLimits: 'Unlim Tier 1&2. 50 Tier 3/day. 2M points.',
};

// Campaign config
export const CAMPAIGN_CONFIG = {
  id: 'early_bird_2026',
  name: 'Phở AI Early Bird 2026',
  baseYearlyPrice: 996_000,     // 83k/tháng
  capYearlyPrice: 2_388_000,    // 199k/tháng
  priceIncrement: 1_000,        // +1k mỗi lượt mua
  planId: 'vn_campaign_pro',
  durationDays: 30,
  maxPurchases: 5000,           // safety cap
};
```

---

## 4. Landing Page Design (`/campaign`)

### 4.1 Layout Structure

```
┌─────────────────────────────────────────────┐
│                HERO SECTION                  │
│  "Phở AI Pro - Chỉ từ 83k/tháng"           │
│  "Giá tăng mỗi lượt mua. Mua ngay!"        │
│  [COUNTDOWN TIMER: 29 ngày 23:45:12]        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           LIVE PRICE TICKER 🔴               │
│  ┌─────────────────────────────────┐        │
│  │  GIÁ HIỆN TẠI                   │        │
│  │  ██████████░░░░░░ 35% đã tăng   │        │
│  │                                   │        │
│  │  1,234,000đ/năm                  │        │
│  │  (≈ 102,833đ/tháng)             │        │
│  │                                   │        │
│  │  Giá gốc: 2,388,000đ/năm        │        │
│  │  Bạn tiết kiệm: 48%             │        │
│  │                                   │        │
│  │  ⚡ 456 người đã mua             │        │
│  │  ⏰ Giá sẽ tăng thêm 1,000đ     │        │
│  │     sau lượt mua tiếp theo       │        │
│  └─────────────────────────────────┘        │
│                                              │
│        [🔥 MUA NGAY - KHÓA GIÁ NÀY]        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│          PRICE HISTORY CHART 📈              │
│  Biểu đồ giá theo thời gian thực            │
│  Hiển thị giá đã tăng bao nhiêu             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           SO SÁNH GIÁ TRỊ                    │
│  ┌──────────┐  ┌──────────┐                 │
│  │ ChatGPT  │  │ Phở Chat │                 │
│  │ Plus     │  │ Early    │                 │
│  │          │  │ Bird     │                 │
│  │ $20/mo   │  │ 83k/mo   │                 │
│  │ =480k/mo │  │ =83k/mo  │                 │
│  │          │  │          │                 │
│  │ ❌Tier3  │  │ ✅50T3/d │                 │
│  │ ❌Studio │  │ ✅Studio │                 │
│  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│           LIVE PURCHASE FEED                 │
│  "Nguyễn V*** vừa mua với giá 1,230k"      │
│  "Trần T*** vừa mua với giá 1,231k"        │
│  "Lê H*** vừa mua với giá 1,232k" (2p ago) │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        FEATURES SHOWCASE                     │
│  Hiển thị tính năng Pro đầy đủ              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        TESTIMONIALS / SOCIAL PROOF           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        FAQ                                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        STICKY BOTTOM BAR                     │
│  Giá: 1,234k/năm | [MUA NGAY] | ⏰ tăng   │
│  giá sau lượt mua tiếp                      │
└─────────────────────────────────────────────┘
```

### 4.2 FOMO Elements

1. **Live Price Ticker** - Giá cập nhật realtime (poll mỗi 5s)
2. **Purchase Counter** - "456 người đã mua"
3. **Price Progress Bar** - Hiển thị giá đã tăng bao nhiêu % từ giá khởi điểm
4. **Recent Purchases Feed** - Danh sách mua gần đây (tên ẩn một phần)
5. **Countdown Timer** - Đếm ngược ngày kết thúc campaign
6. **Savings Calculator** - Hiển thị % tiết kiệm so với giá gốc
7. **Next Price Warning** - "Giá sẽ tăng thêm 1,000đ sau lượt mua tiếp"
8. **Sticky Bottom CTA** - Luôn hiển thị giá + nút mua khi scroll

---

## 5. Content & Marketing

### 5.1 Landing Page Copy

**Hero:**
```
🔥 Phở AI Pro - Chỉ từ 83.000đ/tháng

Truy cập Claude Opus 4.6, Gemini 3.1 Pro, GPT-4.1 và hơn 20 AI models
Giá chỉ bằng 1 bát phở mỗi ngày

⚡ Giá tăng mỗi lượt mua - Không bao giờ quay lại!
```

**Value proposition:**
```
Tại sao 996.000đ/năm là deal không thể bỏ lỡ?

💰 ChatGPT Plus: $20/tháng = 5.760.000đ/năm
💰 Claude Pro: $20/tháng = 5.760.000đ/năm
💰 Gemini Advanced: $20/tháng = 5.760.000đ/năm
────────────────────────────────────────
🔥 Phở Chat Pro: từ 83.000đ/tháng = 996.000đ/năm
   → Bao gồm TẤT CẢ models trên + 20 models khác

Tiết kiệm tới 83% so với mua riêng lẻ!
```

**Urgency copy (rotate):**
```
- "⚡ 34 người đã mua trong 1 giờ qua - Giá đã tăng 34.000đ"
- "⏰ Campaign kết thúc sau 15 ngày - Giá không bao giờ quay lại"
- "🔥 Bạn đang xem giá #457 - Người sau bạn sẽ trả thêm 1.000đ"
- "💡 Tip: Chia sẻ link để bạn bè mua giá rẻ trước khi tăng tiếp!"
```

### 5.2 Social Proof Elements

- **Purchase feed** - Live stream các lượt mua
- **Buyer counter** - Animated counter (framer-motion)
- **Revenue milestone** - "Cộng đồng đã tin tưởng hơn X tỷ đồng"
- **Early Bird badge** - Hiển thị trên profile người mua sớm

### 5.3 Referral Mechanics (Optional - Phase 2)

```
- Mỗi user nhận link referral unique
- Người được giới thiệu: Không thêm giảm giá (đã rẻ rồi)
- Người giới thiệu: +100k Phở Points bonus mỗi referral thành công
- Leaderboard: Top 10 referrers nhận thêm 1 tháng Pro miễn phí
```

---

## 6. Technical Implementation Plan

### Phase 1: Core Infrastructure (Ngày 1-2)

#### 6.1 Database Schema
- File: `packages/database/src/schemas/campaigns.ts` (MỚI)
- Thêm bảng `campaigns` và `campaign_purchases`
- Migration file

#### 6.2 Campaign Config
- File: `src/config/pricing.ts` (SỬA)
- Thêm `VN_CAMPAIGN_PLAN` và `CAMPAIGN_CONFIG`

#### 6.3 Pricing Engine Service
- File: `src/server/services/campaign/pricing.ts` (MỚI)
- `getCurrentPrice()` - Lấy giá hiện tại
- `reserveSlot(userId)` - Lock giá + tạo đơn (transaction)
- `confirmPurchase(purchaseId)` - Xác nhận sau thanh toán

#### 6.4 API Routes
- File: `src/app/api/campaign/price/route.ts` (MỚI)
- File: `src/app/api/campaign/purchase/route.ts` (MỚI)
- File: `src/app/api/campaign/stats/route.ts` (MỚI)
- Tích hợp vào existing Sepay webhook handler

### Phase 2: Landing Page (Ngày 3-5)

#### 6.5 Campaign Landing Page
- File: `src/app/campaign/page.tsx` (MỚI)
- File: `src/app/campaign/layout.tsx` (MỚI)

#### 6.6 Campaign Components
- `src/app/campaign/features/Hero.tsx` - Hero với countdown
- `src/app/campaign/features/LivePriceTicker.tsx` - Giá realtime
- `src/app/campaign/features/PriceProgressBar.tsx` - Progress bar
- `src/app/campaign/features/PurchaseFeed.tsx` - Live feed mua
- `src/app/campaign/features/ValueComparison.tsx` - So sánh giá trị
- `src/app/campaign/features/Features.tsx` - Tính năng Pro
- `src/app/campaign/features/FAQ.tsx` - FAQ
- `src/app/campaign/features/StickyBottomBar.tsx` - CTA cố định

### Phase 3: Payment Integration (Ngày 5-6)

#### 6.7 Sepay Integration
- Mở rộng existing Sepay flow cho campaign purchases
- QR code generation với giá dynamic
- Webhook handler cập nhật campaign_purchases + cấp plan

### Phase 4: Polish & Launch (Ngày 6-7)

#### 6.8 Final touches
- Mobile responsive
- SEO meta tags (Open Graph cho sharing)
- Error handling & edge cases
- Analytics tracking events

---

## 7. Flow Chi Tiết

### User Journey

```
1. User vào /campaign (hoặc từ ads/social media link)
2. Thấy giá hiện tại + bao nhiêu người đã mua
3. Click "MUA NGAY"
4. → Nếu chưa login → redirect login → quay lại /campaign
5. → Nếu đã login → reserveSlot() lock giá 15 phút
6. Hiển thị QR code Sepay với giá đã lock
7. User quét QR thanh toán
8. Sepay webhook → confirmPurchase() → cấp plan vn_campaign_pro
9. Redirect /campaign/success với confetti 🎉
10. User có gói Pro 1 năm!
```

### Payment Flow

```
[User click MUA]
    │
    ▼
[POST /api/campaign/purchase]
    │ ← Atomic: lock giá + tăng counter + tạo Sepay payment
    ▼
[Hiển thị QR code + timer 15 phút]
    │
    ▼
[User quét QR thanh toán]
    │
    ▼
[Sepay webhook → /api/payment/sepay/webhook]
    │ ← Detect campaign purchase → confirm + cấp plan
    ▼
[Plan activated: vn_campaign_pro, 365 ngày]
    │
    ▼
[Redirect /campaign/success]
```

---

## 8. Risk Mitigation

| Risk | Giải pháp |
|---|---|
| Race condition (2 người mua cùng lúc) | PostgreSQL transaction + SELECT FOR UPDATE |
| User tạo đơn nhưng không thanh toán | Slot expires sau 15 phút, counter rollback |
| Abuse (1 user mua nhiều lần giá rẻ) | Check existing campaign purchase per user |
| Server overload khi viral | Rate limiting + caching giá (5s TTL) |
| Refund requests | Policy rõ ràng: không hoàn tiền campaign price |
| Existing Pro users muốn mua | Cho phép - extend subscription thêm 1 năm |

---

## 9. File Changes Summary

### Tạo mới (12 files)
```
packages/database/src/schemas/campaigns.ts
src/server/services/campaign/pricing.ts
src/app/api/campaign/price/route.ts
src/app/api/campaign/purchase/route.ts
src/app/api/campaign/stats/route.ts
src/app/campaign/page.tsx
src/app/campaign/layout.tsx
src/app/campaign/features/Hero.tsx
src/app/campaign/features/LivePriceTicker.tsx
src/app/campaign/features/PurchaseFeed.tsx
src/app/campaign/features/ValueComparison.tsx
src/app/campaign/features/StickyBottomBar.tsx
```

### Sửa (3 files)
```
src/config/pricing.ts                      → Thêm campaign plan
src/app/api/payment/sepay/webhook/route.ts → Handle campaign payments
packages/database/src/schemas/index.ts     → Export campaign schemas
```

---

## 10. Bổ sung: Ý tưởng tăng conversion

### 10.1 "Price Lock" Guarantee
- Khi user click MUA, giá được "khóa" 15 phút
- Hiển thị: "Giá của bạn đã được khóa! Hoàn tất thanh toán trong 14:59..."
- Tạo urgency kép: vừa sợ hết campaign, vừa sợ hết thời gian lock

### 10.2 Milestone Celebration
- Mỗi 100 lượt mua → hiệu ứng confetti trên landing page
- "🎉 Chúc mừng buyer #500! Cộng đồng Phở đang lớn mạnh!"

### 10.3 Price History Transparency
- Hiển thị mini chart: giá theo thời gian
- "Giá 6 giờ trước: 1,100k → Giá hiện tại: 1,234k → Giá dự kiến ngày mai: ~1,300k"
- Giúp user thấy giá THỰC SỰ đang tăng, không phải trick

### 10.4 "Bạn là người thứ #XXX"
- Mỗi buyer nhận number riêng: "Bạn là Early Bird #457"
- Hiển thị trên profile như badge danh dự
- Số càng nhỏ = mua càng sớm = deal càng tốt = flex được

### 10.5 Social Sharing with Price Proof
- Sau khi mua: "Chia sẻ deal này cho bạn bè!"
- Auto-generate image: "Tôi mua Phở Pro với giá 1,234k - Giá hiện tại đã là 1,350k!"
- Bạn bè thấy → FOMO → mua ngay

### 10.6 Email/Notification drip
- Ngày 1: "Campaign đã bắt đầu! Giá: 996k"
- Ngày 7: "500 người đã mua! Giá đã tăng 50% - còn 1,496k"
- Ngày 15: "Giá vượt 1,500k! Chỉ còn 15 ngày..."
- Ngày 25: "SẮP KẾT THÚC! Giá gần cap 2,388k!"
- Ngày 29: "NGÀY CUỐI! Sau hôm nay không bao giờ có giá này nữa!"
