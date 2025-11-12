# File Upload Issue - Complete Action Plan

## Executive Summary
File uploads are failing due to missing S3 CORS configuration. Code improvements have been implemented to provide better error detection and user feedback. The critical next step is configuring the S3 bucket CORS policy.

## Current Status

### ✅ Completed
1. **Root cause analysis** - CORS policy not configured on S3 bucket
2. **Code improvements** - Enhanced error handling and CORS detection
3. **Error messages** - Added specific CORS error messages in Chinese and English
4. **Configuration script** - Created automated S3 CORS setup script
5. **Type checking** - All changes pass TypeScript validation

### ⏳ Pending
1. **S3 CORS Configuration** - Must be done in AWS Console or CLI
2. **Environment verification** - Confirm Vercel env vars are correct
3. **Testing** - Verify file uploads work after CORS is configured
4. **Deployment** - Deploy code changes to production

## Critical Action Items

### 1. Configure S3 CORS Policy (MUST DO FIRST)

**Option A: Using AWS CLI (Recommended)**
```bash
# Create cors-config.json with this content:
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

# Apply the configuration
aws s3api put-bucket-cors \
  --bucket pho-chat \
  --cors-configuration file://cors-config.json \
  --region ap-southeast-2

# Verify it was applied
aws s3api get-bucket-cors \
  --bucket pho-chat \
  --region ap-southeast-2
```

**Option B: Using AWS Console**
1. Go to AWS S3 Console
2. Select bucket: pho-chat
3. Click "Permissions" tab
4. Scroll to "Cross-origin resource sharing (CORS)"
5. Click "Edit"
6. Paste the JSON configuration above
7. Click "Save changes"

**Option C: Using TypeScript Script**
```bash
export S3_BUCKET=pho-chat
export S3_REGION=ap-southeast-2
export S3_PUBLIC_DOMAIN=https://pho.chat
npx ts-node scripts/configure-s3-cors.ts
```

### 2. Verify Vercel Environment Variables

Check these are set in Vercel project settings:
- ✓ `S3_BUCKET`: pho-chat
- ✓ `S3_REGION`: ap-southeast-2
- ✓ `S3_ACCESS_KEY_ID`: (should be set)
- ✓ `S3_SECRET_ACCESS_KEY`: (should be set)
- ✓ `S3_PUBLIC_DOMAIN`: https://pho-chat.s3.ap-southeast-2.amazonaws.com
- ✓ `S3_ENABLE_PATH_STYLE`: 0 (for AWS S3)

### 3. Deploy Code Changes

```bash
# Commit the improvements
git add src/services/upload.ts \
        src/store/file/slices/chat/action.ts \
        src/store/file/slices/fileManager/action.ts \
        src/locales/default/error.ts \
        locales/en-US/error.json \
        scripts/configure-s3-cors.ts

git commit -m "fix: improve S3 file upload error handling and CORS detection

- Add specific CORS error detection in upload service
- Improve error messages for better user feedback
- Add CORS error message to locales (Chinese & English)
- Add automated S3 CORS configuration script
- Add error handling in file manager upload"

git push origin thaohienhomes/feat/qr-code-scanning-animation
```

### 4. Test File Upload

After CORS is configured and code is deployed:

1. **Clear browser cache**
   - Ctrl+Shift+Delete (Windows)
   - Cmd+Shift+Delete (Mac)

2. **Hard refresh**
   - Ctrl+Shift+R (Windows)
   - Cmd+Shift+R (Mac)

3. **Test upload scenarios**
   - Small image (< 5MB) ✓
   - Large file (> 50MB) ✓
   - PDF document ✓
   - Video file ✓

4. **Verify in DevTools**
   - Network tab: PUT request should return 200
   - Console: No CORS errors
   - Application tab: File should appear in S3

## Troubleshooting

### Still getting CORS errors?
1. Verify CORS was applied: `aws s3api get-bucket-cors --bucket pho-chat`
2. Check domain matches exactly (https://pho.chat, not pho.chat)
3. Clear browser cache completely
4. Try incognito/private window
5. Check S3 bucket name is correct

### Files upload but don't appear?
1. Verify S3_PUBLIC_DOMAIN is correct
2. Check S3 bucket permissions
3. Verify file size limits
4. Check S3 bucket has public read access

### Pre-signed URL errors?
1. Verify AWS credentials in Vercel
2. Check IAM permissions for AWS user
3. Verify S3_BUCKET name matches

## Files Modified

| File | Changes |
|------|---------|
| `src/services/upload.ts` | Enhanced CORS error detection |
| `src/store/file/slices/chat/action.ts` | Improved error handling |
| `src/store/file/slices/fileManager/action.ts` | Added error handling |
| `src/locales/default/error.ts` | Added CORS error message (Chinese) |
| `locales/en-US/error.json` | Added CORS error message (English) |
| `scripts/configure-s3-cors.ts` | New CORS configuration script |

## Timeline

- **Immediate**: Configure S3 CORS (5-10 minutes)
- **Today**: Deploy code changes and test (30 minutes)
- **Verification**: Monitor Sentry for upload errors (ongoing)

## Success Criteria

✓ File uploads work without CORS errors
✓ Users see clear error messages if issues occur
✓ Files are properly stored in S3
✓ No TypeScript errors
✓ All tests pass
✓ Sentry shows no CORS_ERROR messages

## Support

For issues:
1. Check browser console for error messages
2. Review Sentry for error patterns
3. Verify S3 CORS configuration
4. Check Vercel environment variables
5. Review AWS S3 bucket permissions

