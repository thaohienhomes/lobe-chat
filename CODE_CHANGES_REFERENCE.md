# Code Changes Reference - File Upload CORS Fix

## Overview

Fixed file upload CORS errors by including Content-Type header in S3 pre-signed URL generation.

---

## Change 1: S3 Module - Add ContentType Parameter

**File:** `src/server/modules/S3/index.ts`\
**Lines:** 103-112\
**Change Type:** Method signature update + parameter addition

```typescript
// ❌ BEFORE (BROKEN)
public async createPreSignedUrl(key: string): Promise<string> {
  const command = new PutObjectCommand({
    ACL: this.setAcl ? 'public-read' : undefined,
    Bucket: this.bucket,
    Key: key,
  });

  return getSignedUrl(this.client, command, { expiresIn: 3600 });
}

// ✅ AFTER (FIXED)
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

**What Changed:**

- Added optional `contentType` parameter to method signature
- Added `ContentType` field to `PutObjectCommand`
- Defaults to 'application/octet-stream' if not provided

---

## Change 2: Upload Router - Add ContentType to Input

**File:** `src/server/routers/edge/upload.ts`\
**Lines:** 6-14\
**Change Type:** Input schema + parameter passing

```typescript
// ❌ BEFORE (BROKEN)
export const uploadRouter = router({
  createS3PreSignedUrl: passwordProcedure
    .input(z.object({ pathname: z.string() }))
    .mutation(async ({ input }) => {
      const s3 = new S3();

      return await s3.createPreSignedUrl(input.pathname);
    }),
});

// ✅ AFTER (FIXED)
export const uploadRouter = router({
  createS3PreSignedUrl: passwordProcedure
    .input(z.object({
      pathname: z.string(),
      contentType: z.string().optional()
    }))
    .mutation(async ({ input }) => {
      const s3 = new S3();

      return await s3.createPreSignedUrl(input.pathname, input.contentType);
    }),
});
```

**What Changed:**

- Added `contentType: z.string().optional()` to input schema
- Pass `input.contentType` to `createPreSignedUrl()` method

---

## Change 3: Upload Service - Pass File Type

**File:** `src/services/upload.ts`\
**Lines:** 269-292\
**Change Type:** Parameter passing

```typescript
// ❌ BEFORE (BROKEN)
private getSignedUploadUrl = async (
  file: File,
  options: { directory?: string; pathname?: string } = {},
): Promise<
  FileMetadata & {
    preSignUrl: string;
  }
> => {
  // 生成文件路径元数据
  const { date, dirname, filename, pathname } = generateFilePathMetadata(file.name, options);

  const preSignUrl = await edgeClient.upload.createS3PreSignedUrl.mutate({ pathname });

  return {
    date,
    dirname,
    filename,
    path: pathname,
    preSignUrl,
  };
};

// ✅ AFTER (FIXED)
private getSignedUploadUrl = async (
  file: File,
  options: { directory?: string; pathname?: string } = {},
): Promise<
  FileMetadata & {
    preSignUrl: string;
  }
> => {
  // 生成文件路径元数据
  const { date, dirname, filename, pathname } = generateFilePathMetadata(file.name, options);

  const preSignUrl = await edgeClient.upload.createS3PreSignedUrl.mutate({
    pathname,
    contentType: file.type,
  });

  return {
    date,
    dirname,
    filename,
    path: pathname,
    preSignUrl,
  };
};
```

**What Changed:**

- Pass `contentType: file.type` to the pre-signed URL mutation
- This ensures the file's MIME type is included in the AWS signature

---

## Why This Fixes CORS Errors

### The Problem

1. Browser sends PUT request with `Content-Type: image/png` header
2. Pre-signed URL was generated WITHOUT ContentType specification
3. AWS S3 sees header mismatch → rejects as CORS violation

### The Solution

1. Include ContentType in pre-signed URL generation
2. AWS signature now includes the Content-Type header
3. Browser's header matches the signature → request accepted
4. CORS policy allows the request → upload succeeds

---

## Testing the Fix

### Manual Test Steps

```bash
# 1. Deploy to Vercel
git push origin main

# 2. Test in browser
# - Go to https://pho.chat
# - Try uploading an image
# - Check DevTools Console for errors

# 3. Verify in S3
# - Check S3 bucket for uploaded files
# - Confirm files are accessible
```

### Expected Results

- ✅ No CORS errors in console
- ✅ Upload progress bar shows
- ✅ Files appear in S3 bucket
- ✅ No errors in Sentry

---

## Commit Information

- **Hash:** `dad072abd`
- **Branch:** `thaohienhomes/feat/qr-code-scanning-animation`
- **Message:** "fix: include Content-Type header in S3 pre-signed URLs to fix CORS upload errors"
- **Status:** ✅ Pushed to GitHub
