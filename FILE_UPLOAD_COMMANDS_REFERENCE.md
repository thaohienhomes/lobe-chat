# File Upload Fix - Commands Reference

## Quick Start (Copy & Paste)

### Step 1: Configure S3 CORS

**Option A: AWS CLI (Recommended)**
```bash
# Create CORS configuration file
cat > cors-config.json << 'EOF'
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
EOF

# Apply CORS configuration to S3 bucket
aws s3api put-bucket-cors \
  --bucket pho-chat \
  --cors-configuration file://cors-config.json \
  --region ap-southeast-2

# Verify CORS was applied
aws s3api get-bucket-cors \
  --bucket pho-chat \
  --region ap-southeast-2
```

**Option B: TypeScript Script**
```bash
# Set environment variables
export S3_BUCKET=pho-chat
export S3_REGION=ap-southeast-2
export S3_PUBLIC_DOMAIN=https://pho.chat

# Run the CORS configuration script
npx ts-node scripts/configure-s3-cors.ts
```

**Option C: AWS Console**
1. Go to AWS S3 Console: https://s3.console.aws.amazon.com/
2. Select bucket: `pho-chat`
3. Click "Permissions" tab
4. Scroll to "Cross-origin resource sharing (CORS)"
5. Click "Edit"
6. Paste the JSON configuration from Option A
7. Click "Save changes"

### Step 2: Deploy Code Changes

```bash
# Navigate to project root
cd /path/to/lobe-chat

# Add all modified files
git add src/services/upload.ts \
        src/store/file/slices/chat/action.ts \
        src/store/file/slices/fileManager/action.ts \
        src/locales/default/error.ts \
        locales/en-US/error.json \
        scripts/configure-s3-cors.ts

# Commit changes
git commit -m "fix: improve S3 file upload error handling and CORS detection

- Add specific CORS error detection in upload service
- Improve error messages for better user feedback
- Add CORS error message to locales (Chinese & English)
- Add automated S3 CORS configuration script
- Add error handling in file manager upload"

# Push to remote
git push origin thaohienhomes/feat/qr-code-scanning-animation
```

### Step 3: Verify Changes

```bash
# Type check
bun run type-check

# Run tests (if applicable)
bunx vitest run --silent='passed-only' 'src/services/upload.ts'
bunx vitest run --silent='passed-only' 'src/store/file/slices/chat/action.ts'
```

### Step 4: Test File Upload

```bash
# Clear browser cache and hard refresh
# Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
# Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# Then test uploading files in the UI
```

## Verification Commands

### Verify CORS Configuration

```bash
# Check if CORS is configured on S3 bucket
aws s3api get-bucket-cors \
  --bucket pho-chat \
  --region ap-southeast-2

# Expected output:
# {
#   "CORSRules": [
#     {
#       "AllowedHeaders": ["*"],
#       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
#       "AllowedOrigins": ["https://pho.chat", "http://localhost:3000", "http://localhost:3015"],
#       "ExposeHeaders": ["ETag", "x-amz-version-id"],
#       "MaxAgeSeconds": 3000
#     }
#   ]
# }
```

### Verify S3 Bucket Exists

```bash
# List S3 buckets
aws s3 ls

# Should show: pho-chat
```

### Verify S3 Bucket Region

```bash
# Get bucket location
aws s3api get-bucket-location --bucket pho-chat

# Should show: ap-southeast-2
```

### Verify S3 Bucket Permissions

```bash
# Get bucket ACL
aws s3api get-bucket-acl --bucket pho-chat

# Get bucket policy
aws s3api get-bucket-policy --bucket pho-chat
```

## Troubleshooting Commands

### If CORS Configuration Fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check S3 bucket access
aws s3 ls s3://pho-chat --region ap-southeast-2

# Check IAM permissions
aws iam get-user
```

### If Files Don't Upload

```bash
# Check S3 bucket contents
aws s3 ls s3://pho-chat/files/ --recursive --region ap-southeast-2

# Check file permissions
aws s3api head-object --bucket pho-chat --key files/test.txt --region ap-southeast-2
```

### If Pre-signed URL Generation Fails

```bash
# Check S3 module configuration
grep -r "S3_BUCKET\|S3_REGION\|S3_ACCESS_KEY" .env.local

# Check Vercel environment variables
vercel env ls
```

## Monitoring Commands

### Monitor Sentry for Upload Errors

```bash
# Check Sentry for CORS_ERROR messages
# Go to: https://sentry.io/organizations/pho-chat/issues/
# Filter by: "CORS_ERROR" or "upload"
```

### Monitor S3 Upload Activity

```bash
# List recent uploads
aws s3 ls s3://pho-chat/files/ --recursive --region ap-southeast-2 --human-readable --summarize

# Check S3 bucket size
aws s3 ls s3://pho-chat --recursive --region ap-southeast-2 --human-readable --summarize
```

### Monitor CloudWatch Logs

```bash
# Check CloudWatch logs for S3 access
aws logs describe-log-groups --region ap-southeast-2

# Check specific log group
aws logs tail /aws/s3/pho-chat --follow --region ap-southeast-2
```

## Rollback Commands

### If Something Goes Wrong

```bash
# Remove CORS configuration (rollback)
aws s3api delete-bucket-cors --bucket pho-chat --region ap-southeast-2

# Verify CORS was removed
aws s3api get-bucket-cors --bucket pho-chat --region ap-southeast-2
# Should return: An error occurred (NoSuchCORSConfiguration)

# Revert code changes
git revert HEAD
git push origin thaohienhomes/feat/qr-code-scanning-animation
```

## Environment Variables to Verify

```bash
# Check these are set in Vercel
echo "S3_BUCKET: $S3_BUCKET"
echo "S3_REGION: $S3_REGION"
echo "S3_ACCESS_KEY_ID: $S3_ACCESS_KEY_ID"
echo "S3_SECRET_ACCESS_KEY: $S3_SECRET_ACCESS_KEY"
echo "S3_PUBLIC_DOMAIN: $S3_PUBLIC_DOMAIN"
echo "S3_ENABLE_PATH_STYLE: $S3_ENABLE_PATH_STYLE"

# Expected values:
# S3_BUCKET: pho-chat
# S3_REGION: ap-southeast-2
# S3_ACCESS_KEY_ID: (should be set)
# S3_SECRET_ACCESS_KEY: (should be set)
# S3_PUBLIC_DOMAIN: https://pho-chat.s3.ap-southeast-2.amazonaws.com
# S3_ENABLE_PATH_STYLE: 0
```

## Git Commands

```bash
# Check current branch
git branch

# Check uncommitted changes
git status

# View changes before committing
git diff src/services/upload.ts

# View commit history
git log --oneline -10

# Push to remote
git push origin thaohienhomes/feat/qr-code-scanning-animation

# Create pull request (if needed)
# Go to: https://github.com/thaohienhomes/lobe-chat/pulls
```

## Testing Commands

```bash
# Run type check
bun run type-check

# Run specific test file
bunx vitest run --silent='passed-only' 'src/services/upload.ts'

# Run all tests (takes ~10 minutes)
# bun run test  # DON'T RUN - takes too long

# Run tests in watch mode
bunx vitest watch 'src/services/upload.ts'
```

## Useful Links

- AWS S3 Console: https://s3.console.aws.amazon.com/
- Sentry Dashboard: https://sentry.io/organizations/pho-chat/
- Vercel Dashboard: https://vercel.com/dashboard
- GitHub Repository: https://github.com/thaohienhomes/lobe-chat
- AWS CLI Documentation: https://docs.aws.amazon.com/cli/
- S3 CORS Documentation: https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html

## Quick Reference

| Command | Purpose |
|---------|---------|
| `aws s3api put-bucket-cors` | Apply CORS configuration |
| `aws s3api get-bucket-cors` | Verify CORS configuration |
| `aws s3api delete-bucket-cors` | Remove CORS configuration |
| `aws s3 ls` | List S3 buckets |
| `aws s3 ls s3://bucket-name` | List bucket contents |
| `git add .` | Stage all changes |
| `git commit -m "message"` | Commit changes |
| `git push` | Push to remote |
| `bun run type-check` | Check TypeScript errors |
| `bunx vitest run` | Run tests |

