# PHỞ ECOSYSTEM: UNIFIED WALLET & SERVICE SPECS

## 1. System Overview
The ecosystem consists of two main applications:
1.  **Phở Chat (Host/Core):** Handles Authentication (Clerk), Database (Neon), Payment (Sepay/Polar), and the unified **Wallet System**.
2.  **Phở Studio (Consumer):** An external service for Video Generation. It consumes credits from Phở Chat's wallet via API.

## 2. Business Logic & Tier Restrictions (CRITICAL)

### Pricing Tiers (Vietnam Market)
| Tier Name | Price (VND) | Chat Access | Studio (Video) Access | Notes |
|-----------|-------------|-------------|-----------------------|-------|
| **Free** | 0đ | ✅ Yes (Limited) | ❌ **NO** | Trial Chat only |
| **Basic** | 69,000đ | ✅ Yes (Unlimited) | ❌ **NO** | Text-only users |
| **Creator**| 199,000đ | ✅ Yes | ✅ **YES** (Standard) | Entry level for Video |
| **Pro** | 499,000đ | ✅ Yes | ✅ **YES** (Priority) | Power users |

### Global Market (Polar.sh)
* All Global Paid Tiers ($9.99+) have access to **BOTH** Chat and Studio.

## 3. Wallet Architecture (Source of Truth)

The `pho_wallet` table acts as the central bank.
* **Location:** Phở Chat Database (Neon).
* **Logic:** Phở Studio does NOT store balances. It queries Phở Chat.

### Data Schema (pho_wallet)
- `clerk_user_id`: String (PK)
- `balance`: Integer (Credits)
- `tier_code`: Enum ('free', 'vn_69k', 'vn_199k', 'vn_499k', 'global_standard')

## 4. API Contract (Phở Chat <-> Phở Studio)

Phở Chat must expose these internal APIs for the ecosystem:

### A. Check Eligibility
`GET /api/internal/wallet/status?user_id=...`
* **Response:**
    ```json
    {
      "balance": 500,
      "can_use_studio": true, // false if Tier is Free or vn_69k
      "tier": "vn_199k"
    }
    ```

### B. Deduct Credits (Transactional)
`POST /api/internal/wallet/deduct`
* **Input:** `{ "user_id": "...", "amount": 20, "service": "studio_gen" }`
* **Validation Rule:**
    1. Check if `can_use_studio` is TRUE. If False -> Throw 403 "Upgrade to Creator Plan".
    2. Check if `balance` >= `amount`.
    3. Deduct balance.

## 5. Security Note
* Since Phở Studio calls these APIs, verify the request comes from a trusted source (e.g., via a Shared Secret Key in headers).