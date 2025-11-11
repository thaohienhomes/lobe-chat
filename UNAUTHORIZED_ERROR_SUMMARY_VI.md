# Tóm Tắt: Lỗi UNAUTHORIZED Khi Gửi Tin Nhắn

## 🔴 Vấn Đề

Khi người dùng chưa đăng nhập cố gắng gửi tin nhắn, họ nhận được lỗi:
**"Message sending failed, please check your network and try again: UNAUTHORIZED"**

---

## ✅ Câu Trả Lời Cho 4 Câu Hỏi

### 1️⃣ Lỗi Này Có Liên Quan Đến Xác Thực Không?

**Trả Lời: CÓ, 100% liên quan đến xác thực**

- Lỗi được ném từ middleware `userAuth` khi không tìm thấy `userId`
- Middleware kiểm tra: `if (!ctx.userId) throw TRPCError('UNAUTHORIZED')`
- Đây là cơ chế bảo mật để đảm bảo chỉ người dùng đã xác thực mới có thể gửi tin nhắn

---

### 2️⃣ Đây Là Hành Vi Mong Đợi Không?

**Trả Lời: CÓ, đây là hành vi chính xác và cần thiết**

**Tại Sao:**
- ✅ **Bảo Mật** - Ngăn chặn truy cập trái phép
- ✅ **Quản Lý Dữ Liệu** - Cần biết `userId` để lưu tin nhắn
- ✅ **Theo Dõi Sử Dụng** - Cần xác định người dùng để kiểm soát hạn mức

**Vấn Đề:** Thông báo lỗi không rõ ràng - người dùng sẽ nghĩ là lỗi mạng

---

### 3️⃣ Nên Cải Thiện Thông Báo Lỗi Như Thế Nào?

**Giải Pháp:**

1. **Thêm Xử Lý Lỗi Cụ Thể**
   - Thêm case cho `ChatErrorType.InvalidClerkUser` trong error handler
   - Hiển thị component `ClerkLogin` với nút "Đăng Nhập"

2. **Cải Thiện Thông Báo**
   - Thêm dịch tiếng Việt: "Vui lòng đăng nhập để gửi tin nhắn"
   - Thay vì: "Message sending failed, please check your network..."

3. **Tối Ưu UX**
   - Vô hiệu hóa nút gửi nếu chưa đăng nhập
   - Hiển thị cảnh báo trước khi gửi
   - Cung cấp nút "Đăng Nhập" trực tiếp

---

### 4️⃣ Nên Sửa Như Thế Nào?

**Hành Động Cần Làm:**

#### 🔴 CRITICAL (Phải Làm)
```typescript
// File: src/features/Conversation/Error/index.tsx
case ChatErrorType.InvalidClerkUser: {
  return <ClerkLogin id={data.id} />;
}
```

#### 🟠 HIGH (Nên Làm)
```json
// File: locales/vi-VN/error.json
{
  "response": {
    "InvalidClerkUser": "Vui lòng đăng nhập để gửi tin nhắn"
  }
}
```

#### 🟡 MEDIUM (Có Thể Làm)
- Vô hiệu hóa nút gửi khi chưa đăng nhập
- Hiển thị cảnh báo trước khi gửi
- Cải thiện component ClerkLogin

---

## 📍 Vị Trí Cần Kiểm Tra

### Middleware Xác Thực
- `src/libs/trpc/middleware/userAuth.ts` - Kiểm tra userId
- `src/app/(backend)/middleware/auth/utils.ts` - Kiểm tra Clerk auth

### Xử Lý Lỗi
- `src/features/Conversation/Error/index.tsx` - Hiển thị lỗi
- `src/features/Conversation/Error/ClerkLogin/index.tsx` - Component đăng nhập

### Gửi Tin Nhắn
- `src/store/chat/slices/message/action.ts` - Tạo tin nhắn
- `src/server/routers/lambda/message.ts` - API tạo tin nhắn

### Dịch Lỗi
- `src/locales/default/error.ts` - Tiếng Việt mặc định
- `locales/vi-VN/error.json` - Tiếng Việt (cần tạo)

---

## 🔄 Luồng Xác Thực Hiện Tại

```
1. Người dùng gửi tin nhắn
   ↓
2. Middleware kiểm tra userId
   ↓
3. Nếu không có userId → Ném lỗi UNAUTHORIZED
   ↓
4. Lỗi được bắt và hiển thị
   ↓
5. Người dùng thấy thông báo lỗi mơ hồ
```

---

## 🎯 Luồng Xác Thực Mong Muốn

```
1. Người dùng chưa đăng nhập
   ↓
2. Nút gửi bị vô hiệu hóa + Cảnh báo "Vui lòng đăng nhập"
   ↓
3. Người dùng nhấp "Đăng Nhập"
   ↓
4. Chuyển hướng đến /login
   ↓
5. Đăng nhập thành công
   ↓
6. Quay lại chat
   ↓
7. Gửi tin nhắn thành công
```

---

## 📊 Bảng Tóm Tắt

| Câu Hỏi | Trả Lời | Giải Thích |
|---------|--------|-----------|
| Liên Quan Đến Xác Thực? | ✅ CÓ | Middleware kiểm tra userId |
| Hành Vi Mong Đợi? | ✅ CÓ | Cơ chế bảo mật cần thiết |
| Cần Cải Thiện? | ✅ CÓ | Thông báo lỗi không rõ ràng |
| Có Thể Sửa? | ✅ CÓ | Thêm xử lý lỗi cụ thể |

---

## 🚀 Bước Tiếp Theo

1. ✅ Thêm case `InvalidClerkUser` trong error handler
2. ✅ Tạo file `locales/vi-VN/error.json` với thông báo tiếng Việt
3. ✅ Vô hiệu hóa nút gửi khi chưa đăng nhập
4. ✅ Kiểm tra lại quy trình xác thực
5. ✅ Cập nhật tài liệu

---

## 📚 Tài Liệu Liên Quan

1. **UNAUTHORIZED_ERROR_ANALYSIS_VI.md** - Phân tích chi tiết
2. **UNAUTHORIZED_ERROR_TECHNICAL_DETAILS_VI.md** - Chi tiết kỹ thuật
3. **UNAUTHORIZED_ERROR_RECOMMENDATIONS_VI.md** - Khuyến nghị và hành động

---

## ✨ Kết Luận

- **Lỗi UNAUTHORIZED là bình thường** khi người dùng chưa đăng nhập
- **Đây là cơ chế bảo mật cần thiết** để bảo vệ dữ liệu
- **Thông báo lỗi cần cải thiện** để rõ ràng hơn
- **Component ClerkLogin đã tồn tại** và sẵn sàng sử dụng
- **Có thể sửa dễ dàng** bằng cách thêm xử lý lỗi cụ thể

---

**Tác Giả:** Augment Agent  
**Ngày:** 2025-11-07  
**Ngôn Ngữ:** Tiếng Việt

