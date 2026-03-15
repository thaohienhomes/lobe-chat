import { describe, expect, it } from 'vitest';

interface User {
  avatar: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  id: string;
  lastName: string;
  name: string;
  type: 'normal-user' | 'admin' | 'super-admin';
}

interface UserDataUpdatedEvent {
  // 用户名
  action: 'update-user'; 
  extendedUser: User;
  user: string; // 扩展用户信息
}

const userDataUpdatedEvent: UserDataUpdatedEvent = {
  action: 'update-user',
  extendedUser: {
    avatar: 'https://cdn.casbin.org/img/casbin.svg',
    displayName: 'Admin',
    email: 'admin@example.cn',
    emailVerified: false,
    firstName: '',
    id: '35edace3-00c6-41e1-895e-97c519b1d8cc',
    lastName: '',
    name: 'admin',
    type: 'normal-user',
  },
  user: 'admin',
};

const AUTH_CASDOOR_WEBHOOK_SECRET = 'casdoor-secret';

// Test Casdoor Webhooks in Local dev, here is some tips:
// - Replace the var `AUTH_CASDOOR_WETHOOK_SECRET` with the actual value in your `.env` file
// - Start web request: If you want to run the test, replace `describe.skip` with `describe` below
// - Run this test with command:
// pnpm vitest --run --testNamePattern='^ ?Test Casdoor Webhooks in Local dev'  src/app/api/webhooks/casdoor/__tests__/route.test.ts

describe.skip('Test Casdoor Webhooks in Local dev', () => {
  // describe('Test Casdoor Webhooks in Local dev', () => {
  it('should send a POST request with casdoor headers', async () => {
    const url = 'http://localhost:3010/api/webhooks/casdoor'; // 替换为目标URL
    const data = userDataUpdatedEvent;
    const response = await fetch(url, {
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'casdoor-secret': AUTH_CASDOOR_WEBHOOK_SECRET,
      },
      method: 'POST',
    });
    expect(response.status).toBe(200); // 检查响应状态
  });
});
