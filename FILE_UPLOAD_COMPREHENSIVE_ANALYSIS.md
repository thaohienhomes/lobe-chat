# File Upload Issue - Comprehensive Analysis & Fix

## Problem Overview

Users cannot upload files to pho.chat. The browser console shows CORS (Cross-Origin Resource Sharing) errors when attempting to upload files to the S3 bucket.

### Error Message
```
Access to XMLHttpRequest at 'https://pho-chat.s3.ap-southeast-2.amazonaws.com/files/...' 
from origin 'https://pho.chat' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### User-Facing Error
"File upload failed. Please check your network connection and ensure that the file storage service's cross-origin configuration is correct."

## Root Cause Analysis

### Technical Details
1. **Upload Flow**: Client → Pre-signed URL → Direct PUT to S3
2. **Issue**: S3 bucket CORS policy not configured
3. **Impact**: Browser blocks cross-origin PUT requests
4. **Affected**: All file uploads (images, PDFs, documents)

### Why This Happens
- Browser security policy prevents cross-origin requests
- S3 bucket must explicitly allow requests from pho.chat domain
- Without CORS headers, browser blocks the request at preflight stage
- Pre-signed URLs don't bypass CORS restrictions

## Upload Flow Diagram

```
User selects file
    ↓
uploadChatFiles() / uploadWithProgress()
    ↓
uploadFileToS3() [src/services/upload.ts]
    ↓
uploadToServerS3() [server mode]
    ↓
getSignedUploadUrl() → edgeClient.upload.createS3PreSignedUrl
    ↓
Server generates pre-signed URL
    ↓
XMLHttpRequest PUT to S3 ← CORS ERROR HERE
    ↓
Browser blocks request (no CORS headers)
    ↓
Error: "CORS_ERROR: S3 bucket CORS policy not configured"
```

## Code Changes Implemented

### 1. Enhanced Error Detection (src/services/upload.ts)
**Purpose**: Detect and report CORS errors specifically

```typescript
xhr.addEventListener('error', () => {
  if (xhr.status === 0) {
    // CORS errors result in status 0
    reject(new Error('CORS_ERROR: S3 bucket CORS policy not configured...'));
  } else {
    reject(new Error(`Upload error: ${xhr.statusText}`));
  }
});
```

### 2. Improved Error Handling (src/store/file/slices/chat/action.ts)
**Purpose**: Show specific error messages to users

```typescript
if (errorMessage.includes('CORS_ERROR')) {
  description = t('upload.corsError', { ns: 'error' }) || 
    'S3 bucket CORS policy is not configured...';
}
```

### 3. File Manager Error Handling (src/store/file/slices/fileManager/action.ts)
**Purpose**: Handle errors gracefully in file manager

```typescript
try {
  await get().uploadWithProgress({...});
} catch (error) {
  dispatchDockFileList({
    id: file.name,
    type: 'updateFile',
    value: { status: 'error' },
  });
}
```

### 4. Localization Updates
**Chinese** (src/locales/default/error.ts):
```
corsError: "S3 存储服务跨域配置未正确设置，请联系管理员配置 CORS 策略"
```

**English** (locales/en-US/error.json):
```
corsError: "S3 storage service CORS configuration is not properly set. 
Please contact the administrator to configure the CORS policy."
```

## Required S3 CORS Configuration

### CORS Policy JSON
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "https://pho.chat",
        "http://localhost:3000",
        "http://localhost:3015"
      ],
      "ExposeHeaders": ["ETag", "x-amz-version-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### Configuration Methods

**AWS CLI**:
```bash
aws s3api put-bucket-cors \
  --bucket pho-chat \
  --cors-configuration file://cors-config.json \
  --region ap-southeast-2
```

**AWS Console**:
1. S3 → pho-chat → Permissions → CORS
2. Paste JSON configuration
3. Save changes

**TypeScript Script**:
```bash
npx ts-node scripts/configure-s3-cors.ts
```

## Environment Variables Required

| Variable | Value | Status |
|----------|-------|--------|
| S3_BUCKET | pho-chat | ✓ |
| S3_REGION | ap-southeast-2 | ✓ |
| S3_ACCESS_KEY_ID | (AWS key) | ✓ |
| S3_SECRET_ACCESS_KEY | (AWS secret) | ✓ |
| S3_PUBLIC_DOMAIN | https://pho-chat.s3.ap-southeast-2.amazonaws.com | ✓ |
| S3_ENABLE_PATH_STYLE | 0 | ✓ |

## Testing Checklist

- [ ] CORS policy applied to S3 bucket
- [ ] Vercel environment variables verified
- [ ] Code changes deployed
- [ ] Browser cache cleared
- [ ] Small image upload works
- [ ] Large file upload works
- [ ] PDF upload works
- [ ] DevTools shows successful PUT request
- [ ] File appears in S3 bucket
- [ ] No CORS errors in console
- [ ] Sentry shows no CORS_ERROR messages

## Files Modified

1. `src/services/upload.ts` - CORS error detection
2. `src/store/file/slices/chat/action.ts` - Error handling
3. `src/store/file/slices/fileManager/action.ts` - Error handling
4. `src/locales/default/error.ts` - Chinese error message
5. `locales/en-US/error.json` - English error message
6. `scripts/configure-s3-cors.ts` - CORS configuration script

## Next Steps

1. **Configure S3 CORS** (5-10 minutes)
2. **Deploy code changes** (5 minutes)
3. **Test file uploads** (10 minutes)
4. **Monitor Sentry** (ongoing)
5. **Verify success** (5 minutes)

## Success Metrics

✓ File uploads complete without CORS errors
✓ Users see clear error messages if issues occur
✓ Files properly stored in S3
✓ No TypeScript errors
✓ All tests pass
✓ Sentry shows no CORS_ERROR messages

## Documentation

- `FILE_UPLOAD_ACTION_PLAN.md` - Step-by-step action plan
- `S3_CORS_FIX_GUIDE.md` - Detailed CORS configuration guide
- `FILE_UPLOAD_ISSUE_ANALYSIS.md` - Technical analysis
- `FILE_UPLOAD_FIX_IMPLEMENTATION.md` - Implementation details

