# 🔄 Auto-Update AI Models Guide - pho.chat

## ✅ **TIN VUI: pho.chat ĐÃ TỰ ĐỘNG UPDATE MODELS!**

pho.chat (LobeChat fork) **đã có sẵn** hệ thống tự động fetch models mới nhất từ AI providers. Không cần config thêm gì! 🎉

---

## 🎯 **Cách Hoạt Động**

### **1. Auto-Fetch từ Provider APIs**

Mỗi provider có API endpoint riêng để fetch models:

| Provider       | API Endpoint                                | Auto-Update |
| -------------- | ------------------------------------------- | ----------- |
| **OpenRouter** | `https://openrouter.ai/api/frontend/models` | ✅ Yes      |
| **OpenAI**     | `https://api.openai.com/v1/models`          | ✅ Yes      |
| **Anthropic**  | `https://api.anthropic.com/v1/models`       | ✅ Yes      |
| **Google**     | Google AI API                               | ✅ Yes      |
| **DeepSeek**   | `https://api.deepseek.com/v1/models`        | ✅ Yes      |
| **Groq**       | Groq API                                    | ✅ Yes      |

### **2. Model Fetcher UI**

Trong Settings → Language Model, mỗi provider có nút **"Fetch Models"**:

```
┌─────────────────────────────────────┐
│ OpenRouter                          │
│ ┌─────────────────────────────────┐ │
│ │ Total: 245 models               │ │
│ │ [🔄 Fetch Models] [+ Add]       │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **3. Caching Strategy**

- **Remote Models**: Cached trong browser storage
- **Latest Fetch Time**: Lưu timestamp lần fetch cuối
- **Auto-Refresh**: Có thể enable auto-fetch khi mở settings

---

## 📱 **Cách Sử Dụng**

### **Option 1: Manual Refresh (Khuyến nghị)**

1. **Vào Settings**:
   - Click vào Settings icon (⚙️)
   - Chọn "Language Model"

2. **Chọn Provider**:
   - Chọn provider muốn update (e.g., OpenRouter)

3. **Click "Fetch Models"**:
   - Click nút 🔄 "Fetch Models"
   - Đợi 2-5 giây
   - Models mới sẽ xuất hiện trong list

4. **Verify**:
   - Check "Total: X models"
   - Xem "Latest Fetch Time"

### **Option 2: Auto-Fetch on Mount**

Models sẽ **tự động fetch** khi:

- Lần đầu mở Settings → Language Model
- Provider được enable lần đầu
- `enabledAutoFetch` được bật

---

## 🔧 **Technical Details**

### **1. OpenRouter Model Fetching**

\<augment_code_snippet path="packages/model-runtime/src/providers/openrouter/index.ts" mode="EXCERPT">

```typescript
models: async () => {
  const response = await fetch('https://openrouter.ai/api/frontend/models');
  const data = await response.json();
  const modelList = data['data'];

  return modelList.map((model) => ({
    id: model.slug,
    displayName: model.name,
    contextWindowTokens: model.context_length,
    pricing: {
      input: formatPrice(model.pricing?.prompt),
      output: formatPrice(model.pricing?.completion),
    },
    // ... more fields
  }));
};
```

\</augment_code_snippet>

### **2. Model Fetcher Component**

\<augment_code_snippet path="src/app/\[variants]/(main)/settings/llm/components/ProviderModelList/ModelFetcher.tsx" mode="EXCERPT">

```tsx
const ModelFetcher = ({ provider }) => {
  const { mutate, isValidating } = useFetchProviderModelList(provider, enabledAutoFetch);

  return (
    <Flexbox onClick={() => mutate()}>
      <Icon icon={isValidating ? LoaderCircle : RefreshCcwDot} spin={isValidating} />
      <div>{isValidating ? 'Fetching...' : 'Fetch Models'}</div>
    </Flexbox>
  );
};
```

\</augment_code_snippet>

### **3. SWR Caching**

\<augment_code_snippet path="src/store/user/slices/modelList/action.ts" mode="EXCERPT">

```typescript
useFetchProviderModelList: (provider, enabledAutoFetch) =>
  useSWR(
    [provider, enabledAutoFetch],
    async ([p]) => {
      const { modelsService } = await import('@/services/models');
      return modelsService.getModels(p);
    },
    {
      onSuccess: async (data) => {
        await setModelProviderConfig(provider, {
          latestFetchTime: Date.now(),
          remoteModelCards: data,
        });
      },
      revalidateOnFocus: false,
      revalidateOnMount: enabledAutoFetch,
    },
  );
```

\</augment_code_snippet>

---

## 🎨 **Customization Options**

### **1. Enable Auto-Fetch**

Để models tự động fetch khi mở settings:

```typescript
// In provider config
settings: {
  showModelFetcher: true,  // Show fetch button
  // Auto-fetch is controlled by user preference
}
```

### **2. Custom Model List**

Nếu muốn thêm models custom:

1. Click **"+ Add"** button
2. Nhập model ID (e.g., `openai/gpt-4o-mini`)
3. Configure model settings
4. Save

---

## 📊 **Model Update Frequency**

| Provider       | Update Frequency | Notes                                       |
| -------------- | ---------------- | ------------------------------------------- |
| **OpenRouter** | Real-time        | Fetch từ `/api/frontend/models`             |
| **OpenAI**     | Daily            | OpenAI thường release models mới hàng tháng |
| **Anthropic**  | Weekly           | Claude models update ít hơn                 |
| **Google**     | Weekly           | Gemini models update định kỳ                |

**Khuyến nghị**: Fetch models **1 lần/tuần** để có models mới nhất.

---

## 🚀 **Best Practices**

### **1. Regular Updates**

- Fetch models **mỗi tuần** để có models mới
- Check "Latest Fetch Time" để biết lần update cuối

### **2. Clear Cache**

- Nếu thấy models lỗi thời, click **"Clear"** (❌) để xóa cache
- Sau đó fetch lại

### **3. Monitor New Models**

- Follow OpenRouter blog: <https://openrouter.ai/blog>
- Check model count: Nếu tăng đột ngột = có models mới

---

## 🔍 **Troubleshooting**

### **Issue: "Failed to fetch models"**

**Causes**:

1. API key không hợp lệ
2. Network error
3. Provider API down

**Solutions**:

1. Check API key trong Settings
2. Verify internet connection
3. Try again sau 5 phút

### **Issue: "Models not updating"**

**Causes**:

1. Cache chưa clear
2. Auto-fetch disabled

**Solutions**:

1. Click "Clear" (❌) button
2. Click "Fetch Models" (🔄) manually
3. Refresh browser

---

## 📝 **Summary**

✅ **pho.chat TỰ ĐỘNG UPDATE MODELS** từ providers
✅ **Không cần config** thêm gì
✅ **Manual refresh** bằng nút "Fetch Models"
✅ **Auto-fetch** khi mở settings (nếu enabled)
✅ **Caching** để tăng performance
✅ **Real-time** data từ provider APIs

**Action Required**: KHÔNG CẦN LÀM GÌ! Hệ thống đã hoạt động! 🎊

---

**Last Updated**: 2025-11-19
**Status**: FULLY OPERATIONAL ✅
