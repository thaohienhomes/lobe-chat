# Technical Debt Tracking

> Last updated: 2025-12-08
> Discovered during: PR #13 (Phở Points Migration) CI run

## Overview

This document tracks pre-existing test failures that need to be addressed. These issues were not caused by PR #13 but were discovered during CI validation.

| Issue                 | Priority  | Status | Deadline |
| --------------------- | --------- | ------ | -------- |
| TikTok Tracking Tests | 🔴 HIGH   | Open   | 1 week   |
| Database Mock Tests   | 🟡 MEDIUM | Open   | 2 weeks  |

---

## Issue #1: \[HIGH] Fix TikTok Tracking Tests

### Summary

TikTok tracking tests are failing due to missing `@/utils/tiktok-events` module and mock issues.

### Impact

- **Priority**: HIGH
- **Affected Area**: Analytics, Ad Campaign Tracking
- **Production Impact**: TikTok pixel tracking may not work correctly

### Failing Tests

#### Suite Failures (Import Error)

- `src/hooks/__tests__/useTikTokTracking.test.ts`
- `src/components/Analytics/__tests__/TikTok.test.tsx`

**Error:**

```
Failed to resolve import "@/utils/tiktok-events". Does the file exist?
```

#### Test Failures (Mock Issues)

- `src/utils/__tests__/tiktok-events.test.ts`
  - `should return false when pixel ID is missing`
  - `should not track event when pixel is disabled`
  - `should not identify user when pixel is disabled`

### Root Cause

1. File `@/utils/tiktok-events` may not exist or path alias is incorrect
2. Mock for `isTikTokPixelEnabled` not working correctly
3. `analyticsEnv.TIKTOK_PIXEL_ID` mock doesn't properly disable tracking

### Suggested Fix

1. Verify `src/utils/tiktok-events.ts` exists
2. Fix `isTikTokPixelEnabled` to check for empty string
3. Update test mocks to properly isolate `analyticsEnv` module

### Acceptance Criteria

- [ ] All TikTok tracking tests pass
- [ ] TikTok pixel tracking works in production
- [ ] Ad campaign events are properly tracked

---

## Issue #2: \[MEDIUM] Fix Database Mock and Crypto Hash Tests

### Summary

Tests failing due to incomplete Drizzle ORM mocking and crypto API issues.

### Impact

- **Priority**: MEDIUM
- **Affected Area**: Test Infrastructure
- **Production Impact**: None - test-only issues

### Failing Tests

#### Database Mock Issues

- `src/server/routers/lambda/aiChat.test.ts` (2 tests)
- `src/server/services/user/index.test.ts` (2 tests)

**Error:**

```
TypeError: this.db.select is not a function
```

#### Crypto Hash Tests

- `src/utils/__tests__/crypto-hash.test.ts` (3 tests)

**Errors:**

- TextEncoder spy not called
- Cannot delete property 'crypto'

### Root Cause

1. Test mocks don't implement Drizzle ORM chainable API
2. `window.crypto` cannot be deleted in vitest environment

### Suggested Fix

1. Create reusable Drizzle mock factory with full chainable API
2. Use `vi.stubGlobal` instead of `delete` for crypto

### Acceptance Criteria

- [ ] All aiChat.test.ts tests pass
- [ ] All user/index.test.ts tests pass
- [ ] All crypto-hash.test.ts tests pass
- [ ] Create reusable mock utilities

---

## CI Statistics

| Metric      | Value                     |
| ----------- | ------------------------- |
| Total Tests | 2642                      |
| Passed      | 2599 (98.4%)              |
| Failed      | 10                        |
| Skipped     | 33                        |
| Pass Rate   | 99.6% (excluding skipped) |
