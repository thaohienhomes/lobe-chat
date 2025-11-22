# ⚡ Quick Start: Update AI Models - pho.chat

## 🎯 **TL;DR**

pho.chat **TỰ ĐỘNG** fetch models mới nhất từ OpenRouter, OpenAI, Anthropic, Google, etc.

**Không cần làm gì!** Nhưng nếu muốn update manual:

```
Settings → Language Model → [Provider] → Click "🔄 Fetch Models"
```

---

## 📱 **Step-by-Step Guide**

### **Bước 1: Mở Settings**

1. Click vào **Settings icon** (⚙️) ở góc trái màn hình
2. Hoặc nhấn phím tắt: `Ctrl + ,` (Windows) hoặc `Cmd + ,` (Mac)

### **Bước 2: Chọn Language Model**

1. Trong sidebar, click **"Language Model"**
2. Hoặc scroll xuống section "Language Model"

### **Bước 3: Chọn Provider**

1. Tìm provider muốn update (e.g., **OpenRouter**)
2. Click vào provider để expand

### **Bước 4: Fetch Models**

1. Click nút **"🔄 Fetch Models"**
2. Đợi 2-5 giây (icon sẽ spin)
3. Xong! Models mới đã được load

### **Bước 5: Verify**

1. Check **"Total: X models"** - số lượng models
2. Check **"Latest Fetch Time"** - thời gian fetch cuối
3. Scroll xuống xem models mới

---

## 🎬 **Visual Guide**

```
┌─────────────────────────────────────────────────────────┐
│ Settings                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Language Model                                  │   │
│ │                                                 │   │
│ │ ┌─────────────────────────────────────────────┐ │   │
│ │ │ OpenRouter                              ▼   │ │   │
│ │ ├─────────────────────────────────────────────┤ │   │
│ │ │ Total: 245 models                           │ │   │
│ │ │ Latest: 2025-11-19 10:30:00                 │ │   │
│ │ │                                             │ │   │
│ │ │ [🔄 Fetch Models] [❌ Clear] [+ Add]       │ │   │
│ │ └─────────────────────────────────────────────┘ │   │
│ │                                                 │   │
│ │ ┌─────────────────────────────────────────────┐ │   │
│ │ │ ✅ openai/gpt-4o-mini                       │ │   │
│ │ │ ✅ anthropic/claude-3-5-sonnet              │ │   │
│ │ │ ✅ google/gemini-pro-1.5                    │ │   │
│ │ │ ✅ meta-llama/llama-3.3-70b-instruct        │ │   │
│ │ │ ... (241 more models)                       │ │   │
│ │ └─────────────────────────────────────────────┘ │   │
│ └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔥 **Pro Tips**

### **Tip 1: Weekly Updates**

Set reminder để fetch models **mỗi thứ 2** để có models mới nhất.

### **Tip 2: Clear Cache**

Nếu thấy models lỗi thời:

1. Click **"❌ Clear"** để xóa cache
2. Click **"🔄 Fetch Models"** để fetch lại

### **Tip 3: Check Model Count**

- OpenRouter thường có **200-300 models**
- Nếu chỉ thấy 10-20 models → cần fetch lại

### **Tip 4: Monitor New Releases**

Follow OpenRouter updates:

- Blog: <https://openrouter.ai/blog>
- Twitter: @OpenRouterAI
- Discord: <https://discord.gg/openrouter>

---

## 🎯 **What Gets Updated?**

Khi fetch models, pho.chat sẽ update:

✅ **Model List** - Tất cả models mới từ provider
✅ **Model Names** - Display names và IDs
✅ **Pricing** - Input/output token prices
✅ **Context Window** - Max tokens per request
✅ **Capabilities** - Vision, function calling, reasoning
✅ **Release Date** - Khi model được release

---

## 📊 **Example: OpenRouter Models**

Sau khi fetch, anh sẽ thấy:

```
✅ openai/gpt-4o-mini              ($0.15/$0.60 per 1M tokens)
✅ openai/gpt-4o                   ($2.50/$10.00 per 1M tokens)
✅ anthropic/claude-3-5-sonnet     ($3.00/$15.00 per 1M tokens)
✅ google/gemini-pro-1.5           ($1.25/$5.00 per 1M tokens)
✅ meta-llama/llama-3.3-70b        ($0.35/$0.40 per 1M tokens)
✅ deepseek/deepseek-r1            ($0.55/$2.19 per 1M tokens)
... và 239 models khác
```

---

## 🚨 **Common Issues**

### **Issue 1: "Fetch Models" button không hiện**

**Cause**: Provider không support model fetching

**Solution**:

- OpenRouter, OpenAI, Anthropic, Google **ĐỀU SUPPORT**
- Nếu không thấy button → check provider config

### **Issue 2: Fetch bị lỗi**

**Error**: "Failed to fetch models"

**Solutions**:

1. Check API key: Settings → \[Provider] → API Key
2. Check internet connection
3. Try again sau 5 phút
4. Check provider status page

### **Issue 3: Models không update**

**Cause**: Cache chưa clear

**Solution**:

1. Click "❌ Clear" button
2. Refresh browser (F5)
3. Fetch lại

---

## 🎊 **Success Indicators**

Sau khi fetch thành công, anh sẽ thấy:

✅ **Total models tăng** (e.g., 200 → 245)
✅ **Latest Fetch Time updated** (e.g., "2025-11-19 10:30:00")
✅ **New models xuất hiện** trong list
✅ **Pricing updated** (nếu có thay đổi)

---

## 📞 **Need Help?**

Nếu gặp vấn đề:

1. **Check logs**: Browser Console (F12)
2. **Check Sentry**: <https://sentry.io/organizations/pho-chat>
3. **Check provider status**:
   - OpenRouter: <https://status.openrouter.ai>
   - OpenAI: <https://status.openai.com>
   - Anthropic: <https://status.anthropic.com>

---

## 🎯 **Summary**

| Action               | Frequency | Time       |
| -------------------- | --------- | ---------- |
| **Fetch Models**     | 1x/week   | 5 seconds  |
| **Clear Cache**      | As needed | 1 second   |
| **Add Custom Model** | As needed | 30 seconds |

**Total Time**: < 1 minute/week để có models mới nhất! 🚀

---

**Last Updated**: 2025-11-19
**Status**: READY TO USE ✅
