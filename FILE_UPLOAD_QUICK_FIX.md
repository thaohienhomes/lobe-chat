# File Upload Issue - Quick Fix Guide

## TL;DR

File uploads fail due to missing S3 CORS configuration. Configure CORS on the S3 bucket, then deploy code changes.

## 1. Configure S3 CORS (5 minutes)

### Quick Command

```bash
# Create cors-config.json
cat > cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["https://pho.chat", "http://localhost:3000", "http://localhost:3015"],
      "ExposeHeaders": ["ETag", "x-amz-version-id"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

# Apply CORS
aws s3api put-bucket-cors --bucket pho-chat --cors-configuration file://cors-config.json --region ap-southeast-2

# Verify
aws s3api get-bucket-cors --bucket pho-chat --region ap-southeast-2
```

### Or Use Script

```bash
export S3_BUCKET=pho-chat
export S3_REGION=ap-southeast-2
export S3_PUBLIC_DOMAIN=https://pho.chat
npx ts-node scripts/configure-s3-cors.ts
```

## 2. Deploy Code Changes

```bash
git add .
git commit -m "fix: improve S3 file upload error handling and CORS detection"
git push
```

## 3. Test Upload

1. Clear cache: Ctrl+Shift+Delete
2. Hard refresh: Ctrl+Shift+R
3. Try uploading a file
4. Check DevTools → Network tab
5. Verify PUT request returns 200

## What Was Fixed

✓ Better CORS error detection
✓ Specific error messages for users
✓ Improved error handling in file manager
✓ Chinese & English error messages
✓ Automated CORS configuration script

## Files Changed

- `src/services/upload.ts` - CORS detection
- `src/store/file/slices/chat/action.ts` - Error handling
- `src/store/file/slices/fileManager/action.ts` - Error handling
- `src/locales/default/error.ts` - Chinese message
- `locales/en-US/error.json` - English message
- `scripts/configure-s3-cors.ts` - CORS script

## Troubleshooting

| Issue                         | Solution                                                               |
| ----------------------------- | ---------------------------------------------------------------------- |
| Still getting CORS errors     | Verify CORS was applied: `aws s3api get-bucket-cors --bucket pho-chat` |
| Files upload but don't appear | Check S3 bucket permissions and S3\_PUBLIC\_DOMAIN                     |
| Pre-signed URL errors         | Verify AWS credentials in Vercel                                       |
| Upload still fails            | Clear browser cache completely, try incognito window                   |

## Verify Success

```bash
# Check CORS is configured
aws s3api get-bucket-cors --bucket pho-chat --region ap-southeast-2

# Should return:
# {
#   "CORSRules": [
#     {
#       "AllowedHeaders": ["*"],
#       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
#       "AllowedOrigins": ["https://pho.chat", ...],
#       ...
#     }
#   ]
# }
```

## Need Help?

1. Check browser console for error messages
2. Review Sentry for error patterns
3. Verify S3 bucket name: `pho-chat`
4. Verify S3 region: `ap-southeast-2`
5. Verify domain: `https://pho.chat`

## Related Docs

- Full guide: `FILE_UPLOAD_ACTION_PLAN.md`
- Technical details: `FILE_UPLOAD_COMPREHENSIVE_ANALYSIS.md`
- CORS guide: `S3_CORS_FIX_GUIDE.md`
