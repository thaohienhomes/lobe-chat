\# PHO.CHAT BUSINESS LOGIC \& PRICING STRATEGY



\## 1. Plan IDs \& Pricing Structure

The system distinguishes plans based on `Plan ID`. Pricing varies by region (VN vs Global) handled by the Payment Gateway, but internal feature logic maps as follows:



\### A. FREE TIER (Phở Không Người Lái)

\- \*\*Target:\*\* Everyone.

\- \*\*Price:\*\* 0 VND / $0.

\- \*\*Models:\*\* Tier 1 ONLY (GPT-4o-mini, Gemini Flash, Haiku).

\- \*\*Limits:\*\*

&nbsp; - 50,000 Pho Points / month.

&nbsp; - \*\*Feature Restriction:\*\* NO Chat History (Conversations not saved), NO File Uploads.



\### B. BASIC TIER (Phở Tái / Global Starter)

\- \*\*Target:\*\* Students, Casual Users.

\- \*\*Price:\*\*

&nbsp; - Vietnam: 69,000 VND/month.

&nbsp; - Global: $9.99/month.

\- \*\*Models:\*\* Tier 1 ONLY (Unlimited\*).

\- \*\*Features:\*\*

&nbsp; - ✅ Save Chat History.

&nbsp; - ✅ Upload Files/Images.

&nbsp; - ✅ Access Basic Prompt Library.

\- \*\*Limits:\*\*

&nbsp; - Unlimited Pho Points (Subject to Fair Use Policy).

&nbsp; - \*Strictly NO access to Tier 2 Models (GPT-4o, Sonnet).\*



\### C. PRO TIER (Phở Đặc Biệt / Global Pro)

\- \*\*Target:\*\* Professionals, Power Users.

\- \*\*Price:\*\*

&nbsp; - Vietnam: 199,000 VND/month.

&nbsp; - Global: $19.99/month.

\- \*\*Models:\*\* Tier 1 \& Tier 2 (GPT-4o, Claude 3.5 Sonnet, Gemini Pro).

\- \*\*Features:\*\*

&nbsp; - ✅ All Basic features.

&nbsp; - ✅ Advanced Agents/Prompts.

&nbsp; - ✅ Priority Support.

\- \*\*Limits:\*\*

&nbsp; - \*\*Tier 2 Quota:\*\* Hard limit of 2,000,000 Pho Points/month (approx 50-100 heavy messages/day).

&nbsp; - \*\*Fallback:\*\* When quota exceeded -> Downgrade to Tier 1 Unlimited OR Switch to BYOK.



\### D. LIFETIME DEAL (Founding Member)

\- \*\*Target:\*\* Early Adopters.

\- \*\*Price:\*\* $149.99 (Global/One-time).

\- \*\*Logic:\*\* Behaves exactly like \*\*PRO TIER\*\* but with no monthly recurring fee.

\- \*\*Mechanism:\*\*

&nbsp; - Account is credited with 2,000,000 Pho Points on the 1st of every month.

&nbsp; - Points do NOT roll over to the next month.



---



\## 2. Model Categorization (Tier Definitions)

\*Update `src/config/modelProviders` with these tags:\*



\- \*\*TIER 1 (Low Cost):\*\*

&nbsp; - `gpt-4o-mini`

&nbsp; - `gemini-1.5-flash-latest`

&nbsp; - `claude-3-haiku-20240307`

&nbsp; 

\- \*\*TIER 2 (High Cost - Premium):\*\*

&nbsp; - `gpt-4o`

&nbsp; - `claude-3-5-sonnet-20240620`

&nbsp; - `gemini-1.5-pro-latest`

&nbsp; - `o1-mini` / `o1-preview`



---



\## 3. Technical Implementation Rules (For Augment Code)



\### Database Schema (User Table)

Add these fields to User schema:

\- `planId`: string (enum: 'free', 'basic', 'pro', 'lifetime')

\- `phoPointsBalance`: number (current available points)

\- `phoPointsLimit`: number (monthly cap)

\- `subscriptionStatus`: string ('active', 'past\_due', 'canceled')

\- `nextBillingDate`: date



\### API Middleware Logic (`src/app/api/chat/route.ts`)

Before calling OpenRouter API, execute this \*\*Gatekeeper Logic\*\*:



1\.  \*\*Check Plan:\*\* Get `user.planId`.

2\.  \*\*Check Model Tier:\*\*

&nbsp;   - If `model` is Tier 2 AND `planId` is 'free' or 'basic' -> \*\*REJECT\*\* (Return 403: Upgrade Required).

3\.  \*\*Check Points:\*\*

&nbsp;   - Calculate estimated cost in points.

&nbsp;   - If `user.phoPointsBalance` <= 0 -> \*\*REJECT\*\* (Return 402: Out of Points) OR Enable BYOK.

4\.  \*\*Execute \& Deduct:\*\*

&nbsp;   - Call OpenRouter.

&nbsp;   - On success, deduct points from DB.



\## 4. AI Provider Strategy (CRITICAL)

\- \*\*Primary \& Only Provider:\*\* OpenRouter.

\- \*\*Action:\*\*

&nbsp; - The UI Dropdown MUST ONLY display models available via OpenRouter.

&nbsp; - Disable/Hide direct client-side calls to OpenAI, Anthropic, or Google Gemini APIs.

&nbsp; - All chat requests must be routed through the OpenRouter API endpoint to ensure `Pho Points` deduction logic works centrally.

&nbsp; - \*\*Environment Variables:\*\* The system should rely ONLY on `OPENROUTER\_API\_KEY`. It should NOT crash if `OPENAI\_API\_KEY` or `ANTHROPIC\_API\_KEY` are missing.

