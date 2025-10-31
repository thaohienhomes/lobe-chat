# 🔄 Polar Product Model Update Summary

**Date**: 2025-10-31\
**Status**: ✅ DOCUMENTATION UPDATED\
**Application**: pho.chat (Production)

---

## 📋 What Changed

### Old Polar Model (Deprecated)

Previously, Polar used a **product + price** model:

- 1 product could have multiple prices (monthly + yearly)
- Required separate price IDs for each billing cycle
- Environment variables: `POLAR_PRODUCT_*_ID` + `POLAR_PRICE_*_MONTHLY_ID` + `POLAR_PRICE_*_YEARLY_ID`
- **Total**: 12 environment variables (3 config + 9 product/price IDs)

**Example (Old)**:

```bash
POLAR_PRODUCT_STARTER_ID=prod_xxxxxxxxxxxxx
POLAR_PRICE_STARTER_MONTHLY_ID=price_xxxxxxxxxxxxx
POLAR_PRICE_STARTER_YEARLY_ID=price_xxxxxxxxxxxxx
```

### New Polar Model (Current)

Polar now uses a **product-only** model:

- Each product has a **single pricing model** (monthly OR yearly)
- No separate price IDs - pricing is embedded in the product
- To offer both billing cycles, create **separate products**
- Environment variables: Only product IDs needed
- **Total**: 9 environment variables (3 config + 6 product IDs)

**Example (New)**:

```bash
POLAR_PRODUCT_STARTER_MONTHLY_ID=prod_xxxxxxxxxxxxx # $1.99/month
POLAR_PRODUCT_STARTER_YEARLY_ID=prod_xxxxxxxxxxxxx  # $19.99/year
```

---

## 🔑 Key Differences

| Aspect                | Old Model                   | New Model             |
| --------------------- | --------------------------- | --------------------- |
| Products per plan     | 1                           | 2 (monthly + yearly)  |
| Price IDs             | Required                    | Not used              |
| Total products        | 3                           | 6                     |
| Environment variables | 12                          | 9                     |
| Pricing flexibility   | Multiple prices per product | One price per product |

---

## 📦 Updated Product Structure

### Products to Create

You need to create **6 products total**:

#### Monthly Products

1. **Starter Plan (Monthly)**
   - Billing Cycle: Monthly
   - Price: $1.99 USD
   - Variable: `POLAR_PRODUCT_STARTER_MONTHLY_ID`

2. **Premium Plan (Monthly)**
   - Billing Cycle: Monthly
   - Price: $5.99 USD
   - Variable: `POLAR_PRODUCT_PREMIUM_MONTHLY_ID`

3. **Ultimate Plan (Monthly)**
   - Billing Cycle: Monthly
   - Price: $14.99 USD
   - Variable: `POLAR_PRODUCT_ULTIMATE_MONTHLY_ID`

#### Yearly Products

4. **Starter Plan (Yearly)**
   - Billing Cycle: Yearly
   - Price: $19.99 USD
   - Variable: `POLAR_PRODUCT_STARTER_YEARLY_ID`

5. **Premium Plan (Yearly)**
   - Billing Cycle: Yearly
   - Price: $59.99 USD
   - Variable: `POLAR_PRODUCT_PREMIUM_YEARLY_ID`

6. **Ultimate Plan (Yearly)**
   - Billing Cycle: Yearly
   - Price: $149.99 USD
   - Variable: `POLAR_PRODUCT_ULTIMATE_YEARLY_ID`

---

## 🔧 Environment Variables

### Complete List (9 variables)

```bash
# Polar Configuration (3 variables)
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_SERVER=production
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Starter Plan Products (2 variables)
POLAR_PRODUCT_STARTER_MONTHLY_ID=prod_xxxxxxxxxxxxx
POLAR_PRODUCT_STARTER_YEARLY_ID=prod_xxxxxxxxxxxxx

# Premium Plan Products (2 variables)
POLAR_PRODUCT_PREMIUM_MONTHLY_ID=prod_xxxxxxxxxxxxx
POLAR_PRODUCT_PREMIUM_YEARLY_ID=prod_xxxxxxxxxxxxx

# Ultimate Plan Products (2 variables)
POLAR_PRODUCT_ULTIMATE_MONTHLY_ID=prod_xxxxxxxxxxxxx
POLAR_PRODUCT_ULTIMATE_YEARLY_ID=prod_xxxxxxxxxxxxx
```

### Variables Removed

These variables are **no longer needed**:

```bash
# ❌ REMOVED - No longer used in new Polar model
POLAR_PRODUCT_STARTER_ID
POLAR_PRICE_STARTER_MONTHLY_ID
POLAR_PRICE_STARTER_YEARLY_ID
POLAR_PRODUCT_PREMIUM_ID
POLAR_PRICE_PREMIUM_MONTHLY_ID
POLAR_PRICE_PREMIUM_YEARLY_ID
POLAR_PRODUCT_ULTIMATE_ID
POLAR_PRICE_ULTIMATE_MONTHLY_ID
POLAR_PRICE_ULTIMATE_YEARLY_ID
```

---

## 📝 Documentation Updated

The following files have been updated to reflect the new Polar product model:

### 1. POLAR_SETUP_GUIDE_FOR_VERCEL.md

**Changes**:

- Added "Important Update (2025)" section explaining the new model
- Updated Step 2 to create 6 separate products instead of 3 products with multiple prices
- Updated environment variables section (9 variables instead of 12)
- Added note about no separate price IDs

**Key Sections Updated**:

- Overview (lines 9-27)
- Step 2: Create Products (lines 77-144)
- Step 3: Environment Variables (lines 157-180)

### 2. POLAR_PRICING_AND_WEBHOOK_UPDATE.md

**Changes**:

- Updated Step 3 with new environment variable structure
- Updated verification checklist to reflect 6 products and 9 variables
- Added note about no separate price IDs

**Key Sections Updated**:

- Step 3: Update Vercel Environment Variables (lines 127-152)
- Verification Checklist (lines 173-190)

---

## 🚀 Migration Steps

If you already have Polar products set up with the old model, follow these steps:

### Step 1: Create New Products

1. Log in to Polar Dashboard: <https://polar.sh/dashboard>
2. Go to **Products**
3. Create 6 new products following the structure above
4. Copy all 6 Product IDs

### Step 2: Update Environment Variables

1. Go to Vercel Dashboard: <https://vercel.com/dashboard>
2. Select **lobe-chat** project
3. Go to **Settings → Environment Variables**
4. **Remove** old variables (if they exist):
   - `POLAR_PRODUCT_STARTER_ID`
   - `POLAR_PRICE_STARTER_MONTHLY_ID`
   - `POLAR_PRICE_STARTER_YEARLY_ID`
   - (and all other price IDs)
5. **Add** new variables:
   - `POLAR_PRODUCT_STARTER_MONTHLY_ID`
   - `POLAR_PRODUCT_STARTER_YEARLY_ID`
   - `POLAR_PRODUCT_PREMIUM_MONTHLY_ID`
   - `POLAR_PRODUCT_PREMIUM_YEARLY_ID`
   - `POLAR_PRODUCT_ULTIMATE_MONTHLY_ID`
   - `POLAR_PRODUCT_ULTIMATE_YEARLY_ID`

### Step 3: Update Code (If Needed)

Check your code for any references to the old variable names and update them to the new names.

**Example**:

```typescript
// Old
const productId = process.env.POLAR_PRODUCT_STARTER_ID;
const priceId = billingCycle === 'monthly'
  ? process.env.POLAR_PRICE_STARTER_MONTHLY_ID
  : process.env.POLAR_PRICE_STARTER_YEARLY_ID;

// New
const productId = billingCycle === 'monthly'
  ? process.env.POLAR_PRODUCT_STARTER_MONTHLY_ID
  : process.env.POLAR_PRODUCT_STARTER_YEARLY_ID;
// No priceId needed!
```

### Step 4: Redeploy

1. Commit any code changes
2. Push to main branch
3. Vercel will automatically redeploy
4. Verify deployment completes successfully

### Step 5: Test

1. Test payment flow with both monthly and yearly billing cycles
2. Verify correct products are selected
3. Check webhook delivery

---

## ✅ Benefits of New Model

1. **Simpler**: No need to manage separate price IDs
2. **Fewer Variables**: 9 instead of 12 environment variables
3. **More Flexible**: Each product is independent with its own pricing
4. **Easier to Understand**: One product = one price
5. **Better API**: Cleaner checkout session creation

---

## 📚 Reference Links

- **Polar Products Documentation**: <https://polar.sh/docs/features/products>
- **Polar Checkout API**: <https://polar.sh/docs/features/checkout>
- **Polar Dashboard**: <https://polar.sh/dashboard>
- **Vercel Environment Variables**: <https://vercel.com/docs/projects/environment-variables>

---

## 🎯 Summary

✅ **Documentation Updated**: All Polar guides reflect new product model\
✅ **Variable Count Reduced**: From 12 to 9 environment variables\
✅ **Product Structure Clarified**: 6 products (3 plans × 2 billing cycles)\
✅ **No Price IDs**: Pricing embedded in products\
✅ **Ready for Implementation**: Follow POLAR_SETUP_GUIDE_FOR_VERCEL.md

**Commit**: `a68c446ff` - "docs: update Polar documentation to reflect new product model (no separate price IDs)"
