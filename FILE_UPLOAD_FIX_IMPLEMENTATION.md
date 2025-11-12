# File Upload Fix Implementation Summary

## Problem Identified
File uploads to pho.chat are failing with CORS (Cross-Origin Resource Sharing) errors. The S3 bucket doesn't have CORS configured to allow PUT requests from the pho.chat domain.

## Root Cause
- **S3 Bucket**: pho-chat.s3.ap-southeast-2.amazonaws.com
- **Issue**: Missing CORS policy configuration
- **Error**: "Access to XMLHttpRequest blocked by CORS policy"
- **Impact**: Users cannot upload files (images, PDFs, documents) to chat

## Code Changes Made

### 1. Enhanced Error Handling in Upload Service
**File**: `src/services/upload.ts` (lines 157-224)

**Changes**:
- Added specific CORS error detection (status 0 with error event)
- Improved error messages to distinguish CORS errors from network errors
- Added abort event listener for better error handling
- CORS errors now throw: `"CORS_ERROR: S3 bucket CORS policy not configured..."`

**Before**:
```typescript
xhr.addEventListener('error', () => {
  if (xhr.status === 0) reject(UPLOAD_NETWORK_ERROR);
  else reject(xhr.statusText);
});
```

**After**:
```typescript
xhr.addEventListener('error', () => {
  if (xhr.status === 0) {
    reject(new Error('CORS_ERROR: S3 bucket CORS policy not configured...'));
  } else {
    reject(new Error(`Upload error: ${xhr.statusText}`));
  }
});
xhr.addEventListener('abort', () => {
  reject(new Error('Upload aborted'));
});
```

### 2. Improved Error Handling in Chat Upload
**File**: `src/store/file/slices/chat/action.ts` (lines 130-154)

**Changes**:
- Added CORS error detection and specific messaging
- Better error message formatting
- Distinguishes between network, CORS, and unknown errors

**Key Addition**:
```typescript
if (errorMessage.includes('CORS_ERROR')) {
  description = t('upload.corsError', { ns: 'error' }) || 
    'S3 bucket CORS policy is not configured...';
}
```

### 3. Added Error Handling in File Manager
**File**: `src/store/file/slices/fileManager/action.ts` (lines 101-122)

**Changes**:
- Added try-catch block for file uploads
- Updates file status to 'error' on failure
- Logs errors for debugging

### 4. Added CORS Error Message to Locales
**Files**: 
- `src/locales/default/error.ts` (Chinese)
- `locales/en-US/error.json` (English)

**Added**:
```
corsError: "S3 storage service CORS configuration is not properly set. 
Please contact the administrator to configure the CORS policy."
```

### 5. Created S3 CORS Configuration Script
**File**: `scripts/configure-s3-cors.ts`

**Purpose**: Automated script to configure S3 CORS policy
**Usage**: `npx ts-node scripts/configure-s3-cors.ts`

## Required S3 CORS Configuration

The S3 bucket needs this CORS policy:

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

## Implementation Steps

### Step 1: Configure S3 CORS (CRITICAL)
```bash
# Using AWS CLI
aws s3api put-bucket-cors \
  --bucket pho-chat \
  --cors-configuration file://cors-config.json \
  --region ap-southeast-2

# Or using the script
export S3_BUCKET=pho-chat
export S3_REGION=ap-southeast-2
export S3_PUBLIC_DOMAIN=https://pho.chat
npx ts-node scripts/configure-s3-cors.ts
```

### Step 2: Verify Environment Variables in Vercel
- `S3_BUCKET`: pho-chat
- `S3_REGION`: ap-southeast-2
- `S3_ACCESS_KEY_ID`: (configured)
- `S3_SECRET_ACCESS_KEY`: (configured)
- `S3_PUBLIC_DOMAIN`: https://pho-chat.s3.ap-southeast-2.amazonaws.com

### Step 3: Deploy Code Changes
```bash
git add .
git commit -m "fix: improve S3 file upload error handling and CORS detection"
git push
```

### Step 4: Test File Upload
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Try uploading a small image file
4. Check browser DevTools → Network tab
5. Verify PUT request succeeds (status 200)

## Testing Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| Upload small image (< 5MB) | Success, file appears in S3 |
| Upload large file (> 50MB) | Success or appropriate error |
| Upload PDF document | Success if server mode enabled |
| Upload video file | Success if supported |
| CORS not configured | Clear error message about CORS |
| Network error | Network error message |

## Monitoring & Verification

### Check CORS Configuration
```bash
aws s3api get-bucket-cors --bucket pho-chat --region ap-southeast-2
```

### Monitor Sentry
- Watch for CORS_ERROR messages
- Track upload success rate
- Monitor file storage metrics

### Browser DevTools
- Network tab: Verify PUT requests succeed
- Console: Check for CORS error messages
- Application tab: Verify files stored in S3

## Related Documentation
- S3 CORS Fix Guide: `S3_CORS_FIX_GUIDE.md`
- File Upload Analysis: `FILE_UPLOAD_ISSUE_ANALYSIS.md`
- AWS S3 CORS: https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html

