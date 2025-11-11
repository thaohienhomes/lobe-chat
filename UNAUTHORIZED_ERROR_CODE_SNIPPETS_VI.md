# Code Snippets: Sửa Lỗi UNAUTHORIZED

## 🔴 CRITICAL - Phải Làm Ngay

### Snippet 1: Thêm Case InvalidClerkUser

**File:** `src/features/Conversation/Error/index.tsx`

**Tìm dòng này (khoảng dòng 106):**
```typescript
case ChatErrorType.InvalidAccessCode: {
  return <InvalidAccessCode id={data.id} provider={data.error?.body?.provider} />;
}
```

**Thêm trước nó:**
```typescript
case ChatErrorType.InvalidClerkUser: {
  return <ClerkLogin id={data.id} />;
}
```

**Kết Quả:**
```typescript
case ChatErrorType.InvalidClerkUser: {
  return <ClerkLogin id={data.id} />;
}

case ChatErrorType.InvalidAccessCode: {
  return <InvalidAccessCode id={data.id} provider={data.error?.body?.provider} />;
}
```

---

## 🟠 HIGH - Nên Làm

### Snippet 2: Tạo File Tiếng Việt

**File:** `locales/vi-VN/error.json` (tạo mới)

**Nội Dung:**
```json
{
  "clerkAuth": {
    "loginSuccess": {
      "action": "Tiếp tục cuộc trò chuyện",
      "desc": "{{greeting}}, rất vui được tiếp tục phục vụ bạn. Hãy tiếp tục chủ đề của chúng ta.",
      "title": "Chào mừng trở lại, {{nickName}}"
    }
  },
  "response": {
    "InvalidClerkUser": "Vui lòng đăng nhập để gửi tin nhắn",
    "Unauthorized": "Yêu cầu xác thực. Vui lòng đăng nhập.",
    "401": "Chưa xác thực",
    "CreateMessageError": "Xin lỗi, tin nhắn không được gửi thành công. Vui lòng sao chép nội dung và gửi lại."
  }
}
```

---

### Snippet 3: Cập Nhật Tiếng Việt Mặc Định

**File:** `src/locales/default/error.ts`

**Tìm:**
```typescript
export default {
  clerkAuth: {
    loginSuccess: {
      action: '继续会话',
      desc: '{{greeting}}，很高兴能够继续为你服务。让我们接着刚刚的话题聊下去吧',
      title: '欢迎回来， {{nickName}}',
    },
  },
```

**Thêm Sau:**
```typescript
  response: {
    InvalidClerkUser: '抱歉，您当前未登录。请登录或注册账户以继续。',
    Unauthorized: '需要身份验证。请登录。',
  },
```

---

## 🟡 MEDIUM - Có Thể Làm

### Snippet 4: Vô Hiệu Hóa Nút Gửi

**File:** `src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx`

**Thêm:**
```typescript
import { useUserStore } from '@/store/user';
import { authSelectors } from '@/store/user/slices/auth/selectors';

// Trong component
const isLoginWithAuth = useUserStore(authSelectors.isLoginWithAuth);

// Trong JSX
<Button
  disabled={!isLoginWithAuth}
  onClick={handleSend}
  type="primary"
>
  {isLoginWithAuth ? 'Gửi' : 'Vui lòng đăng nhập'}
</Button>
```

---

### Snippet 5: Hiển Thị Cảnh Báo

**File:** `src/app/[variants]/(main)/chat/(workspace)/@conversation/features/ChatInput/index.tsx`

**Thêm Trước Input:**
```typescript
import { Alert } from 'antd';

{!isLoginWithAuth && (
  <Alert
    message="Vui lòng đăng nhập"
    description="Bạn cần đăng nhập để gửi tin nhắn"
    type="warning"
    showIcon
    closable
    style={{ marginBottom: 16 }}
    action={
      <Button 
        size="small" 
        type="primary"
        onClick={() => useUserStore.getState().openLogin()}
      >
        Đăng Nhập
      </Button>
    }
  />
)}
```

---

### Snippet 6: Cải Thiện Component ClerkLogin

**File:** `src/features/Conversation/Error/ClerkLogin/index.tsx`

**Thay Thế Toàn Bộ:**
```typescript
import { Button } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import UserLoginOrSignup from '@/features/User/UserLoginOrSignup';
import { useGreeting } from '@/hooks/useGreeting';
import { useChatStore } from '@/store/chat';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import { ErrorActionContainer, FormAction } from '../style';

const ClerkLogin = memo<{ id: string }>(({ id }) => {
  const { t } = useTranslation('error');
  const [openSignIn, isSignedIn] = useUserStore((s) => [s.openLogin, s.isSignedIn]);
  const greeting = useGreeting();
  const nickName = useUserStore(userProfileSelectors.nickName);
  const [resend, deleteMessage] = useChatStore((s) => [s.regenerateMessage, s.deleteMessage]);

  return (
    <ErrorActionContainer>
      {isSignedIn ? (
        <FormAction
          avatar={'🌟'}
          description={t('clerkAuth.loginSuccess.desc', { greeting })}
          title={t('clerkAuth.loginSuccess.title', { nickName })}
        >
          <Button
            block
            onClick={() => {
              resend(id);
              deleteMessage(id);
            }}
            size={'large'}
            type={'primary'}
          >
            {t('clerkAuth.loginSuccess.action')}
          </Button>
        </FormAction>
      ) : (
        <FormAction
          avatar={'🔐'}
          description={t('response.InvalidClerkUser')}
          title="Yêu cầu xác thực"
        >
          <Button
            block
            onClick={openSignIn}
            size={'large'}
            type={'primary'}
          >
            Đăng Nhập
          </Button>
        </FormAction>
      )}
    </ErrorActionContainer>
  );
});

export default ClerkLogin;
```

---

## 📋 Danh Sách Kiểm Tra

- [ ] Thêm case `InvalidClerkUser` trong error handler
- [ ] Tạo file `locales/vi-VN/error.json`
- [ ] Cập nhật `src/locales/default/error.ts`
- [ ] Vô hiệu hóa nút gửi khi chưa đăng nhập
- [ ] Hiển thị cảnh báo trước khi gửi
- [ ] Cải thiện component ClerkLogin
- [ ] Kiểm tra lại quy trình xác thực
- [ ] Chạy type-check: `bun run type-check`
- [ ] Kiểm tra trong trình duyệt

---

## 🧪 Kiểm Tra

### Bước 1: Đăng Xuất
```
1. Nhấp vào avatar người dùng
2. Chọn "Đăng Xuất"
3. Xác nhận
```

### Bước 2: Cố Gắng Gửi Tin Nhắn
```
1. Nhập tin nhắn
2. Nhấp nút "Gửi"
3. Kiểm tra:
   - ✅ Nút bị vô hiệu hóa hoặc hiển thị cảnh báo
   - ✅ Thông báo lỗi rõ ràng
   - ✅ Có nút "Đăng Nhập"
```

### Bước 3: Đăng Nhập
```
1. Nhấp "Đăng Nhập"
2. Chuyển hướng đến /login
3. Đăng nhập thành công
4. Quay lại chat
5. Gửi tin nhắn thành công
```

---

## 🔍 Kiểm Tra Lỗi

Nếu gặp lỗi, kiểm tra:

1. **Import đúng?**
   ```typescript
   import { ChatErrorType } from '@lobechat/types';
   ```

2. **Case đúng?**
   ```typescript
   case ChatErrorType.InvalidClerkUser: {
     return <ClerkLogin id={data.id} />;
   }
   ```

3. **File JSON hợp lệ?**
   ```bash
   # Kiểm tra cú pháp JSON
   cat locales/vi-VN/error.json | jq .
   ```

4. **Type-check?**
   ```bash
   bun run type-check
   ```

---

## 📞 Hỗ Trợ

Nếu cần giúp đỡ, tham khảo:
- `UNAUTHORIZED_ERROR_ANALYSIS_VI.md` - Phân tích chi tiết
- `UNAUTHORIZED_ERROR_TECHNICAL_DETAILS_VI.md` - Chi tiết kỹ thuật
- `UNAUTHORIZED_ERROR_RECOMMENDATIONS_VI.md` - Khuyến nghị

