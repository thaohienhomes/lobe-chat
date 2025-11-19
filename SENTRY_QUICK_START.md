# Sentry Quick Start Guide

## 🚀 3 Bước để Kích Hoạt Sentry

### Step 1: Lấy Sentry DSN

1. Truy cập https://sentry.io
2. Đăng nhập hoặc tạo tài khoản
3. Tạo project mới (chọn "Next.js")
4. Copy DSN (dạng: `https://xxxxx@sentry.io/xxxxx`)

### Step 2: Thêm Environment Variables vào Vercel

Vào Vercel Dashboard → Settings → Environment Variables

Thêm 4 biến:

```
NEXT_PUBLIC_ENABLE_SENTRY = true
NEXT_PUBLIC_SENTRY_DSN = https://your-key@sentry.io/your-project-id
SENTRY_ORG = your-org-slug
SENTRY_PROJECT = your-project-slug
```

### Step 3: Deploy & Test

```bash
# Deploy to Vercel
git push origin main

# Sau khi deploy, test Sentry
curl https://pho.chat/api/test-sentry

# Kiểm tra Sentry dashboard
# Errors sẽ xuất hiện trong vòng 5-10 giây
```

## ✅ Verification

Sau khi deploy, bạn sẽ thấy:

1. **Sentry Dashboard** → Errors tab → "Test error from pho.chat"
2. **Sentry Dashboard** → Issues → Mới nhất sẽ là test error
3. **Sentry Dashboard** → Performance → Transactions được tracked

## 🧪 Test Endpoints

```bash
# Test error capture
curl https://pho.chat/api/test-sentry

# Test message capture
curl https://pho.chat/api/test-sentry?type=message

# Test exception capture
curl https://pho.chat/api/test-sentry?type=exception
```

## 📊 What Gets Tracked Automatically

✅ JavaScript errors (client)
✅ API errors (server)
✅ React component errors
✅ Performance metrics
✅ Session replays
✅ User interactions

## 🔍 Monitoring

Sau khi setup, bạn có thể:

1. **View Errors**: Sentry Dashboard → Issues
2. **See Stack Traces**: Click vào error để xem chi tiết
3. **Watch Session Replay**: Xem lại user session khi error xảy ra
4. **Track Performance**: Sentry Dashboard → Performance
5. **Set Alerts**: Sentry Dashboard → Alerts

## 🛑 Disable Sentry (nếu cần)

```bash
# Xóa hoặc set thành false
NEXT_PUBLIC_ENABLE_SENTRY = false
```

## 📞 Support

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Sentry Support: https://sentry.io/support/
- Local Setup: Xem `docs/SENTRY_SETUP.md`

## 💡 Tips

1. **Development**: Tất cả errors được capture (100% sampling)
2. **Production**: Chỉ 10% transactions được capture (để tiết kiệm)
3. **Session Replay**: Chỉ 10% sessions được record (+ 100% error sessions)
4. **Adjust Sampling**: Edit `sentry.client.config.ts` hoặc `sentry.server.config.ts`

---

**Đó là tất cả! Sentry sẽ tự động capture tất cả errors từ pho.chat.**

