# 🔍 Phân Tích Nguyên Nhân Gốc: Lỗi UNAUTHORIZED Không Hiển Thị ClerkLogin

## 🎯 Vấn Đề Chính

**Thông báo lỗi vẫn hiển thị:** "Message sending failed, please check your network and try again: UNAUTHORIZED"

**Thay vì hiển thị:** Component `ClerkLogin` với thông báo tiếng Việt

---

## 🔴 Nguyên Nhân Gốc Rễ

### Luồng Xử Lý Lỗi Hiện Tại (SAI)

```
1. Middleware TRPC ném: TRPCError({ code: 'UNAUTHORIZED' })
   ↓
2. TRPC Client nhận lỗi
   ↓
3. errorHandlingLink bắt lỗi (dòng 19-42 trong lambda.ts)
   ↓
4. Kiểm tra status === 401
   ↓
5. Gọi loginRequired.redirect() (chuyển hướng đến /login)
   ↓
6. Hiển thị notification: "Sẽ tự động chuyển hướng đến trang đăng nhập"
   ↓
7. Lỗi vẫn được truyền đến catch block
   ↓
8. Catch block bắt lỗi và tạo ChatErrorType.CreateMessageError
   ↓
9. Hiển thị thông báo lỗi chung chung: "Message sending failed..."
```

### Vấn Đề Chi Tiết

**File:** `src/libs/trpc/client/lambda.ts` (dòng 30-34)

```typescript
switch (status) {
  case 401: {
    loginRequired.redirect();  // ← Chỉ hiển thị notification
    break;
  }
  // ...
}

observer.error(err);  // ← Lỗi vẫn được truyền đi
```

**Kết Quả:**
1. ✅ Notification được hiển thị (chuyển hướng đến /login)
2. ❌ Lỗi vẫn được truyền đến catch block
3. ❌ Catch block tạo `ChatErrorType.CreateMessageError` thay vì `ChatErrorType.InvalidClerkUser`
4. ❌ Component `ClerkLogin` không được hiển thị

---

## 📊 So Sánh: Luồng Mong Muốn vs Hiện Tại

### Luồng Mong Muốn (ĐÚNG)

```
1. Middleware TRPC ném: TRPCError({ code: 'UNAUTHORIZED' })
   ↓
2. TRPC Client nhận lỗi
   ↓
3. Catch block bắt lỗi
   ↓
4. Kiểm tra lỗi là 401 (UNAUTHORIZED)
   ↓
5. Tạo ChatErrorType.InvalidClerkUser
   ↓
6. Hiển thị component ClerkLogin
   ↓
7. Thông báo: "Xin lỗi, bạn chưa đăng nhập..."
   ↓
8. Nút "Đăng Nhập" có thể nhấp
```

### Luồng Hiện Tại (SAI)

```
1. Middleware TRPC ném: TRPCError({ code: 'UNAUTHORIZED' })
   ↓
2. TRPC Client nhận lỗi
   ↓
3. errorHandlingLink bắt lỗi
   ↓
4. Hiển thị notification chuyển hướng
   ↓
5. Lỗi vẫn được truyền đi
   ↓
6. Catch block bắt lỗi
   ↓
7. Tạo ChatErrorType.CreateMessageError (SAI!)
   ↓
8. Hiển thị thông báo chung chung
   ↓
9. Component ClerkLogin không được hiển thị
```

---

## 🔧 Giải Pháp

### Cách 1: Sửa errorHandlingLink (RECOMMENDED)

**File:** `src/libs/trpc/client/lambda.ts`

**Hiện Tại:**
```typescript
switch (status) {
  case 401: {
    loginRequired.redirect();
    break;
  }
  default: {
    fetchErrorNotification.error({ errorMessage: err.message, status });
  }
}

observer.error(err);  // ← Lỗi vẫn được truyền
```

**Sửa Thành:**
```typescript
switch (status) {
  case 401: {
    // Không hiển thị notification ở đây
    // Để catch block xử lý và hiển thị ClerkLogin
    break;
  }
  default: {
    fetchErrorNotification.error({ errorMessage: err.message, status });
  }
}

observer.error(err);
```

### Cách 2: Sửa Catch Block

**File:** `src/store/chat/slices/message/action.ts` (dòng 395-404)

**Hiện Tại:**
```typescript
catch (e) {
  internal_toggleMessageLoading(false, tempId);
  internal_dispatchMessage({
    id: tempId,
    type: 'updateMessage',
    value: {
      error: { 
        type: ChatErrorType.CreateMessageError,  // ← SAI!
        message: (e as Error).message, 
        body: e 
      },
    },
  });
}
```

**Sửa Thành:**
```typescript
catch (e) {
  internal_toggleMessageLoading(false, tempId);
  
  // Kiểm tra nếu lỗi là 401 UNAUTHORIZED
  const isUnauthorized = (e as any)?.data?.httpStatus === 401 || 
                         (e as any)?.code === 'UNAUTHORIZED';
  
  const errorType = isUnauthorized 
    ? ChatErrorType.InvalidClerkUser 
    : ChatErrorType.CreateMessageError;
  
  internal_dispatchMessage({
    id: tempId,
    type: 'updateMessage',
    value: {
      error: { 
        type: errorType,  // ← ĐÚNG!
        message: (e as Error).message, 
        body: e 
      },
    },
  });
}
```

---

## 🎯 Khuyến Nghị

### Giải Pháp Tốt Nhất

**Kết hợp cả 2 cách:**

1. **Sửa errorHandlingLink** - Không hiển thị notification 401 ở đây
2. **Sửa Catch Block** - Kiểm tra lỗi 401 và tạo `ChatErrorType.InvalidClerkUser`

**Lợi Ích:**
- ✅ Component `ClerkLogin` được hiển thị
- ✅ Thông báo tiếng Việt được hiển thị
- ✅ Nút "Đăng Nhập" có thể nhấp
- ✅ UX tốt hơn

---

## 📋 Tóm Tắt

| Vấn Đề | Nguyên Nhân | Giải Pháp |
|--------|-----------|----------|
| Notification chuyển hướng hiển thị | errorHandlingLink bắt lỗi 401 | Xóa case 401 hoặc không hiển thị notification |
| Lỗi vẫn được truyền | observer.error(err) vẫn được gọi | Không cần thay đổi |
| CreateMessageError được tạo | Catch block không kiểm tra lỗi 401 | Thêm kiểm tra lỗi 401 |
| ClerkLogin không hiển thị | Error type sai | Tạo ChatErrorType.InvalidClerkUser |

---

## ✅ Kết Luận

**Vấn đề không phải là code không tồn tại, mà là luồng xử lý lỗi không đúng.**

- ✅ Case `ChatErrorType.InvalidClerkUser` đã tồn tại
- ✅ Component `ClerkLogin` đã tồn tại
- ✅ Thông báo tiếng Việt đã tồn tại
- ❌ Nhưng lỗi 401 không được chuyển đổi thành `ChatErrorType.InvalidClerkUser`

**Cần sửa:**
1. errorHandlingLink - Không hiển thị notification 401
2. Catch block - Kiểm tra lỗi 401 và tạo `ChatErrorType.InvalidClerkUser`

