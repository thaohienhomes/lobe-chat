# 🎨 Image Generation & 🔊 Text-to-Speech Guide - pho.chat

## 📋 **Vấn Đề Hiện Tại**

### **1. Image Generation Issue** ❌

**Triệu chứng**:

- Model selector hiển thị "openai/gpt-image-1" (sai format)
- Không thể chọn models từ OpenRouter
- UI yêu cầu "Use custom OpenAI API Key"

**Nguyên nhân**:

- **OpenRouter KHÔNG HỖ TRỢ image generation** 🚫
- pho.chat mặc định dùng OpenAI provider cho image generation
- Anh chưa config OpenAI API key cho image generation

---

## ✅ **Giải Pháp: Image Generation**

### **Option 1: Dùng OpenAI DALL-E (Khuyến nghị)** ⭐

OpenAI là provider tốt nhất cho image generation với DALL-E 3.

#### **Bước 1: Thêm OpenAI API Key**

Vào Vercel Dashboard và thêm:

```bash
OPENAI_API_KEY=sk-proj-... # OpenAI API key (KHÔNG phải OpenRouter)
```

#### **Bước 2: Verify Models**

Sau khi deploy, vào Settings → AI Provider → OpenAI:

- ✅ `gpt-image-1` - ChatGPT native image generation
- ✅ `dall-e-3` - Latest DALL-E model (1024x1024, 1792x1024, 1024x1792)
- ✅ `dall-e-2` - DALL-E 2 (256x256, 512x512, 1024x1024)

#### **Bước 3: Test Image Generation**

1. Vào Painting page
2. Chọn model: `gpt-image-1` hoặc `dall-e-3`
3. Nhập prompt: "A beautiful sunset over the ocean"
4. Click Generate

**Pricing**:

- `gpt-image-1`: Free (included with ChatGPT)
- `dall-e-3`: $0.04 - $0.08 per image (depending on quality & size)
- `dall-e-2`: $0.016 - $0.020 per image

---

### **Option 2: Dùng Providers Khác**

Nếu không muốn dùng OpenAI, có thể dùng các providers sau:

| Provider       | Models                     | API Key Required     | Pricing               |
| -------------- | -------------------------- | -------------------- | --------------------- |
| **Fal**        | FLUX.1 Schnell, FLUX.1 Dev | `FAL_API_KEY`        | $0.003 - $0.025/image |
| **BFL**        | FLUX.1 Pro, FLUX.1 Kontext | `BFL_API_KEY`        | $0.025 - $0.04/image  |
| **Novita**     | Stable Diffusion, FLUX     | `NOVITA_API_KEY`     | $0.002 - $0.01/image  |
| **ZhiPu**      | CogView-4                  | `ZHIPU_API_KEY`      | ¥0.06/image           |
| **Volcengine** | Seedream 4.0               | `VOLCENGINE_API_KEY` | Varies                |
| **Minimax**    | Image 01                   | `MINIMAX_API_KEY`    | Varies                |

#### **Example: Enable Fal Provider**

```bash
# Add to Vercel env vars
FAL_API_KEY=your-fal-api-key
```

Sau đó vào Settings → AI Provider → Fal để enable.

---

### **Option 3: Dùng OpenAI-Compatible Providers**

Một số providers hỗ trợ OpenAI-compatible API:

```bash
# Example: Together AI
TOGETHERAI_API_KEY=your-together-api-key

# Example: Fireworks AI
FIREWORKSAI_API_KEY=your-fireworks-api-key
```

---

## 🔊 **Text-to-Speech (TTS) Status**

### **TTS Providers Supported** ✅

pho.chat hỗ trợ 3 TTS providers:

| Provider             | Models                                 | API Key Required       | Pricing                  |
| -------------------- | -------------------------------------- | ---------------------- | ------------------------ |
| **OpenAI TTS**       | `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts` | `OPENAI_API_KEY`       | $0.015 - $0.030/1K chars |
| **Edge Speech**      | Microsoft Edge TTS                     | ❌ FREE                | FREE                     |
| **Microsoft Speech** | Azure Speech                           | `MICROSOFT_SPEECH_KEY` | Varies                   |

### **Current TTS Configuration**

Default TTS settings:

```typescript
{
  ttsService: 'openai',  // Default provider
  voice: {
    openai: 'alloy',     // Default voice
  },
  sttServer: 'openai',   // Speech-to-text
  sttModel: 'whisper-1', // STT model
}
```

### **How to Use TTS**

#### **Option 1: OpenAI TTS (Requires API Key)**

1. Add `OPENAI_API_KEY` to Vercel
2. Vào Settings → TTS
3. Chọn TTS Service: **OpenAI**
4. Chọn Voice: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`
5. Chọn TTS Model: `tts-1`, `tts-1-hd`, `gpt-4o-mini-tts`

#### **Option 2: Edge Speech (FREE)** ⭐

1. Vào Settings → TTS
2. Chọn TTS Service: **Edge Speech**
3. Chọn Voice: Hàng trăm voices (Vietnamese supported!)
4. No API key required!

**Vietnamese Voices**:

- `vi-VN-HoaiMyNeural` (Female)
- `vi-VN-NamMinhNeural` (Male)

#### **Option 3: Microsoft Speech**

1. Add `MICROSOFT_SPEECH_KEY` to Vercel
2. Vào Settings → TTS
3. Chọn TTS Service: **Microsoft Speech**
4. Chọn Voice

---

## 🎯 **Recommended Setup for pho.chat**

### **For Vietnamese Users** 🇻🇳

```bash
# Image Generation
OPENAI_API_KEY=sk-proj-... # For DALL-E 3

# Text-to-Speech
# Use Edge Speech (FREE) - no API key needed!
# Or add OpenAI key above for OpenAI TTS
```

### **Settings Configuration**

1. **Image Generation**:
   - Provider: OpenAI
   - Model: `dall-e-3` (best quality)
   - Size: `1024x1024` (default)

2. **Text-to-Speech**:
   - TTS Service: **Edge Speech** (FREE)
   - Voice: `vi-VN-HoaiMyNeural` (Vietnamese female)
   - STT Service: OpenAI (if you have API key)
   - STT Model: `whisper-1`

---

## 📊 **Cost Comparison**

### **Image Generation**

| Provider | Model            | Cost per Image  | Quality    |
| -------- | ---------------- | --------------- | ---------- |
| OpenAI   | `dall-e-3`       | $0.04 - $0.08   | ⭐⭐⭐⭐⭐ |
| OpenAI   | `dall-e-2`       | $0.016 - $0.020 | ⭐⭐⭐⭐   |
| Fal      | FLUX.1 Schnell   | $0.003          | ⭐⭐⭐⭐   |
| BFL      | FLUX.1 Pro       | $0.04           | ⭐⭐⭐⭐⭐ |
| Novita   | Stable Diffusion | $0.002          | ⭐⭐⭐     |

### **Text-to-Speech**

| Provider         | Cost            | Quality    | Vietnamese Support |
| ---------------- | --------------- | ---------- | ------------------ |
| Edge Speech      | **FREE**        | ⭐⭐⭐⭐   | ✅ Yes             |
| OpenAI TTS       | $0.015/1K chars | ⭐⭐⭐⭐⭐ | ❌ No              |
| Microsoft Speech | Varies          | ⭐⭐⭐⭐⭐ | ✅ Yes             |

---

## 🚀 **Quick Start**

### **Step 1: Add OpenAI API Key**

```bash
# Vercel Dashboard → Environment Variables
OPENAI_API_KEY=sk-proj-...
```

### **Step 2: Redeploy**

Vercel sẽ tự động redeploy sau khi thêm env var.

### **Step 3: Test Image Generation**

1. Vào `/image` page
2. Chọn model: `dall-e-3`
3. Nhập prompt: "A beautiful Vietnamese landscape"
4. Click Generate

### **Step 4: Test TTS**

1. Vào Settings → TTS
2. Chọn TTS Service: **Edge Speech**
3. Chọn Voice: `vi-VN-HoaiMyNeural`
4. Test với text: "Xin chào, tôi là pho.chat"

---

## 🔍 **Troubleshooting**

### **Issue: "No auth credentials found"**

**Cause**: Chưa có OpenAI API key

**Solution**: Add `OPENAI_API_KEY` to Vercel env vars

### **Issue: "Model not found"**

**Cause**: Provider chưa được enable

**Solution**: Vào Settings → AI Provider → Enable provider

### **Issue: TTS không hoạt động**

**Cause**:

- OpenAI TTS: Chưa có API key
- Edge Speech: Browser không support

**Solution**:

- OpenAI TTS: Add `OPENAI_API_KEY`
- Edge Speech: Dùng Chrome/Edge browser

---

## 📝 **Summary**

✅ **Image Generation**: Cần `OPENAI_API_KEY` cho DALL-E
✅ **Text-to-Speech**: Dùng Edge Speech (FREE) cho Vietnamese
✅ **OpenRouter**: KHÔNG hỗ trợ image generation
✅ **Alternative Providers**: Fal, BFL, Novita, ZhiPu

**Action Required**: Add `OPENAI_API_KEY` to Vercel! 🚀

---

**Last Updated**: 2025-11-19
**Status**: READY TO IMPLEMENT ✅
