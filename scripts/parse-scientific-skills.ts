/**
 * Parse SKILL.md files from the claude-scientific-skills repo and generate
 * a JSON registry for use in Pho.Chat's scientific skills integration.
 *
 * Usage: bunx tsx scripts/parse-scientific-skills.ts
 */
import fs from 'node:fs';
import path from 'node:path';

const SKILLS_DIR = path.resolve(__dirname, '../scientific-skills/scientific-skills');
const OUTPUT_FILE = path.resolve(__dirname, '../src/scientific-skills/skills-index.json');

interface SkillMeta {
  description: string;
  license: string;
  name: string;
  slug: string;
}

/**
 * Simple YAML frontmatter parser (avoids gray-matter dependency)
 */
function parseFrontmatter(raw: string): { content: string; data: Record<string, string> } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { content: raw, data: {} };

  const yamlBlock = match[1];
  const content = match[2];
  const data: Record<string, string> = {};

  let currentKey = '';
  let currentValue = '';

  for (const line of yamlBlock.split('\n')) {
    // Skip metadata sub-keys (indented lines like "    skill-author: ...")
    if (line.startsWith(' ') || line.startsWith('\t')) continue;

    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      if (currentKey) data[currentKey] = currentValue.trim();
      currentKey = kvMatch[1];
      currentValue = kvMatch[2].replace(/^["'>]+|["']+$/g, '').trim();
    } else if (currentKey && line.trim()) {
      // Multi-line value continuation
      currentValue += ' ' + line.trim();
    }
  }
  if (currentKey) data[currentKey] = currentValue.trim();

  return { content, data };
}

function main() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`Skills directory not found: ${SKILLS_DIR}`);
    console.error(
      'Please clone the repo first: git clone https://github.com/K-Dense-AI/claude-scientific-skills.git scientific-skills',
    );
    process.exit(1);
  }

  const dirs = fs
    .readdirSync(SKILLS_DIR)
    .filter((d) => fs.existsSync(path.join(SKILLS_DIR, d, 'SKILL.md')));

  console.log(`Found ${dirs.length} skill directories`);

  const index: SkillMeta[] = [];
  const contentMap: Record<string, string> = {};

  for (const dir of dirs) {
    try {
      const raw = fs.readFileSync(path.join(SKILLS_DIR, dir, 'SKILL.md'), 'utf-8');
      const { data, content } = parseFrontmatter(raw);

      index.push({
        description: data.description || '',
        license: data.license || 'MIT',
        name: data.name || dir,
        slug: dir,
      });

      contentMap[dir] = content.trim();
    } catch {
      console.warn(`Failed to parse: ${dir}`);
    }
  }

  // Write metadata index
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`Written ${index.length} skills to ${OUTPUT_FILE}`);

  // Write full content map
  const contentDir = path.resolve(__dirname, '../src/scientific-skills/content');
  fs.mkdirSync(contentDir, { recursive: true });
  fs.writeFileSync(path.join(contentDir, 'skills-content.json'), JSON.stringify(contentMap));
  console.log(`Written skill content to ${contentDir}/skills-content.json`);
}

main();
