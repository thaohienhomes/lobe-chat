# Phân Tích Lỗi UNAUTHORIZED Khi Gửi Tin Nhắn

## 📋 Tóm Tắt Vấn Đề

Khi người dùng chưa đăng nhập cố gắng gửi tin nhắn trong pho.chat, họ nhận được lỗi:
**"Message sending failed, please check your network and try again: UNAUTHORIZED"**

---

## ✅ Câu Hỏi 1: Lỗi Này Có Liên Quan Đến Xác Thực Không?

**Trả lời: CÓ, hoàn toàn liên quan đến xác thực.**

### Nguyên Nhân Gốc Rễ

Lỗi UNAUTHORIZED được ném ra từ middleware xác thực khi:

1. **Người dùng chưa đăng nhập** - Không có `userId` trong context
2. **Thiếu Authorization Header** - Không có token xác thực trong request
3. **Clerk Auth không hợp lệ** - Người dùng không có `clerkAuth.userId`

### Vị Trí Xác Thực Bị Kiểm Tra

**File:** `src/libs/trpc/middleware/userAuth.ts` (dòng 19-25)

```typescript
if (!ctx.userId) {
  if (enableClerk) {
    console.log('clerk auth:', ctx.clerkAuth);
  }
  throw new TRPCError({ code: 'UNAUTHORIZED' });
}
```

**File:** `src/app/(backend)/middleware/auth/utils.ts` (dòng 29-32)

```typescript
if (AUTH_CONFIG.clerk.enabled) {
  if (!(clerkAuth as any)?.userId)
    throw AgentRuntimeError.createError(ChatErrorType.InvalidClerkUser);
}
```

---

## ✅ Câu Hỏi 2: Đây Là Hành Vi Mong Đợi Không?

**Trả lời: CÓ, đây là hành vi mong đợi và chính xác.**

### Tại Sao Điều Này Là Cần Thiết?

1. **Bảo Mật** - Chỉ người dùng đã xác thực mới có thể gửi tin nhắn
2. **Quản Lý Dữ Liệu** - Cần biết `userId` để lưu tin nhắn vào database
3. **Theo Dõi Sử Dụng** - Cần xác định người dùng để theo dõi hạn mức sử dụng

### Quy Trình Xác Thực Tin Nhắn

```
1. Người dùng gửi tin nhắn
   ↓
2. Middleware kiểm tra userId
   ↓
3. Nếu không có userId → Ném lỗi UNAUTHORIZED
   ↓
4. Nếu có userId → Cho phép gửi tin nhắn
```

---

## ✅ Câu Hỏi 3: Nên Cải Thiện Thông Báo Lỗi Như Thế Nào?

**Hiện Tại:** "Message sending failed, please check your network and try again: UNAUTHORIZED"

**Vấn Đề:** Thông báo này không rõ ràng - người dùng sẽ nghĩ là lỗi mạng, không phải xác thực.

### Giải Pháp Đề Xuất

**1. Thêm Xử Lý Lỗi Cụ Thể**

Thêm case cho `ChatErrorType.InvalidClerkUser` trong error handler:

**File:** `src/features/Conversation/Error/index.tsx`

```typescript
case ChatErrorType.InvalidClerkUser: {
  return <ClerkLogin id={data.id} />;
}
```

**2. Thêm Thông Báo Lỗi Rõ Ràng**

**File:** `locales/default/error.ts`

```typescript
response: {
  InvalidClerkUser: 'Vui lòng đăng nhập để gửi tin nhắn',
  Unauthorized: 'Yêu cầu xác thực. Vui lòng đăng nhập.',
}
```

**3. Hiển Thị Nút "Đăng Nhập"**

Khi lỗi `InvalidClerkUser` xảy ra, hiển thị component `ClerkLogin` với nút đăng nhập.

---

## 📍 Vị Trí Cần Kiểm Tra Trong Codebase

### 1. **Middleware Xác Thực**
- `src/libs/trpc/middleware/userAuth.ts` - Kiểm tra userId
- `src/app/(backend)/middleware/auth/utils.ts` - Kiểm tra Clerk auth
- `src/app/(backend)/middleware/auth/index.ts` - Xử lý authorization header

### 2. **Xử Lý Lỗi**
- `src/features/Conversation/Error/index.tsx` - Hiển thị lỗi
- `src/features/Conversation/Error/ClerkLogin/index.tsx` - Component đăng nhập
- `packages/types/src/fetch.ts` - Định nghĩa error types

### 3. **Gửi Tin Nhắn**
- `src/store/chat/slices/message/action.ts` - Tạo tin nhắn
- `src/server/routers/lambda/message.ts` - API tạo tin nhắn
- `src/services/message/server.ts` - Service gửi tin nhắn

### 4. **Dịch Lỗi**
- `src/locales/default/error.ts` - Tiếng Việt mặc định
- `locales/vi-VN/error.json` - Tiếng Việt (nếu có)
- `locales/en-US/error.json` - Tiếng Anh

---

## 🔧 Cách Sửa Lỗi

### Bước 1: Xác Nhận Người Dùng Đã Đăng Nhập

Trước khi gửi tin nhắn, kiểm tra:

```typescript
const isLoginWithAuth = useUserStore(authSelectors.isLoginWithAuth);
if (!isLoginWithAuth) {
  // Hiển thị thông báo hoặc chuyển hướng đến /login
  return;
}
```

### Bước 2: Thêm Xử Lý Lỗi Tốt Hơn

Khi nhận lỗi `InvalidClerkUser`, hiển thị component `ClerkLogin` thay vì thông báo lỗi chung chung.

### Bước 3: Cải Thiện UX

- Vô hiệu hóa nút gửi nếu chưa đăng nhập
- Hiển thị thông báo "Vui lòng đăng nhập để tiếp tục"
- Cung cấp nút "Đăng Nhập" trực tiếp

---

## 📊 Quy Trình Xác Thực Hiện Tại

```
Người dùng chưa đăng nhập
        ↓
Cố gắng gửi tin nhắn
        ↓
Middleware kiểm tra userId
        ↓
Không tìm thấy userId
        ↓
Ném lỗi: ChatErrorType.InvalidClerkUser
        ↓
Hiển thị component ClerkLogin
        ↓
Người dùng nhấp "Đăng Nhập"
        ↓
Chuyển hướng đến /login
        ↓
Đăng nhập thành công
        ↓
Quay lại chat
        ↓
Gửi tin nhắn thành công
```

---

## ✨ Kết Luận

1. **Lỗi UNAUTHORIZED là bình thường** - Đây là cơ chế bảo mật cần thiết
2. **Thông báo lỗi cần cải thiện** - Nên rõ ràng hơn về yêu cầu đăng nhập
3. **UX cần tối ưu** - Nên vô hiệu hóa nút gửi hoặc hiển thị thông báo trước khi gửi
4. **Component ClerkLogin đã tồn tại** - Chỉ cần sử dụng nó đúng cách

---

## 🎯 Hành Động Tiếp Theo

1. ✅ Xác nhận người dùng đã đăng nhập trước khi gửi
2. ✅ Cải thiện thông báo lỗi trong locales
3. ✅ Vô hiệu hóa nút gửi nếu chưa đăng nhập
4. ✅ Hiển thị component ClerkLogin khi lỗi xảy ra

