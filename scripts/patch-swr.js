/**
 * Patch SWR's package.json to remove react-server export conditions.
 *
 * SWR v2's react-server exports only expose SWRConfig + unstable_serialize,
 * which causes build failures when Next.js RSC compilation picks up the
 * "react-server" condition for files importing useSWR or mutate.
 *
 * This script runs as a postinstall hook and removes the react-server
 * conditions so webpack always resolves to the full entry (index.mjs).
 */

const fs = require('fs');
const path = require('path');

function patchPackage(pkgName) {
  try {
    const pkgJsonPath = require.resolve(`${pkgName}/package.json`);
    const raw = fs.readFileSync(pkgJsonPath, 'utf8');
    const pkg = JSON.parse(raw);

    if (!pkg.exports) return;

    let modified = false;
    for (const [key, value] of Object.entries(pkg.exports)) {
      if (value && typeof value === 'object' && 'react-server' in value) {
        delete value['react-server'];
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`[patch-swr] Patched ${pkgJsonPath}: removed react-server export conditions`);
    }
  } catch (e) {
    console.warn(`[patch-swr] Skipped ${pkgName}: ${e.message}`);
  }
}

patchPackage('swr');
