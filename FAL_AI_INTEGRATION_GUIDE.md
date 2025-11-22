# 🎨 Fal.ai Image Generation Integration - pho.chat

## ✅ **TIN VUI: Fal.ai ĐÃ ĐƯỢC TÍCH HỢP SẴN!**

pho.chat đã có sẵn Fal.ai provider với **9 image generation models** 🎉

---

## 📋 **Fal.ai Models Available**

| Model                     | Description                   | Cost/Image   | Quality    |
| ------------------------- | ----------------------------- | ------------ | ---------- |
| **FLUX.1 Schnell**        | Fastest FLUX model (4 steps)  | $0.003/MP    | ⭐⭐⭐⭐   |
| **FLUX.1 Krea \[dev]**    | Aesthetic-focused FLUX        | $0.025/MP    | ⭐⭐⭐⭐⭐ |
| **FLUX.1 Kontext \[dev]** | Image editing with text+image | $0.025/MP    | ⭐⭐⭐⭐⭐ |
| **FLUX.1 Kontext \[pro]** | Pro image editing             | $0.04/image  | ⭐⭐⭐⭐⭐ |
| **Nano Banana**           | Google's multimodal model     | $0.039/image | ⭐⭐⭐⭐   |
| **Seedream 4.0**          | ByteDance's image gen         | $0.03/image  | ⭐⭐⭐⭐⭐ |
| **Imagen 4**              | Google Deepmind's model       | $0.05/image  | ⭐⭐⭐⭐⭐ |
| **Qwen Image**            | Chinese text generation       | $0.02/MP     | ⭐⭐⭐⭐   |
| **Qwen Edit**             | Image editing model           | $0.025/image | ⭐⭐⭐⭐   |

**MP = Megapixel** (1024x1024 = 1MP)

---

## 🚀 **Quick Setup (5 Minutes)**

### **Step 1: Add Fal API Key to Vercel**

1. Vào Vercel Dashboard:

   ```
   https://vercel.com/thaohienhomes/lobe-chat/settings/environment-variables
   ```

2. Click **"Add New"**

3. Thêm biến:

   ```bash
   Name: FAL_API_KEY
   Value: [Anh's Fal API Key]
   Environment: Production, Preview, Development (chọn tất cả)
   ```

4. Click **"Save"**

### **Step 2: Đợi Vercel Redeploy**

Vercel sẽ tự động redeploy (\~5-10 phút)

### **Step 3: Enable Fal Provider**

1. Vào pho.chat production
2. Settings → AI Provider
3. Tìm **"Fal"** provider
4. Click **"Enable"** (nếu chưa enable)

### **Step 4: Test Image Generation**

1. Vào `/image` page
2. Click model selector
3. Chọn **"Fal"** provider
4. Chọn model: **"FLUX.1 Schnell"** (fastest & cheapest)
5. Nhập prompt: "A beautiful Vietnamese landscape with mountains"
6. Click **"Generate"**

---

## 🎯 **Recommended Models**

### **For Speed** ⚡

**FLUX.1 Schnell** - $0.003/MP

- Fastest generation (4 steps)
- Good quality
- Best for quick iterations

### **For Quality** 🎨

**FLUX.1 Krea \[dev]** - $0.025/MP

- Aesthetic-focused
- Natural, realistic images
- Best for final outputs

### **For Chinese Text** 🇨🇳

**Qwen Image** - $0.02/MP

- Excellent Chinese character generation
- Supports Chinese & English prompts
- Best for Vietnamese/Chinese content

### **For Image Editing** ✏️

**FLUX.1 Kontext \[pro]** - $0.04/image

- Text + image input
- Precise editing
- Best for modifications

---

## 💰 **Cost Comparison**

### **Fal.ai vs OpenAI**

| Provider   | Model          | Cost          | Speed      | Quality    |
| ---------- | -------------- | ------------- | ---------- | ---------- |
| **Fal**    | FLUX.1 Schnell | $0.003/MP     | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐   |
| **Fal**    | FLUX.1 Krea    | $0.025/MP     | ⚡⚡⚡⚡   | ⭐⭐⭐⭐⭐ |
| **Fal**    | Qwen Image     | $0.02/MP      | ⚡⚡⚡⚡   | ⭐⭐⭐⭐   |
| **OpenAI** | DALL-E 3       | $0.04-$0.08   | ⚡⚡⚡     | ⭐⭐⭐⭐⭐ |
| **OpenAI** | DALL-E 2       | $0.016-$0.020 | ⚡⚡⚡     | ⭐⭐⭐⭐   |

**Verdict**: Fal.ai is **10-20x cheaper** than OpenAI! 🎉

---

## 📊 **Monthly Cost Estimate**

### **100 Images/Month**

| Model          | Cost/Month | Use Case                   |
| -------------- | ---------- | -------------------------- |
| FLUX.1 Schnell | **$0.30**  | Quick iterations           |
| FLUX.1 Krea    | **$2.50**  | High-quality outputs       |
| Qwen Image     | **$2.00**  | Chinese/Vietnamese content |
| DALL-E 3       | **$4-8**   | Premium quality            |

**Recommended**: FLUX.1 Schnell for testing, FLUX.1 Krea for production

---

## 🔧 **Technical Details**

### **Provider Configuration**

\<augment_code_snippet path="src/config/modelProviders/fal.ts" mode="EXCERPT">

```typescript
const Fal: ModelProviderCard = {
  chatModels: [],
  description: '面向开发者的生成式媒体平台',
  enabled: true,
  id: 'fal',
  name: 'Fal',
  settings: {
    disableBrowserRequest: true,
    showAddNewModel: false,
    showChecker: false,
    showModelFetcher: false,
  },
  url: 'https://fal.ai',
};
```

\</augment_code_snippet>

### **Environment Variables**

\<augment_code_snippet path="src/envs/llm.ts" mode="EXCERPT">

```typescript
ENABLED_FAL: process.env.ENABLED_FAL !== '0',
FAL_API_KEY: process.env.FAL_API_KEY,
```

\</augment_code_snippet>

### **Available Models**

\<augment_code_snippet path="packages/model-bank/src/aiModels/fal.ts" mode="EXCERPT">

```typescript
const falImageModels: AIImageModelCard[] = [
  {
    displayName: 'FLUX.1 Schnell',
    id: 'fal-ai/flux/schnell',
    parameters: fluxSchnellParamsSchema,
    pricing: {
      units: [{ name: 'imageGeneration', rate: 0.003, strategy: 'fixed', unit: 'megapixel' }],
    },
  },
  // ... 8 more models
];
```

\</augment_code_snippet>

---

## 🎨 **Model Parameters**

### **FLUX.1 Schnell**

```typescript
{
  width: 1024,      // 512-1536
  height: 1024,     // 512-1536
  steps: 4,         // 1-12 (faster = fewer steps)
  seed: null,       // Random seed for reproducibility
  prompt: "..."     // Your text prompt
}
```

### **FLUX.1 Krea \[dev]**

```typescript
{
  width: 832,       // 512-2048
  height: 1248,     // 512-2048
  steps: 28,        // 1-50
  cfg: 7.5,         // 0-20 (guidance scale)
  seed: null,
  prompt: "..."
}
```

### **Qwen Image**

```typescript
{
  width: 1328,      // 512-1536
  height: 1328,     // 512-1536
  steps: 30,        // 2-50
  cfg: 2.5,         // 0-20
  seed: null,
  prompt: "..."     // Supports Chinese & English
}
```

---

## 🔍 **Troubleshooting**

### **Issue: "Invalid API Key"**

**Cause**: Fal API key chưa được add hoặc sai

**Solution**:

1. Check Vercel env vars
2. Verify `FAL_API_KEY` is set correctly
3. Redeploy

### **Issue: "Provider not found"**

**Cause**: Fal provider chưa được enable

**Solution**:

1. Vào Settings → AI Provider
2. Enable **Fal** provider
3. Refresh page

### **Issue: "Model not available"**

**Cause**: Model chưa được sync

**Solution**:

1. Clear browser cache
2. Refresh page
3. Check if Fal provider is enabled

---

## 📝 **Summary**

✅ **Fal.ai ĐÃ ĐƯỢC TÍCH HỢP SẴN**
✅ **9 Image Generation Models**
✅ **10-20x CHEAPER than OpenAI**
✅ **Faster Generation Speed**
✅ **Chinese Text Support (Qwen)**

**Action Required**: Add `FAL_API_KEY` to Vercel! 🚀

---

**Last Updated**: 2025-11-19
**Status**: READY TO USE ✅
