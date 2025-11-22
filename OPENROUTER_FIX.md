# 🔧 Fix OpenRouter API Configuration

## ❌ Vấn Đề Hiện Tại

Anh đang gặp lỗi **"No auth credentials found"** khi sử dụng các models vì:

1. **Nhầm lẫn giữa 2 providers**:
   - **OpenAI Provider**: Sử dụng `OPENAI_API_KEY`, `OPENAI_PROXY_URL`, `OPENAI_MODEL_LIST`
   - **OpenRouter Provider**: Sử dụng `OPENROUTER_API_KEY`

2. **Config hiện tại trong Vercel**:

   ```bash
   OPENAI_API_KEY=sk-or-v1-a47441f9b2fc691a80f2... # ❌ Đây là OpenRouter key
   OPENAI_PROXY_URL=https://openrouter.ai/api/v1   # ❌ Đây là OpenRouter URL
   OPENAI_MODEL_LIST=openai/gpt-3.5-turbo,openai/gpt-4o-mini,anthropic/claude-3-5-sonnet,google/gemini-pro-1.5
   ```

3. **Kết quả**: Hệ thống nghĩ anh đang dùng OpenAI provider nhưng lại không có OpenAI API key thật.

---

## ✅ Giải Pháp

### **Option 1: Sử dụng OpenRouter Provider (Khuyến nghị)**

Đây là cách đúng nhất để sử dụng OpenRouter.

#### **Bước 1: Xóa các biến OpenAI trong Vercel**

Vào Vercel Dashboard → Settings → Environment Variables, **XÓA** các biến sau:

```bash
❌ OPENAI_API_KEY
❌ OPENAI_PROXY_URL
❌ OPENAI_MODEL_LIST
```

#### **Bước 2: Thêm biến OpenRouter**

**THÊM** biến mới:

```bash
✅ OPENROUTER_API_KEY=sk-or-v1-a47441f9b2fc691a80f2...
```

#### **Bước 3: Redeploy**

Sau khi thay đổi env vars, Vercel sẽ tự động redeploy.

#### **Bước 4: Chọn OpenRouter Provider trong UI**

1. Vào Settings → Language Model
2. Chọn **OpenRouter** provider (không phải OpenAI)
3. Chọn models từ OpenRouter:
   - `openai/gpt-3.5-turbo`
   - `openai/gpt-4o-mini`
   - `anthropic/claude-3-5-sonnet`
   - `google/gemini-pro-1.5`

---

### **Option 2: Sử dụng OpenAI Provider với OpenRouter Proxy**

Nếu anh muốn giữ nguyên UI hiện tại (chọn OpenAI provider), có thể config như sau:

#### **Trong Vercel Environment Variables**:

```bash
✅ OPENAI_API_KEY=sk-or-v1-a47441f9b2fc691a80f2... # OpenRouter API key
✅ OPENAI_PROXY_URL=https://openrouter.ai/api/v1
✅ OPENAI_MODEL_LIST=openai/gpt-3.5-turbo,openai/gpt-4o-mini,anthropic/claude-3-5-sonnet,google/gemini-pro-1.5
```

**Lưu ý quan trọng**:

- Model names **PHẢI** có prefix `openai/`, `anthropic/`, `google/` như OpenRouter yêu cầu
- Đây là cách "hack" để dùng OpenRouter qua OpenAI provider
- **Không khuyến nghị** vì có thể gây nhầm lẫn sau này

---

## 🎯 Khuyến Nghị

**Nên dùng Option 1** vì:

- ✅ Rõ ràng, dễ maintain
- ✅ Tận dụng được tất cả features của OpenRouter
- ✅ Không gây nhầm lẫn với OpenAI provider
- ✅ Dễ debug khi có lỗi

---

## 📝 Checklist

- [ ] Xóa `OPENAI_API_KEY`, `OPENAI_PROXY_URL`, `OPENAI_MODEL_LIST` trong Vercel
- [ ] Thêm `OPENROUTER_API_KEY` trong Vercel
- [ ] Đợi Vercel redeploy
- [ ] Vào Settings → Language Model
- [ ] Chọn **OpenRouter** provider
- [ ] Chọn models từ OpenRouter
- [ ] Test gửi tin nhắn với GPT-4o-mini
- [ ] Test gửi tin nhắn với Claude Sonnet
- [ ] Test gửi tin nhắn với Gemini Pro

---

## 🔍 Debug

Nếu vẫn gặp lỗi sau khi config:

1. **Check Vercel logs**:

   ```bash
   [ModelRuntime] Provider: openrouter
   [ModelRuntime] Final API Key exists: true
   [ModelRuntime] Final Base URL: https://openrouter.ai/api/v1
   ```

2. **Check OpenRouter API key**:
   - Vào <https://openrouter.ai/keys>
   - Verify key còn valid
   - Check credit balance

3. **Check model names**:
   - Model names phải đúng format OpenRouter
   - Ví dụ: `openai/gpt-4o-mini` (không phải `gpt-4o-mini`)

---

## 📚 Tài Liệu Tham Khảo

- OpenRouter Models: <https://openrouter.ai/models>
- OpenRouter API Docs: <https://openrouter.ai/docs>
- LobeChat OpenRouter Config: `src/config/modelProviders/openrouter.ts`
