/**
 * Seed scientific skills content into LobeChat's knowledge base system.
 * This script reads parsed skill content and prepares it for RAG retrieval.
 *
 * Usage: bunx tsx scripts/seed-scientific-kb.ts
 *
 * Note: This script generates markdown files that can be uploaded to
 * LobeChat's knowledge base through the UI or API. The actual embedding
 * generation and storage happens through LobeChat's built-in RAG pipeline.
 */
import fs from 'node:fs';
import path from 'node:path';

const SKILLS_DIR = path.resolve(__dirname, '../scientific-skills/scientific-skills');
const OUTPUT_DIR = path.resolve(__dirname, '../scientific-skills-kb');

interface SkillChunk {
  content: string;
  domain: string;
  section: string;
  skillName: string;
  slug: string;
}

/**
 * Simple YAML frontmatter parser
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
    if (line.startsWith(' ') || line.startsWith('\t')) continue;
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)$/);
    if (kvMatch) {
      if (currentKey) data[currentKey] = currentValue.trim();
      currentKey = kvMatch[1];
      currentValue = kvMatch[2].replace(/^["'>]+|["']+$/g, '').trim();
    } else if (currentKey && line.trim()) {
      currentValue += ' ' + line.trim();
    }
  }
  if (currentKey) data[currentKey] = currentValue.trim();

  return { content, data };
}

/**
 * Split skill content into semantic chunks by H2 sections
 */
function chunkSkillContent(slug: string, name: string, content: string): SkillChunk[] {
  const sections = content.split(/\n## /);
  const chunks: SkillChunk[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed || trimmed.length < 50) continue;

    const firstLine = trimmed.split('\n')[0];
    const sectionTitle = firstLine.replace(/^#+\s*/, '');

    chunks.push({
      content: `# ${name}\n\n## ${trimmed}`,
      domain: getDomainForSlug(slug),
      section: sectionTitle,
      skillName: name,
      slug,
    });
  }

  return chunks;
}

/**
 * Basic domain classification for a skill slug
 */
function getDomainForSlug(slug: string): string {
  const domainMap: Record<string, string[]> = {
    'bioinformatics': ['scanpy', 'biopython', 'bioservices', 'anndata', 'pysam', 'gget', 'cellxgene-census', 'pydeseq2', 'scvi-tools', 'scvelo', 'deeptools', 'scikit-bio', 'flowio'],
    'clinical-research': ['clinicaltrials-database', 'clinvar-database', 'clinpgx-database', 'cosmic-database', 'clinical-decision-support', 'clinical-reports', 'treatment-plans', 'pyhealth', 'neurokit2', 'fda-database'],
    'communication': ['pubmed-database', 'biorxiv-database', 'openalex-database', 'pyzotero', 'citation-management', 'literature-review', 'scientific-writing', 'peer-review'],
    'data-analysis': ['matplotlib', 'seaborn', 'plotly', 'networkx', 'polars', 'dask', 'geopandas', 'simpy', 'sympy', 'statsmodels', 'statistical-analysis'],
    'drug-discovery': ['rdkit', 'datamol', 'deepchem', 'diffdock', 'medchem', 'molfeat', 'pytdc', 'torchdrug', 'chembl-database', 'drugbank-database', 'pubchem-database', 'zinc-database'],
    'lab-automation': ['opentrons-integration', 'benchling-integration', 'protocolsio-integration', 'labarchive-integration', 'ginkgo-cloud-lab', 'pylabrobot'],
    'machine-learning': ['scikit-learn', 'pytorch-lightning', 'transformers', 'torch_geometric', 'stable-baselines3', 'shap', 'umap-learn', 'pymc', 'pymoo'],
    'materials-science': ['pymatgen', 'cobrapy', 'astropy', 'fluidsim', 'matlab'],
    'proteomics': ['esm', 'adaptyv', 'alphafold-database', 'pdb-database', 'uniprot-database', 'matchms', 'pyopenms'],
  };

  for (const [domain, slugs] of Object.entries(domainMap)) {
    if (slugs.includes(slug)) return domain;
  }
  return 'general';
}

function main() {
  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`Skills directory not found: ${SKILLS_DIR}`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const dirs = fs.readdirSync(SKILLS_DIR).filter((d) =>
    fs.existsSync(path.join(SKILLS_DIR, d, 'SKILL.md')),
  );

  console.log(`Processing ${dirs.length} skills for knowledge base...`);

  let totalChunks = 0;
  const allChunks: SkillChunk[] = [];

  for (const dir of dirs) {
    const raw = fs.readFileSync(path.join(SKILLS_DIR, dir, 'SKILL.md'), 'utf-8');
    const { data, content } = parseFrontmatter(raw);
    const name = data.name || dir;

    // Write individual skill file for KB upload
    const skillContent = `# ${name}\n\n${data.description ? `> ${data.description}\n\n` : ''}${content.trim()}`;
    fs.writeFileSync(path.join(OUTPUT_DIR, `${dir}.md`), skillContent);

    // Create chunks for the index
    const chunks = chunkSkillContent(dir, name, content);
    allChunks.push(...chunks);
    totalChunks += chunks.length;
  }

  // Write chunk index for reference
  const chunkIndex = allChunks.map(({ content: _, ...meta }) => meta);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '_chunk-index.json'),
    JSON.stringify(chunkIndex, null, 2),
  );

  // Write domain summary
  const domains = new Set(allChunks.map((c) => c.domain));
  const domainSummary: Record<string, number> = {};
  for (const domain of domains) {
    domainSummary[domain] = allChunks.filter((c) => c.domain === domain).length;
  }
  fs.writeFileSync(
    path.join(OUTPUT_DIR, '_domain-summary.json'),
    JSON.stringify(domainSummary, null, 2),
  );

  console.log(`Generated ${dirs.length} skill files in ${OUTPUT_DIR}`);
  console.log(`Created ${totalChunks} chunks across ${domains.size} domains`);
  console.log(`Domain distribution:`, domainSummary);
  console.log(`\nTo use with LobeChat Knowledge Base:`);
  console.log(`1. Go to Settings → Knowledge Base → Create New`);
  console.log(`2. Name it "Scientific Skills Library"`);
  console.log(`3. Upload the .md files from ${OUTPUT_DIR}`);
  console.log(`4. Assign the knowledge base to your scientific agents`);
}

main();
