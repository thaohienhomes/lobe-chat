# S3 CORS Configuration Fix Guide for pho.chat

## Problem
File uploads fail with CORS error: "Access to XMLHttpRequest blocked by CORS policy"

## Solution: Configure S3 CORS Policy

### Option 1: Using AWS CLI (Recommended)

1. **Create CORS configuration file** (`cors-config.json`):
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

2. **Apply CORS configuration**:
```bash
aws s3api put-bucket-cors \
  --bucket pho-chat \
  --cors-configuration file://cors-config.json \
  --region ap-southeast-2
```

3. **Verify configuration**:
```bash
aws s3api get-bucket-cors \
  --bucket pho-chat \
  --region ap-southeast-2
```

### Option 2: Using AWS Console

1. Go to S3 → Buckets → pho-chat
2. Click "Permissions" tab
3. Scroll to "Cross-origin resource sharing (CORS)"
4. Click "Edit"
5. Paste the JSON configuration above
6. Click "Save changes"

### Option 3: Using TypeScript Script

```bash
# Set environment variables
export S3_BUCKET=pho-chat
export S3_REGION=ap-southeast-2
export S3_PUBLIC_DOMAIN=https://pho.chat

# Run the configuration script
npx ts-node scripts/configure-s3-cors.ts
```

## Verification Steps

1. **Check CORS is applied**:
```bash
aws s3api get-bucket-cors --bucket pho-chat --region ap-southeast-2
```

2. **Test file upload** in pho.chat UI
3. **Check browser DevTools** → Network tab → verify PUT request succeeds
4. **Verify file in S3** → Check bucket contents

## Environment Variables to Verify

In Vercel project settings, ensure these are configured:
- `S3_BUCKET`: pho-chat
- `S3_REGION`: ap-southeast-2
- `S3_ACCESS_KEY_ID`: (your AWS access key)
- `S3_SECRET_ACCESS_KEY`: (your AWS secret key)
- `S3_PUBLIC_DOMAIN`: https://pho-chat.s3.ap-southeast-2.amazonaws.com
- `S3_ENABLE_PATH_STYLE`: 0 (for AWS S3)

## CORS Configuration Explanation

| Setting | Value | Purpose |
|---------|-------|---------|
| AllowedOrigins | https://pho.chat | Allow requests from pho.chat domain |
| AllowedMethods | GET, PUT, POST, DELETE, HEAD | Allow file operations |
| AllowedHeaders | * | Allow all headers (Content-Type, etc.) |
| ExposeHeaders | ETag, x-amz-version-id | Expose S3 response headers |
| MaxAgeSeconds | 3000 | Cache preflight requests for 50 minutes |

## Troubleshooting

### Still getting CORS errors?
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check CORS config was applied: `aws s3api get-bucket-cors --bucket pho-chat`
4. Verify domain in CORS matches exactly (https://pho.chat, not pho.chat)

### Files upload but don't appear?
1. Check S3 bucket permissions
2. Verify S3_PUBLIC_DOMAIN is correct
3. Check file size limits in code

### Pre-signed URL errors?
1. Verify S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY
2. Check IAM permissions for the AWS user
3. Verify S3_BUCKET name is correct

## Related Files
- Upload service: `src/services/upload.ts`
- S3 module: `src/server/modules/S3/index.ts`
- File config: `src/envs/file.ts`
- Upload router: `src/server/routers/edge/upload.ts`

