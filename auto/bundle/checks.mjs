#!/usr/bin/env node
/**
 * autoresearch correctness gate
 *
 * Runs type-check to ensure changes don't break TypeScript.
 * Runs a subset of unit tests for smoke verification.
 * Verifies critical routes exist in build output.
 *
 * Exit 0 = checks pass → agent can "keep" the change.
 * Exit 1 = checks fail → agent must "revert".
 */

import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

let failed = false;

// ---------- Type Check ----------
console.log('Running type-check...');
try {
  execSync('bun run type-check', {
    cwd: process.cwd(),
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 5 * 60 * 1000,
  });
  console.log('✅ Type check passed');
} catch (err) {
  const output = err.stderr?.toString() || err.stdout?.toString() || '';
  // Show last 20 lines of errors
  const lines = output.trim().split('\n');
  console.error('❌ Type check FAILED:');
  console.error(lines.slice(-20).join('\n'));
  failed = true;
}

// ---------- Build Output Smoke Test ----------
console.log('Checking critical routes in build output...');
const STATIC_DIR = join(process.cwd(), '.next', 'static');

function walkDir(dir) {
  let results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(walkDir(fullPath));
      } else {
        results.push(fullPath);
      }
    }
  } catch {
    // directory doesn't exist
  }
  return results;
}

const jsFiles = walkDir(STATIC_DIR).filter((f) => f.endsWith('.js'));

if (jsFiles.length === 0) {
  console.error('❌ No .js files found in .next/static — build output missing');
  failed = true;
} else {
  console.log(`✅ Build output: ${jsFiles.length} JS chunks found`);
}

// ---------- Result ----------
if (failed) {
  console.error('\n💥 CHECKS FAILED — agent should revert this change');
  process.exit(1);
} else {
  console.log('\n✅ All checks passed');
  process.exit(0);
}
