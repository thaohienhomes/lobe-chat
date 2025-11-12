# File Upload Issue Analysis - pho.chat

## Problem Summary
File uploads are failing with CORS (Cross-Origin Resource Sharing) errors. Users see "File upload failed. Please check your network connection and ensure that the file storage service's cross-origin configuration is correct."

## Root Cause
The S3 bucket (`pho-chat.s3.ap-southeast-2.amazonaws.com`) does not have CORS configured to allow PUT requests from the pho.chat domain.

## Error Details from Browser Console
```
Access to XMLHttpRequest at 'https://pho-chat.s3.ap-southeast-2.amazonaws.com/files/...' 
from origin 'https://pho.chat' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Upload Flow Analysis

### Current Implementation (src/services/upload.ts)
1. **Client-side upload** → `uploadFileToS3(file)`
2. **Server mode** → `uploadToServerS3(file)` (line 157-215)
3. **Get pre-signed URL** → `getSignedUploadUrl()` calls `edgeClient.upload.createS3PreSignedUrl.mutate()`
4. **Direct PUT to S3** → XMLHttpRequest PUT request to pre-signed URL (line 190)
5. **CORS Error** → S3 rejects request due to missing CORS headers

### Key Code Locations
- **Upload service**: `src/services/upload.ts` (line 157-215)
- **Pre-signed URL endpoint**: `src/server/routers/edge/upload.ts`
- **S3 module**: `src/server/modules/S3/index.ts` (line 103-111)
- **File environment config**: `src/envs/file.ts`

## Required Fixes

### 1. S3 CORS Configuration (CRITICAL)
The S3 bucket needs CORS policy allowing:
- **Origin**: `https://pho.chat`
- **Methods**: `PUT`, `GET`, `POST`, `DELETE`, `HEAD`
- **Headers**: `*` (or specific: Content-Type, Authorization, x-amz-*)
- **Expose Headers**: `ETag`, `x-amz-version-id`

### 2. Verify Environment Variables
Required in Vercel:
- `S3_BUCKET`: pho-chat
- `S3_REGION`: ap-southeast-2
- `S3_ENDPOINT`: (if using custom endpoint)
- `S3_ACCESS_KEY_ID`: (configured)
- `S3_SECRET_ACCESS_KEY`: (configured)
- `S3_PUBLIC_DOMAIN`: https://pho-chat.s3.ap-southeast-2.amazonaws.com

### 3. File Size & Type Restrictions
- **Max file size**: Check `FILE_UPLOAD_BLACKLIST` in `packages/const/src/file.ts`
- **Supported types**: Images, videos, documents (configurable)
- **Blacklist**: .DS_Store, Thumbs.db, desktop.ini, etc.

## Testing Scenarios
1. Upload small image (< 5MB)
2. Upload large file (> 50MB)
3. Upload PDF document
4. Upload video file
5. Verify file appears in S3 bucket
6. Verify file is accessible via public URL

## Implementation Steps
1. Configure S3 CORS policy via AWS Console or CLI
2. Verify environment variables in Vercel
3. Test upload flow with different file types
4. Monitor Sentry for any remaining errors
5. Verify files are properly stored and accessible

