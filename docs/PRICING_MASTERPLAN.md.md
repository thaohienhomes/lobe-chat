# **Project Specification: Phở Chat Pricing Engine Overhaul**

Version: 1.0\
Target System: Phở Chat (Next.js / Node.js Environment)\
Objective: Implement a geo-located, triple-layer pricing architecture using Sepay (Vietnam) and Polar (Global), backed by a hidden credit system ("Phở Points").

## ---

**1. Business Logic & Pricing Strategy**

### **1.1. Core Philosophy: The "Hidden Credit" Model**

To handle the massive cost variance between models (e.g., GPT-4o-mini vs. Claude 3 Opus), we will abstract usage into internal "Phở Points". Users subscribe to "Plans", which grant a monthly allowance of points.

- **Frontend:** Users see "Message Limits" (e.g., "30 GPT-4 messages/day").
- **Backend:** System deducts points based on token usage.
- **Fallback:** When points deplete, user is downgraded to Tier 1 models (Cheap), not blocked.

### **1.2. Geo-Fencing & Pricing Tiers**

The system must detect the user's IP (CF-IPCountry header).

#### **Region A: Vietnam (Payment via Sepay/VietQR)**

_Priority: Low cost, high volume, bank transfer automation._

| Plan Code | Display Name        | Price (VND)  | Monthly Points | Key Limits                            |
| :-------- | :------------------ | :----------- | :------------- | :------------------------------------ |
| vn_free   | Phở Không Người Lái | 0đ           | 50,000         | Tier 1 Models Only. No History.       |
| vn_basic  | Phở Tái (Student)   | 69,000đ      | 300,000        | Unlim Tier 1. 30 Tier 2 msgs/day.     |
| vn_pro    | Phở Đặc Biệt        | 199,000đ     | 2,000,000      | Unlim Tier 1 & 2. 50 Tier 3 msgs/day. |
| vn_team   | Lẩu Phở (Team)      | 149,000đ/usr | Pooled         | Min 3 users. Admin Dashboard.         |

#### **Region B: Global/ROW (Payment via Polar.sh)**

_Priority: MoR compliance, credit card processing._

| Plan Code   | Display Name  | Price (USD) | Monthly Points     | Polar Product ID   |
| :---------- | :------------ | :---------- | :----------------- | :----------------- |
| gl_starter  | Starter       | $0          | 30,000             | N/A                |
| gl_standard | Standard      | $9.90       | 500,000            | polar_prod_std_id  |
| gl_premium  | Premium       | $19.90      | 2,000,000          | polar_prod_prem_id |
| gl_lifetime | Lifetime Deal | $149.00     | 500,000/mo (Reset) | polar_prod_ltd_id  |

## ---

**2. Database Schema Design (Prisma Reference)**

Use this schema structure to update the database.

Đoạn mã

// 2.1. User & Wallet\
model User {\
id String @id @default(cuid())\
email String @unique\
countryCode String? // 'VN' or others

// Subscription Info\
subscriptionStatus String @default("FREE") // FREE, ACTIVE, PAST_DUE, CANCELLED\
currentPlanId String @default("vn_free")\
nextBillingDate DateTime?

// The "Hidden" Credit Wallet\
phoPointsBalance Int @default(50000)\
pointsResetDate DateTime? // For monthly quota reset

// Relations\
transactions Transaction\
usages UsageLog\
}

// 2.2. Model Cost Configuration (Dynamic Config)\
// Allows changing "Exchange Rate" without deploying code\
model ModelPricing {\
id String @id @default(uuid())\
modelName String @unique // e.g., 'gpt-4o', 'claude-3-opus'\
inputCostPer1M Float // Points to deduct per 1M input tokens\
outputCostPer1M Float // Points to deduct per 1M output tokens\
tier Int // 1 (Cheap), 2 (Standard), 3 (Expensive)\
}

// 2.3. Transactions (Unified for Sepay & Polar)\
model Transaction {\
id String @id @default(uuid())\
userId String\
amount Float\
currency String // 'VND' or 'USD'\
provider String // 'SEPAY' or 'POLAR'

// Provider specific IDs\
providerTxId String? // Sepay transaction ID or Polar Order ID\
status String // PENDING, COMPLETED, FAILED

createdAt DateTime @default(now())\
user User @relation(fields: \[userId], references: \[id])\
}

// 2.4. Usage Logging (For Auditing & Calculation)\
model UsageLog {\
id String @id @default(uuid())\
userId String\
modelUsed String\
inputTokens Int\
outputTokens Int\
pointsDeducted Int\
createdAt DateTime @default(now())\
user User @relation(fields: \[userId], references: \[id])\
}

## ---

**3. Technical Implementation Tasks**

### **Task A: "Phở Points" Middleware (The Bouncer)**

**Logic:** Before sending a request to OpenAI/Anthropic, check the user's wallet.

1. **Intercept Request:** Identify model_name requested by user.
2. **Fetch Pricing:** Get point cost from ModelPricing cache.
3. **Check Balance:**
   - IF (User.phoPointsBalance > Estimated_Cost): Allow request.
   - ELSE:
     - If Model Tier == 1: Allow (Soft limit/Free tier logic).
     - If Model Tier > 1: Reject request, return error 402 Payment Required, prompt UI to suggest downgrade or upgrade.
4. **Post-Process:** After LLM response, calculate actual cost and perform atomic decrement on phoPointsBalance.

### **Task B: Sepay Integration (Vietnam)**

**Endpoint:** /api/webhooks/sepay

1. **Generate QR:** On the frontend, when user selects "Phở Đặc Biệt", generate a transaction code: PHO.
2. **Webhook Handler:**
   - Receive POST from Sepay.
   - Verify API Key (Security).
   - Parse content (transaction description) to find the User ID/Code.
   - Validate amount == 199000.
   - **Action:**
     - Update User.subscriptionStatus = ACTIVE.
     - Update User.currentPlanId = vn_pro.
     - Add 2,000,000 to phoPointsBalance.
     - Create Transaction record.
   - **Response:** Return { success: true } to Sepay.

### **Task C: Polar Integration (Global)**

**Endpoint:** /api/webhooks/polar

1. **Redirect Flow:** Frontend redirects user to Polar Checkout URL based on Plan selection.
2. **Webhook Handler:**
   - Listen for subscription.created and invoice.paid.
   - Match customer_email or metadata.userId.
   - **Action:**
     - Update User.subscriptionStatus = ACTIVE.
     - Map Polar Product ID to local Plan ID (e.g., polar_prod_std_id -> gl_standard).
     - Top up phoPointsBalance.

### **Task D: The Daily Streak (Gamification)**

**Logic:** Run a lightweight check on first login/message of the day.

1. Check lastActiveDate.
2. If lastActiveDate == Yesterday: Increment streakCount.
3. Reward: Add 50 points (micro-reward) to wallet.
4. If streakCount % 7 == 0: Add 500 bonus points.

## ---

**4. Frontend Implementation Guide (Settings Page)**

**Path:** /settings?active=subscription

1. **Component PricingTable:**
   - useEffect: Fetch user's IP country.
   - **Condition:**
     - If VN: Render \<VietnamPricingCards /> (Price in VND, Sepay Modal).
     - Else: Render \<GlobalPricingCards /> (Price in USD, Polar Link).
2. **Component UsageMeter:**
   - Display a progress bar: "Monthly Usage".
   - Show simplified stats: "You have used 45% of your High-Speed Data".
   - _Do not show raw point numbers unless requested in a tooltip._

## ---

**5. Security & Risk Control**

- **Rate Limiting:** Even with points, enforce a hard cap of 50 requests/hour to prevent API key scraping/abuse.
- **Sepay Validation:** Ensure the transaction_content parsing is strict to prevent spoofing.
- **Point Overflow:** Cap the maximum rollover points (e.g., max 2x monthly quota) to prevent massive liability accumulation.

## ---

**6. Execution Prompt for Gemini**

_Copy and paste the following prompt into Antigravity to start coding:_

"Gemini, using the context of our Phở Chat project, please implement the pricing system defined in the PHO_CHAT_PRICING_MASTERPLAN.md file.

1. Start by creating the **Prisma schema migration** to add the phoPointsBalance, ModelPricing, and Transaction tables.
2. Create a **seeding script** to populate ModelPricing with initial costs (Tier 1: 5 pts, Tier 2: 150 pts, Tier 3: 1000 pts).
3. Implement the **API Route** /api/webhooks/sepay to handle the incoming bank transfer webhook logic.
4. Create the **middleware function** checkPhoPoints that we will wrap around our chat API route.

Let's start with Step 1 and 2."
