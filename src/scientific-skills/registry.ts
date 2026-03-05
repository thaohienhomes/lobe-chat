/**
 * Scientific Skills Registry
 * Provides lookup functions for skill metadata and content.
 */

import { SCIENTIFIC_DOMAINS, type ScientificDomain } from './domains';
import skillsIndex from './skills-index.json';

export interface SkillMeta {
  description: string;
  license: string;
  name: string;
  slug: string;
}

/**
 * All parsed skill metadata
 */
export const allSkills: SkillMeta[] = skillsIndex as SkillMeta[];

/**
 * Get skills belonging to a specific domain
 */
export const getSkillsByDomain = (domainId: string): SkillMeta[] => {
  const domain = SCIENTIFIC_DOMAINS.find((d) => d.id === domainId);
  if (!domain) return [];
  return allSkills.filter((s) => domain.skills.includes(s.slug));
};

/**
 * Get a single skill by slug
 */
export const getSkillBySlug = (slug: string): SkillMeta | undefined => {
  return allSkills.find((s) => s.slug === slug);
};

/**
 * Search skills by keyword in name or description
 */
export const searchSkills = (query: string): SkillMeta[] => {
  const q = query.toLowerCase();
  return allSkills.filter(
    (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q),
  );
};

/**
 * Get all domains
 */
export const getDomains = (): ScientificDomain[] => SCIENTIFIC_DOMAINS;

/**
 * Build a summary of all skills grouped by domain (for system prompt overview)
 */
export const buildSkillsSummary = (): string => {
  const lines: string[] = [];
  for (const domain of SCIENTIFIC_DOMAINS) {
    const domainSkills = allSkills.filter((s) => domain.skills.includes(s.slug));
    if (domainSkills.length === 0) continue;

    lines.push(`### ${domain.avatar} ${domain.name}`);
    lines.push(domain.description);
    lines.push('');
    for (const skill of domainSkills) {
      lines.push(`- **${skill.name}**: ${skill.description.slice(0, 120)}${skill.description.length > 120 ? '...' : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n');
};
