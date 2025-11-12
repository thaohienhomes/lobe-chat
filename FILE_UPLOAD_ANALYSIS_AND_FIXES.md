# File Upload Issue Analysis & Fixes - pho.chat

## 📋 TASK 1: .env.local Configuration Review

### Section Analysis (Lines 91-99)

**Configuration Section:**

```
# ============================================================================
# PRODUCTION SOLUTION FOR VIETNAM: OpenRouter
# ============================================================================
# OpenRouter bypasses geo-blocking by routing through their infrastructure
# Supports 100+ models from OpenAI, Anthropic, Google, Meta, etc.
# Sign up: https://openrouter.ai
# API Keys: https://openrouter.ai/keys
# Credits: https://openrouter.ai/credits
# ============================================================================
```

### ✅ Recommendation: KEEP AS-IS

**Reason:** This is NOT LobeChat branding - it's functional configuration for AI model provider integration.

**What it controls:**

- AI model provider selection (OpenRouter)
- Geo-blocking bypass for Vietnam market
- Model availability (Claude, Gemini, Llama, DeepSeek)

**Status:** ✅ Already properly branded for pho.chat (no LobeChat references)

---

## 🔴 TASK 2: File Upload Issue - ROOT CAUSE IDENTIFIED

### Problem Summary

Files fail to upload with CORS error despite S3 CORS configuration being applied.

**Error Message:**

```
Access to XMLHttpRequest at 'https://pho-chat.s3.ap-southeast-2.amazonaws.com/files/...'
from origin 'https://pho.chat' has been blocked by CORS policy
```

### Root Cause: Pre-Signed URL Missing Content-Type Header

**The Issue:**
When generating pre-signed URLs for PUT requests, the `Content-Type` header must be included in the signature. Currently, the code generates pre-signed URLs WITHOUT specifying the Content-Type header, but the browser sends the Content-Type header during upload. This mismatch causes S3 to reject the request as a CORS violation.

**Current Code (BROKEN):**

```typescript
// src/server/modules/S3/index.ts - Line 103-111
public async createPreSignedUrl(key: string): Promise<string> {
  const command = new PutObjectCommand({
    ACL: this.setAcl ? 'public-read' : undefined,
    Bucket: this.bucket,
    Key: key,
    // ❌ Missing: ContentType header specification
  });
  return getSignedUrl(this.client, command, { expiresIn: 3600 });
}
```

**Upload Code (SENDS HEADER):**

```typescript
// src/services/upload.ts - Line 191
xhr.setRequestHeader('Content-Type', file.type);
// ❌ This header is sent but wasn't included in pre-signed URL signature
```

### ✅ Solution: Include Content-Type in Pre-Signed URL

**Fixed Code:**

```typescript
// src/server/modules/S3/index.ts - Line 103-111
public async createPreSignedUrl(key: string, contentType?: string): Promise<string> {
  const command = new PutObjectCommand({
    ACL: this.setAcl ? 'public-read' : undefined,
    Bucket: this.bucket,
    ContentType: contentType || 'application/octet-stream',
    Key: key,
  });
  return getSignedUrl(this.client, command, { expiresIn: 3600 });
}
```

**Update Upload Router:**

```typescript
// src/server/routers/edge/upload.ts - Line 7-13
createS3PreSignedUrl: passwordProcedure
  .input(z.object({
    pathname: z.string(),
    contentType: z.string().optional() // Add this
  }))
  .mutation(async ({ input }) => {
    const s3 = new S3();
    return await s3.createPreSignedUrl(input.pathname, input.contentType);
  }),
```

**Update Upload Service:**

```typescript
// src/services/upload.ts - Line 269-289
private getSignedUploadUrl = async (
  file: File,
  options: { directory?: string; pathname?: string } = {},
): Promise<FileMetadata & { preSignUrl: string }> => {
  const { date, dirname, filename, pathname } = generateFilePathMetadata(file.name, options);

  // Pass contentType to pre-signed URL generation
  const preSignUrl = await edgeClient.upload.createS3PreSignedUrl.mutate({
    pathname,
    contentType: file.type // Add this
  });

  return { date, dirname, filename, path: pathname, preSignUrl };
};
```

---

## 🚀 Implementation Steps

### Step 1: Update S3 Module

- Modify `createPreSignedUrl()` to accept and use `contentType` parameter
- Default to 'application/octet-stream' if not provided

### Step 2: Update Upload Router

- Add `contentType` to input schema
- Pass it to S3 module

### Step 3: Update Upload Service

- Pass `file.type` as `contentType` when requesting pre-signed URL

### Step 4: Test

- Upload small image (< 5MB)
- Upload large file (> 50MB)
- Verify no CORS errors in console
- Check S3 bucket for uploaded files

---

## 📊 Verification Checklist

- [ ] S3 CORS configuration applied (already done)
- [ ] Pre-signed URL includes Content-Type header
- [ ] Upload router passes contentType parameter
- [ ] Upload service sends file.type to router
- [ ] Test upload succeeds without CORS errors
- [ ] Files appear in S3 bucket
- [ ] No errors in browser console
