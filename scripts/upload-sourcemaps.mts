/**
 * Upload source maps to PostHog for error tracking resolution.
 *
 * Scans .next/static/chunks/ for .js.map files, uploads each to PostHog's
 * error_tracking source map API, then deletes the .map files so they are
 * never served publicly.
 *
 * Required env vars:
 *   POSTHOG_SOURCEMAP_API_KEY  — PostHog personal API key (phx_...)
 *   POSTHOG_PROJECT_ID         — PostHog project ID (e.g. 306983)
 *   NEXT_PUBLIC_APP_URL         — App URL for minified URLs (e.g. https://pho.chat)
 *
 * Usage: tsx scripts/upload-sourcemaps.mts
 */

import { readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const POSTHOG_API_KEY = process.env.POSTHOG_SOURCEMAP_API_KEY;
const PROJECT_ID = process.env.POSTHOG_PROJECT_ID || '306983';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pho.chat';
const POSTHOG_HOST = 'https://us.posthog.com';
const BUILD_DIR = join(process.cwd(), '.next');
const STATIC_DIR = join(BUILD_DIR, 'static');

// ANSI colors
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

interface UploadResult {
  deleted: number;
  errors: number;
  uploaded: number;
}

function findMapFiles(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findMapFiles(fullPath));
      } else if (entry.name.endsWith('.js.map')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory may not exist
  }
  return results;
}

async function uploadSourceMap(mapPath: string): Promise<boolean> {
  const relativePath = relative(BUILD_DIR, mapPath);
  // .next/static/chunks/foo.js.map → /_next/static/chunks/foo.js
  const minifiedUrl = `${APP_URL}/_next/${relativePath.replace(/\.map$/, '')}`;

  const mapContent = readFileSync(mapPath);
  const fileSize = statSync(mapPath).size;

  // Build multipart form data manually (Node 18+ fetch)
  const formData = new FormData();
  const blob = new Blob([mapContent], { type: 'application/json' });
  formData.append('source_map', blob, relativePath.replaceAll('\\', '/'));
  formData.append('minified_url', minifiedUrl);

  try {
    const response = await fetch(
      `${POSTHOG_HOST}/api/projects/${PROJECT_ID}/error_tracking/upload_source_maps/`,
      {
        body: formData,
        headers: {
          Authorization: `Bearer ${POSTHOG_API_KEY}`,
        },
        method: 'POST',
      },
    );

    if (response.ok) {
      console.log(`  ${green('✓')} ${dim(relativePath)} ${dim(`(${(fileSize / 1024).toFixed(0)}KB)`)}`);
      return true;
    } else {
      const text = await response.text().catch(() => '');
      console.log(`  ${red('✗')} ${relativePath} — ${response.status} ${text.slice(0, 100)}`);
      return false;
    }
  } catch (err: any) {
    console.log(`  ${red('✗')} ${relativePath} — ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n📦 PostHog Source Map Upload\n');

  if (!POSTHOG_API_KEY) {
    console.log(yellow('⚠ POSTHOG_SOURCEMAP_API_KEY not set — skipping source map upload'));
    console.log(dim('  Set this env var in Vercel to enable source map resolution in PostHog'));
    return;
  }

  // Find all .map files
  const mapFiles = findMapFiles(STATIC_DIR);
  if (mapFiles.length === 0) {
    console.log(yellow('⚠ No source map files found in .next/static/'));
    console.log(dim('  Ensure NEXT_DISABLE_SOURCEMAPS is not set to 1'));
    return;
  }

  console.log(`Found ${mapFiles.length} source maps to upload\n`);

  // Upload in batches of 10 for performance
  const BATCH_SIZE = 10;
  const result: UploadResult = { deleted: 0, errors: 0, uploaded: 0 };

  for (let i = 0; i < mapFiles.length; i += BATCH_SIZE) {
    const batch = mapFiles.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(batch.map(uploadSourceMap));
    for (const ok of results) {
      if (ok) result.uploaded++;
      else result.errors++;
    }
  }

  // Delete all .map files regardless of upload success
  // (never expose source maps publicly)
  console.log(dim('\nCleaning up .map files...'));
  for (const mapPath of mapFiles) {
    try {
      rmSync(mapPath);
      result.deleted++;
    } catch {
      // Best effort
    }
  }

  console.log(
    `\n${green('Done!')} Uploaded: ${result.uploaded}, Errors: ${result.errors}, Deleted: ${result.deleted}\n`,
  );
}

main().catch((err) => {
  console.error(red('Source map upload failed:'), err.message);
  // Don't fail the build
  process.exit(0);
});
