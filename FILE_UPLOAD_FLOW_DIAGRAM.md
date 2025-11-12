# File Upload Flow - Diagrams & Architecture

## Current Upload Flow (With CORS Issue)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                                                                   │
│  1. User selects file                                            │
│     ↓                                                             │
│  2. uploadChatFiles() / uploadWithProgress()                     │
│     ↓                                                             │
│  3. uploadFileToS3(file)                                         │
│     ├─ Check file hash                                           │
│     ├─ If exists: skip upload                                    │
│     └─ If new: uploadToServerS3()                                │
│        ↓                                                          │
│  4. getSignedUploadUrl()                                         │
│     └─ Call server: createS3PreSignedUrl()                       │
│        ↓                                                          │
└────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                              │
│                                                                   │
│  5. Generate pre-signed URL                                      │
│     └─ S3.createPreSignedUrl(pathname)                           │
│        ↓                                                          │
└────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                                                                   │
│  6. XMLHttpRequest PUT to S3                                     │
│     └─ xhr.open('PUT', preSignUrl)                               │
│        ↓                                                          │
│  7. Browser sends preflight OPTIONS request                      │
│     └─ Checks CORS headers from S3                               │
│        ↓                                                          │
│  ❌ S3 RETURNS NO CORS HEADERS                                   │
│     └─ Browser blocks request                                    │
│        ↓                                                          │
│  8. Error Event Triggered                                        │
│     └─ xhr.status = 0 (CORS error)                               │
│        ↓                                                          │
│  9. Error Handler                                                │
│     └─ Detect CORS_ERROR                                         │
│        ↓                                                          │
│  10. Show Error Message                                          │
│      └─ "S3 storage service CORS configuration is not properly   │
│         set. Please contact the administrator..."                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Fixed Upload Flow (After CORS Configuration)

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                                                                   │
│  1. User selects file                                            │
│     ↓                                                             │
│  2. uploadChatFiles() / uploadWithProgress()                     │
│     ↓                                                             │
│  3. uploadFileToS3(file)                                         │
│     ├─ Check file hash                                           │
│     ├─ If exists: skip upload                                    │
│     └─ If new: uploadToServerS3()                                │
│        ↓                                                          │
│  4. getSignedUploadUrl()                                         │
│     └─ Call server: createS3PreSignedUrl()                       │
│        ↓                                                          │
└────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS SERVER                              │
│                                                                   │
│  5. Generate pre-signed URL                                      │
│     └─ S3.createPreSignedUrl(pathname)                           │
│        ↓                                                          │
└────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                                                                   │
│  6. XMLHttpRequest PUT to S3                                     │
│     └─ xhr.open('PUT', preSignUrl)                               │
│        ↓                                                          │
│  7. Browser sends preflight OPTIONS request                      │
│     └─ Checks CORS headers from S3                               │
│        ↓                                                          │
│  ✓ S3 RETURNS CORS HEADERS                                       │
│     ├─ Access-Control-Allow-Origin: https://pho.chat             │
│     ├─ Access-Control-Allow-Methods: PUT, GET, POST, DELETE      │
│     └─ Access-Control-Allow-Headers: *                           │
│        ↓                                                          │
│  8. Browser Allows Request                                       │
│     └─ Sends actual PUT request with file data                   │
│        ↓                                                          │
│  9. S3 Receives File                                             │
│     └─ Returns 200 OK with ETag                                  │
│        ↓                                                          │
│  10. Success Handler                                             │
│      ├─ Update progress: 100%                                    │
│      ├─ Create file record in database                           │
│      └─ Show success message                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Upload Error Detected                      │
│                                                                │
│  xhr.addEventListener('error', () => {                        │
│    if (xhr.status === 0) {                                    │
│      // CORS error (status 0 = network error)                 │
│      reject(new Error('CORS_ERROR: ...'))                     │
│    } else {                                                   │
│      // Other HTTP error                                      │
│      reject(new Error(`Upload error: ${xhr.statusText}`))     │
│    }                                                          │
│  })                                                           │
│                                                                │
└──────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────┐
│              Error Caught in uploadChatFiles()                │
│                                                                │
│  catch (error) {                                              │
│    const errorMessage = error?.message || ''                  │
│                                                                │
│    if (errorMessage.includes('CORS_ERROR')) {                 │
│      // Show CORS-specific error                              │
│      description = t('upload.corsError', { ns: 'error' })     │
│    } else if (error === UPLOAD_NETWORK_ERROR) {               │
│      // Show network error                                    │
│      description = t('upload.networkError', { ns: 'error' })  │
│    } else {                                                   │
│      // Show generic error                                    │
│      description = t('upload.unknownError', ...)              │
│    }                                                          │
│                                                                │
│    notification.error({                                       │
│      message: t('upload.uploadFailed', { ns: 'error' }),      │
│      description                                              │
│    })                                                         │
│  }                                                            │
│                                                                │
└──────────────────────────────────────────────────────────────┘
```

## CORS Configuration Impact

```
BEFORE (No CORS)                    AFTER (CORS Configured)
─────────────────────────────────────────────────────────────

Browser Request                     Browser Request
    ↓                                   ↓
OPTIONS (preflight)                 OPTIONS (preflight)
    ↓                                   ↓
S3 Response                         S3 Response
❌ No CORS headers                  ✓ CORS headers present
    ↓                                   ↓
Browser blocks                      Browser allows
    ↓                                   ↓
Error (status 0)                    PUT request sent
    ↓                                   ↓
Upload fails                        S3 receives file
                                        ↓
                                    Upload succeeds
```

## S3 CORS Configuration

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "https://pho.chat",           ← Production domain
        "http://localhost:3000",      ← Dev environment
        "http://localhost:3015"       ← Desktop client
      ],
      "AllowedMethods": [
        "GET",                        ← Read files
        "PUT",                        ← Upload files
        "POST",                       ← Create operations
        "DELETE",                     ← Delete files
        "HEAD"                        ← Check file existence
      ],
      "AllowedHeaders": [
        "*"                           ← Allow all headers
      ],
      "ExposeHeaders": [
        "ETag",                       ← File version ID
        "x-amz-version-id"            ← S3 version tracking
      ],
      "MaxAgeSeconds": 3000           ← Cache preflight for 50 min
    }
  ]
}
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────┐
│                    Chat Component                            │
│  (src/store/file/slices/chat/action.ts)                     │
│                                                               │
│  uploadChatFiles()                                           │
│    └─ Handles file uploads for chat                          │
│    └─ Shows error notifications                              │
│    └─ Detects CORS errors specifically                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  Upload Service                              │
│  (src/services/upload.ts)                                   │
│                                                               │
│  uploadFileToS3()                                            │
│    └─ Unified upload method                                  │
│    └─ Handles desktop, server, and client modes              │
│                                                               │
│  uploadToServerS3()                                          │
│    └─ Makes direct PUT to S3                                 │
│    └─ Detects CORS errors (status 0)                         │
│    └─ Throws CORS_ERROR for specific handling                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   S3 Module                                  │
│  (src/server/modules/S3/index.ts)                           │
│                                                               │
│  createPreSignedUrl()                                        │
│    └─ Generates signed URL for client upload                 │
│    └─ URL valid for 1 hour                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   AWS S3 Bucket                              │
│  (pho-chat.s3.ap-southeast-2.amazonaws.com)                 │
│                                                               │
│  CORS Policy                                                 │
│    └─ Allows requests from https://pho.chat                  │
│    └─ Allows PUT, GET, POST, DELETE, HEAD methods            │
│    └─ Returns CORS headers in response                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Key Files & Their Roles

| File | Role | Status |
|------|------|--------|
| `src/services/upload.ts` | Core upload logic, CORS detection | ✓ Fixed |
| `src/store/file/slices/chat/action.ts` | Chat file uploads, error handling | ✓ Fixed |
| `src/store/file/slices/fileManager/action.ts` | File manager uploads, error handling | ✓ Fixed |
| `src/server/modules/S3/index.ts` | S3 pre-signed URL generation | ✓ Working |
| `src/envs/file.ts` | S3 configuration | ✓ Working |
| `scripts/configure-s3-cors.ts` | CORS setup automation | ✓ New |

