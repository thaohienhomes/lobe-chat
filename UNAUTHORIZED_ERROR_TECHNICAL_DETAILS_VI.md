# Chi Tiết Kỹ Thuật: Lỗi UNAUTHORIZED

## 🔍 Luồng Lỗi Chi Tiết

### 1. Gửi Tin Nhắn

**File:** `src/store/chat/slices/aiChat/actions/generateAIChat.ts`

```typescript
sendMessage: async ({ message, files, onlyAddUserMessage }) => {
  // Gửi tin nhắn đến server
  return sendMessageInServer({ message, files, onlyAddUserMessage });
}
```

### 2. Gọi API

**File:** `src/services/aiChat.ts`

```typescript
sendMessageInServer = async (params, abortController) => {
  return lambdaClient.aiChat.sendMessageInServer.mutate(params, {
    context: { showNotification: false },
    signal: abortController?.signal,
  });
}
```

### 3. Middleware Xác Thực

**File:** `src/libs/trpc/middleware/userAuth.ts`

```typescript
export const userAuth = trpc.middleware(async (opts) => {
  const { ctx } = opts;
  
  // Kiểm tra userId
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  return opts.next({ ctx: { userId: ctx.userId } });
});
```

### 4. Xử Lý Lỗi

**File:** `src/store/chat/slices/message/action.ts`

```typescript
internal_createMessage: async (params, context) => {
  try {
    const id = await messageService.createMessage(message);
    return id;
  } catch (e) {
    // Lỗi được bắt ở đây
    internal_dispatchMessage({
      id: tempId,
      type: 'updateMessage',
      value: {
        error: { 
          type: ChatErrorType.CreateMessageError, 
          message: (e as Error).message, 
          body: e 
        },
      },
    });
  }
}
```

### 5. Hiển Thị Lỗi

**File:** `src/features/Conversation/Error/index.tsx`

```typescript
const ErrorMessageExtra = memo<{ data: ChatMessage }>(({ data }) => {
  const error = data.error as ChatMessageError;
  
  switch (error.type) {
    case ChatErrorType.InvalidClerkUser: {
      return <ClerkLogin id={data.id} />;
    }
    // ... các case khác
  }
});
```

---

## 🎯 Các Điểm Kiểm Tra Xác Thực

### Điểm 1: Middleware TRPC

**File:** `src/libs/trpc/middleware/userAuth.ts`

```typescript
if (!ctx.userId) {
  throw new TRPCError({ code: 'UNAUTHORIZED' });
}
```

**Khi nào được gọi:** Mỗi khi gọi API qua TRPC

**Lỗi được ném:** `TRPCError` với code `UNAUTHORIZED`

### Điểm 2: Middleware Backend

**File:** `src/app/(backend)/middleware/auth/index.ts`

```typescript
if (!authorization) {
  throw AgentRuntimeError.createError(ChatErrorType.Unauthorized);
}
```

**Khi nào được gọi:** Khi gọi API backend (chat, text-to-image, v.v.)

**Lỗi được ném:** `ChatErrorType.Unauthorized` (HTTP 401)

### Điểm 3: Kiểm Tra Clerk Auth

**File:** `src/app/(backend)/middleware/auth/utils.ts`

```typescript
if (AUTH_CONFIG.clerk.enabled) {
  if (!(clerkAuth as any)?.userId) {
    throw AgentRuntimeError.createError(ChatErrorType.InvalidClerkUser);
  }
}
```

**Khi nào được gọi:** Khi Clerk được bật

**Lỗi được ném:** `ChatErrorType.InvalidClerkUser`

---

## 📝 Định Nghĩa Error Types

**File:** `packages/types/src/fetch.ts`

```typescript
export const ChatErrorType = {
  InvalidClerkUser: 'InvalidClerkUser',  // Người dùng Clerk không hợp lệ
  Unauthorized: 401,                      // HTTP 401 - Chưa xác thực
  // ...
}
```

---

## 🌐 Thông Báo Lỗi Dịch

**File:** `locales/en-US/error.json`

```json
{
  "response": {
    "InvalidClerkUser": "Sorry, you are not currently logged in. Please log in or register an account to continue.",
    "401": "Unauthorized"
  }
}
```

**File:** `locales/zh-CN/error.json`

```json
{
  "response": {
    "InvalidClerkUser": "抱歉，您当前未登录。请登录或注册账户以继续。"
  }
}
```

---

## 🔐 Quy Trình Xác Thực Clerk

1. **Yêu cầu đến server**
   - Client gửi request với Clerk token

2. **Middleware kiểm tra**
   - Lấy Clerk auth từ request headers
   - Kiểm tra `clerkAuth.userId`

3. **Nếu không có userId**
   - Ném `ChatErrorType.InvalidClerkUser`
   - Trả về HTTP 401

4. **Client nhận lỗi**
   - Hiển thị component `ClerkLogin`
   - Cung cấp nút "Đăng Nhập"

---

## 💡 Cách Khắc Phục

### Giải Pháp 1: Kiểm Tra Trước Khi Gửi

```typescript
const handleSend = async () => {
  const isLoginWithAuth = useUserStore(authSelectors.isLoginWithAuth);
  
  if (!isLoginWithAuth) {
    notification.warning({
      message: 'Vui lòng đăng nhập',
      description: 'Bạn cần đăng nhập để gửi tin nhắn',
    });
    return;
  }
  
  sendMessage({ message: inputMessage });
}
```

### Giải Pháp 2: Vô Hiệu Hóa Nút Gửi

```typescript
<Button 
  disabled={!isLoginWithAuth}
  onClick={handleSend}
>
  Gửi
</Button>
```

### Giải Pháp 3: Hiển Thị Thông Báo Tốt Hơn

Cập nhật `locales/vi-VN/error.json`:

```json
{
  "response": {
    "InvalidClerkUser": "Vui lòng đăng nhập để gửi tin nhắn"
  }
}
```

---

## 📊 Bảng So Sánh Error Types

| Error Type | HTTP Code | Nguyên Nhân | Giải Pháp |
|-----------|-----------|-----------|----------|
| InvalidClerkUser | 401 | Chưa đăng nhập | Đăng nhập |
| Unauthorized | 401 | Thiếu token | Cấp token |
| InvalidAccessCode | 401 | Mã truy cập sai | Nhập mã đúng |
| CreateMessageError | 500 | Lỗi tạo tin nhắn | Thử lại |

---

## ✅ Kết Luận

- **UNAUTHORIZED là bình thường** khi người dùng chưa đăng nhập
- **Cần cải thiện UX** bằng cách vô hiệu hóa nút hoặc hiển thị thông báo rõ ràng
- **Component ClerkLogin đã tồn tại** và sẵn sàng sử dụng
- **Thông báo lỗi cần dịch** sang tiếng Việt rõ ràng

