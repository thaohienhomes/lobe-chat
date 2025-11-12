#!/usr/bin/env node
/**
 * Configure S3 CORS policy for pho.chat file uploads
 *
 * Usage:
 *   npx ts-node scripts/configure-s3-cors.ts
 *
 * Prerequisites:
 *   - AWS CLI configured with credentials
 *   - S3_BUCKET environment variable set
 *   - S3_REGION environment variable set
 */
import { PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3';

const BUCKET_NAME = process.env.S3_BUCKET || 'pho-chat';
const REGION = process.env.S3_REGION || 'ap-southeast-2';
const DOMAIN = process.env.S3_PUBLIC_DOMAIN || 'https://pho.chat';

// CORS configuration for pho.chat
const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: [
        DOMAIN,
        'http://localhost:3000',
        'http://localhost:3015', // Desktop client
      ],
      ExposeHeaders: ['ETag', 'x-amz-version-id'],
      MaxAgeSeconds: 3000,
    },
  ],
};

try {
  console.log(`🔧 Configuring S3 CORS for bucket: ${BUCKET_NAME}`);
  console.log(`📍 Region: ${REGION}`);
  console.log(`🌐 Domain: ${DOMAIN}`);

  const client = new S3Client({ region: REGION });
  const command = new PutBucketCorsCommand({
    Bucket: BUCKET_NAME,
    CORSConfiguration: corsConfiguration,
  });

  await client.send(command);

  console.log('✅ S3 CORS configuration updated successfully!');
  console.log('\nCORS Rules:');
  console.log(JSON.stringify(corsConfiguration, null, 2));
} catch (error) {
  console.error('❌ Failed to configure S3 CORS:', error);
  process.exit(1);
}
