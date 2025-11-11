# Khuyến Nghị Và Hành Động Để Sửa Lỗi UNAUTHORIZED

## 🎯 Tóm Tắt Vấn Đề

**Hiện Tại:** Người dùng chưa đăng nhập nhận lỗi mơ hồ: "Message sending failed, please check your network and try again: UNAUTHORIZED"

**Mong Muốn:** Hiển thị thông báo rõ ràng yêu cầu đăng nhập với nút "Đăng Nhập"

---

## 📋 Khuyến Nghị Ưu Tiên

### 🔴 CRITICAL (Phải Làm Ngay)

#### 1. Thêm Xử Lý Lỗi InvalidClerkUser

**File:** `src/features/Conversation/Error/index.tsx`

**Hiện Tại:** Không có case cho `InvalidClerkUser`

**Cần Thêm:**
```typescript
case ChatErrorType.InvalidClerkUser: {
  return <ClerkLogin id={data.id} />;
}
```

**Tác Dụng:** Hiển thị component ClerkLogin với nút "Đăng Nhập" thay vì lỗi chung chung

---

### 🟠 HIGH (Nên Làm)

#### 2. Cải Thiện Thông Báo Lỗi Tiếng Việt

**File:** `locales/vi-VN/error.json` (tạo nếu chưa có)

**Thêm:**
```json
{
  "response": {
    "InvalidClerkUser": "Vui lòng đăng nhập để gửi tin nhắn",
    "Unauthorized": "Yêu cầu xác thực. Vui lòng đăng nhập.",
    "401": "Chưa xác thực"
  }
}
```

**Tác Dụng:** Thông báo lỗi rõ ràng bằng tiếng Việt

#### 3. Vô Hiệu Hóa Nút Gửi Khi Chưa Đăng Nhập

**File:** `src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/useSend.ts`

**Thêm Kiểm Tra:**
```typescript
const isLoginWithAuth = useUserStore(authSelectors.isLoginWithAuth);

const handleSend = async () => {
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

**Tác Dụng:** Ngăn người dùng gửi tin nhắn khi chưa đăng nhập

---

### 🟡 MEDIUM (Có Thể Làm)

#### 4. Hiển Thị Thông Báo Trước Khi Gửi

**File:** `src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx`

**Thêm:**
```typescript
{!isLoginWithAuth && (
  <Alert
    message="Vui lòng đăng nhập để gửi tin nhắn"
    type="warning"
    showIcon
    action={
      <Button size="small" onClick={openLogin}>
        Đăng Nhập
      </Button>
    }
  />
)}
```

**Tác Dụng:** Nhắc nhở người dùng đăng nhập trước khi cố gắng gửi

#### 5. Cải Thiện Component ClerkLogin

**File:** `src/features/Conversation/Error/ClerkLogin/index.tsx`

**Thêm Thông Báo Rõ Ràng:**
```typescript
const ClerkLogin = memo<{ id: string }>(({ id }) => {
  const { t } = useTranslation('error');
  const [openSignIn, isSignedIn] = useUserStore((s) => [s.openLogin, s.isSignedIn]);
  
  return (
    <ErrorActionContainer>
      {isSignedIn ? (
        // Đã đăng nhập - hiển thị nút thử lại
        <FormAction
          avatar={'🌟'}
          description={t('clerkAuth.loginSuccess.desc')}
          title={t('clerkAuth.loginSuccess.title')}
        >
          <Button onClick={() => resend(id)}>
            {t('clerkAuth.loginSuccess.action')}
          </Button>
        </FormAction>
      ) : (
        // Chưa đăng nhập - hiển thị nút đăng nhập
        <FormAction
          avatar={'🔐'}
          description="Vui lòng đăng nhập để tiếp tục"
          title="Yêu cầu xác thực"
        >
          <Button onClick={openSignIn} type="primary" block>
            Đăng Nhập
          </Button>
        </FormAction>
      )}
    </ErrorActionContainer>
  );
});
```

**Tác Dụng:** Hiển thị thông báo rõ ràng và nút đăng nhập

---

## 🔧 Hành Động Chi Tiết

### Bước 1: Thêm Case InvalidClerkUser

**Tệp:** `src/features/Conversation/Error/index.tsx`

**Tìm:**
```typescript
case ChatErrorType.InvalidAccessCode: {
  return <InvalidAccessCode id={data.id} provider={data.error?.body?.provider} />;
}
```

**Thêm Trước:**
```typescript
case ChatErrorType.InvalidClerkUser: {
  return <ClerkLogin id={data.id} />;
}
```

### Bước 2: Tạo File Tiếng Việt

**Tệp:** `locales/vi-VN/error.json`

**Thêm:**
```json
{
  "response": {
    "InvalidClerkUser": "Vui lòng đăng nhập để gửi tin nhắn",
    "Unauthorized": "Yêu cầu xác thực. Vui lòng đăng nhập.",
    "401": "Chưa xác thực"
  }
}
```

### Bước 3: Cập Nhật Tiếng Việt Mặc Định

**Tệp:** `src/locales/default/error.ts`

**Thêm:**
```typescript
export default {
  response: {
    InvalidClerkUser: '抱歉，您当前未登录。请登录或注册账户以继续。',
    Unauthorized: '需要身份验证。请登录。',
  },
  // ... các key khác
}
```

---

## 📊 Bảng Hành Động

| Ưu Tiên | Hành Động | Tệp | Dòng | Độ Khó |
|---------|----------|-----|------|--------|
| 🔴 CRITICAL | Thêm case InvalidClerkUser | `src/features/Conversation/Error/index.tsx` | ~106 | Dễ |
| 🟠 HIGH | Tạo locales/vi-VN/error.json | `locales/vi-VN/error.json` | - | Dễ |
| 🟠 HIGH | Vô hiệu hóa nút gửi | `src/app/.../ChatInput/useSend.ts` | - | Trung Bình |
| 🟡 MEDIUM | Hiển thị cảnh báo | `src/app/.../ChatInput/index.tsx` | - | Trung Bình |
| 🟡 MEDIUM | Cải thiện ClerkLogin | `src/features/Conversation/Error/ClerkLogin/index.tsx` | - | Trung Bình |

---

## ✅ Kiểm Tra Sau Khi Sửa

1. **Đăng Xuất** từ tài khoản
2. **Cố Gắng Gửi Tin Nhắn**
3. **Kiểm Tra:**
   - ✅ Nút gửi bị vô hiệu hóa hoặc hiển thị cảnh báo
   - ✅ Lỗi hiển thị component ClerkLogin
   - ✅ Thông báo lỗi rõ ràng bằng tiếng Việt
   - ✅ Nút "Đăng Nhập" có thể nhấp được
4. **Nhấp "Đăng Nhập"**
5. **Kiểm Tra:**
   - ✅ Chuyển hướng đến `/login`
   - ✅ Có thể đăng nhập thành công
   - ✅ Quay lại chat
   - ✅ Có thể gửi tin nhắn

---

## 🎯 Kết Quả Mong Muốn

**Trước:**
```
Người dùng chưa đăng nhập
    ↓
Cố gắng gửi tin nhắn
    ↓
Lỗi: "Message sending failed, please check your network..."
    ↓
Người dùng bối rối
```

**Sau:**
```
Người dùng chưa đăng nhập
    ↓
Nút gửi bị vô hiệu hóa + Cảnh báo "Vui lòng đăng nhập"
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

## 📞 Liên Hệ Hỗ Trợ

Nếu cần giúp đỡ:
1. Kiểm tra `src/features/Conversation/Error/ClerkLogin/index.tsx`
2. Xem `src/libs/trpc/middleware/userAuth.ts` để hiểu luồng xác thực
3. Tham khảo `locales/en-US/error.json` để xem các thông báo lỗi khác

