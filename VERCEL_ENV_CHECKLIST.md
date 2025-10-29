# Vercel Environment Variables Checklist for pho.chat

## 🚨 Critical - Required for Site to Load

### Clerk Authentication (REQUIRED)

These MUST be set in Vercel Production environment:

```bash
# Get these from https://dashboard.clerk.com → Your App → API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxx
```

**Important**:

- Use `pk_live_` keys for production (NOT `pk_test_`)
- Set these in **Production** environment in Vercel
- After adding, you MUST redeploy

### Database (REQUIRED for server mode)

```bash
DATABASE_URL=postgres://username:password@host:port/database
DATABASE_DRIVER=node
NEXT_PUBLIC_SERVICE_MODE=server
KEY_VAULTS_SECRET=xxxxx/xxxxxxxxxxxxxx=
```

## ✅ Recommended - For Full Functionality

### Branding

```bash
NEXT_PUBLIC_BRAND_NAME=pho.chat
NEXT_PUBLIC_WEBSITE_URL=https://pho.chat
NEXT_PUBLIC_SUPPORT_EMAIL=support@pho.chat
```

### Sepay Payment (if using)

```bash
SEPAY_MERCHANT_ID=your_merchant_id
SEPAY_SECRET_KEY=your_secret_key
SEPAY_API_URL=https://api.sepay.vn/v1
SEPAY_BANK_ACCOUNT=your_bank_account
SEPAY_BANK_NAME=your_bank_name
```

## 🔧 How to Set Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (lobe-chat)
3. Go to **Settings** → **Environment Variables**
4. For each variable:
   - Click **Add New**
   - Enter **Key** (e.g., `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
   - Enter **Value** (your actual key)
   - Select **Production** environment
   - Click **Save**
5. After adding all variables, go to **Deployments**
6. Click **Redeploy** on the latest deployment

## 🔍 Clerk Dashboard Configuration

### 1. Get Your Keys

- Go to <https://dashboard.clerk.com>
- Select your application
- Navigate to **API Keys**
- Copy the **Publishable Key** (starts with `pk_live_`)
- Copy the **Secret Key** (starts with `sk_live_`)

### 2. Configure Allowed Domains

- In Clerk Dashboard, go to **Domains**
- Add `pho.chat` to allowed domains
- Add `*.pho.chat` for subdomains (if needed)
- Save changes

### 3. Configure Webhook (for database sync)

- Go to **Webhooks** in Clerk Dashboard
- Click **Add Endpoint**
- URL: `https://pho.chat/api/webhooks/clerk`
- Events: Select `user.created`, `user.updated`, `user.deleted`
- Copy the **Signing Secret** (starts with `whsec_`)
- Use this as `CLERK_WEBHOOK_SECRET`

## 🐛 Troubleshooting

### Site stuck on "Initializing user status..."

**Cause**: Clerk is not properly configured

**Fix**:

1. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in Vercel Production
2. Verify the key starts with `pk_live_` (not `pk_test_`)
3. Check Clerk Dashboard → Domains includes `pho.chat`
4. Redeploy after setting variables

### "Invalid publishable key" error

**Cause**: Using test keys in production or wrong key format

**Fix**:

1. Go to Clerk Dashboard → API Keys
2. Make sure you're copying from the **Production** section
3. Key should start with `pk_live_`
4. Update in Vercel and redeploy

### Database connection errors

**Cause**: Missing or incorrect DATABASE_URL

**Fix**:

1. Get your Postgres connection string from Vercel Storage or your provider
2. Format: `postgres://user:password@host:port/database`
3. Set `DATABASE_DRIVER=node` for Vercel
4. Set `NEXT_PUBLIC_SERVICE_MODE=server`

## 📋 Quick Verification

Run this locally to test your configuration:

```bash
bun run node scripts/check-clerk-config.js
```

Or check in Vercel deployment logs for:

```
Middleware configuration: {
  enableClerk: true,  // Should be true
  enableNextAuth: false
}
```

## 🔗 Useful Links

- [Clerk Dashboard](https://dashboard.clerk.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Clerk Next.js Documentation](https://clerk.com/docs/quickstarts/nextjs)
- [Vercel Environment Variables Guide](https://vercel.com/docs/projects/environment-variables)
