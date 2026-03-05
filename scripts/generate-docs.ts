/**
 * scripts/generate-docs.ts
 *
 * Auto-generate documentation from codebase:
 * - Scan src/tools/ for builtin tool manifests → generate tools catalog MDX
 * - Scan src/scientific-skills/skills-index.json → generate skills catalog MDX
 * - Scan src/app/api/ → generate API reference MDX
 *
 * Usage: npx tsx scripts/generate-docs.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const DOCS_DIR = path.resolve(__dirname, '../docs-site');
const SRC_DIR = path.resolve(__dirname, '../src');

// ─────────────────────────────────────────────
// 1. Generate Skills Catalog
// ─────────────────────────────────────────────
function generateSkillsCatalog() {
    const skillsIndexPath = path.join(SRC_DIR, 'scientific-skills/skills-index.json');
    if (!fs.existsSync(skillsIndexPath)) {
        console.log('⚠️  skills-index.json not found, skipping skills catalog');
        return;
    }

    const skills = JSON.parse(fs.readFileSync(skillsIndexPath, 'utf-8'));
    const grouped: Record<string, any[]> = {};

    for (const skill of skills) {
        const domain = skill.domain || 'Other';
        if (!grouped[domain]) grouped[domain] = [];
        grouped[domain].push(skill);
    }

    let mdx = `---
title: Skills Catalog (Auto-generated)
description: Danh sách đầy đủ ${skills.length} scientific skills — tự động cập nhật từ codebase
---

# Skills Catalog 📚

> Trang này được **tự động generate** từ \`src/scientific-skills/skills-index.json\`.
> Cập nhật lần cuối: ${new Date().toISOString().split('T')[0]}

**Tổng cộng:** ${skills.length} skills | ${Object.keys(grouped).length} domains

`;

    for (const [domain, domainSkills] of Object.entries(grouped).sort()) {
        mdx += `## ${domain} (${domainSkills.length} skills)\n\n`;
        mdx += `| Skill | Mô tả |\n|---|---|\n`;
        for (const skill of domainSkills) {
            const desc = (skill.description || '').replace(/\|/g, '\\|').slice(0, 120);
            mdx += `| ${skill.name} | ${desc} |\n`;
        }
        mdx += `\n`;
    }

    const outPath = path.join(DOCS_DIR, 'features/skills-catalog.mdx');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, mdx, 'utf-8');
    console.log(`✅ Generated skills catalog: ${skills.length} skills → ${outPath}`);
}

// ─────────────────────────────────────────────
// 2. Generate API Reference from route files
// ─────────────────────────────────────────────
function generateApiReference() {
    const apiDir = path.join(SRC_DIR, 'app/api');
    const routes: { path: string; file: string }[] = [];

    function scanRoutes(dir: string, prefix: string) {
        if (!fs.existsSync(dir)) return;
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            if (entry.isDirectory()) {
                scanRoutes(path.join(dir, entry.name), `${prefix}/${entry.name}`);
            } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
                routes.push({
                    path: prefix,
                    file: path.join(dir, entry.name),
                });
            }
        }
    }

    scanRoutes(apiDir, '/api');

    let mdx = `---
title: API Endpoints (Auto-generated)
description: Danh sách tất cả ${routes.length} API endpoints — tự động cập nhật từ codebase
---

# API Endpoints 📡

> Trang này được **tự động generate** từ \`src/app/api/\`.
> Cập nhật lần cuối: ${new Date().toISOString().split('T')[0]}

**Tổng cộng:** ${routes.length} endpoints

| Endpoint | HTTP Methods |
|---|---|
`;

    for (const route of routes.sort((a, b) => a.path.localeCompare(b.path))) {
        // Quick scan for exported methods
        const content = fs.readFileSync(route.file, 'utf-8');
        const methods: string[] = [];
        if (content.includes('export async function GET') || content.includes('export const GET'))
            methods.push('GET');
        if (content.includes('export async function POST') || content.includes('export const POST'))
            methods.push('POST');
        if (content.includes('export async function PUT') || content.includes('export const PUT'))
            methods.push('PUT');
        if (
            content.includes('export async function DELETE') ||
            content.includes('export const DELETE')
        )
            methods.push('DELETE');
        if (
            content.includes('export async function PATCH') ||
            content.includes('export const PATCH')
        )
            methods.push('PATCH');

        mdx += `| \`${route.path}\` | ${methods.join(', ') || 'N/A'} |\n`;
    }

    const outPath = path.join(DOCS_DIR, 'api-reference/endpoints.mdx');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, mdx, 'utf-8');
    console.log(`✅ Generated API reference: ${routes.length} endpoints → ${outPath}`);
}

// ─────────────────────────────────────────────
// 3. Generate Tools Catalog
// ─────────────────────────────────────────────
function generateToolsCatalog() {
    const toolsDir = path.join(SRC_DIR, 'tools');
    if (!fs.existsSync(toolsDir)) {
        console.log('⚠️  src/tools/ not found, skipping tools catalog');
        return;
    }

    const tools: { name: string; manifest: string }[] = [];

    for (const entry of fs.readdirSync(toolsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const manifestPath = path.join(toolsDir, entry.name, 'manifest.json');
        const indexPath = path.join(toolsDir, entry.name, 'index.ts');

        if (fs.existsSync(manifestPath)) {
            tools.push({ name: entry.name, manifest: manifestPath });
        } else if (fs.existsSync(indexPath)) {
            tools.push({ name: entry.name, manifest: indexPath });
        }
    }

    let mdx = `---
title: Builtin Tools (Auto-generated)
description: Danh sách ${tools.length} builtin tools — tự động cập nhật từ codebase
---

# Builtin Tools 🔧

> Trang này được **tự động generate** từ \`src/tools/\`.
> Cập nhật lần cuối: ${new Date().toISOString().split('T')[0]}

**Tổng cộng:** ${tools.length} tools

| Tool | Directory |
|---|---|
`;

    for (const tool of tools.sort((a, b) => a.name.localeCompare(b.name))) {
        mdx += `| ${tool.name} | \`src/tools/${tool.name}/\` |\n`;
    }

    const outPath = path.join(DOCS_DIR, 'features/tools-catalog.mdx');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, mdx, 'utf-8');
    console.log(`✅ Generated tools catalog: ${tools.length} tools → ${outPath}`);
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main() {
    console.log('📝 Generating documentation...\n');

    generateSkillsCatalog();
    generateApiReference();
    generateToolsCatalog();

    console.log('\n✅ Done! Generated docs are in docs-site/');
    console.log('   Run `mintlify dev` in docs-site/ to preview locally.');
}

main().catch(console.error);
