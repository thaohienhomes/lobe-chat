/**
 * Bundled Plugins Configuration
 * These plugins are self-hosted within Phở Chat and available for all users
 */
import { PluginCategory } from '@/types/discover';

/**
 * Bundled plugin type that matches DiscoverPluginItem structure
 * Properties from Meta (avatar, title, description, tags) are at root level
 */
interface BundledPlugin {
  author: string;
  avatar: string;
  category?: PluginCategory;
  createdAt: string;
  description: string;
  homepage: string;
  identifier: string;
  manifest: string;
  schemaVersion: number;
  tags: string[];
  title: string;
}

/**
 * Get the base URL for plugin manifests
 * Uses relative paths in development, absolute in production
 */
const getManifestUrl = (pluginId: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  return `${baseUrl}/api/plugins/${pluginId}/manifest`;
};

/**
 * Bundled plugins that are pre-installed or available in the store
 * These are self-hosted plugins created specifically for Phở Chat
 */
export const BUNDLED_PLUGINS: BundledPlugin[] = [
  {
    author: 'Phở Chat',
    avatar: '🔬',
    category: PluginCategory.ScienceEducation,
    createdAt: '2026-02-04',
    description:
      'Search PubMed for biomedical research articles, clinical studies, and medical literature',
    homepage: 'https://pho.chat/plugins/pubmed',
    identifier: 'pubmed-search',
    manifest: getManifestUrl('pubmed'),
    schemaVersion: 1,
    tags: ['biomedical', 'research', 'pubmed', 'medical', 'science'],
    title: 'PubMed Search',
  },
  {
    author: 'Phở Chat',
    avatar: '🩺',
    category: PluginCategory.ScienceEducation,
    createdAt: '2026-02-04',
    description: 'Calculate BMI, GFR, MELD, Creatinine Clearance, and other clinical formulas',
    homepage: 'https://pho.chat/plugins/clinical-calc',
    identifier: 'clinical-calculator',
    manifest: getManifestUrl('clinical-calc'),
    schemaVersion: 1,
    tags: ['medical', 'clinical', 'calculator', 'healthcare', 'formulas'],
    title: 'Clinical Calculator',
  },
  {
    author: 'Phở Chat',
    avatar: '📚',
    category: PluginCategory.ScienceEducation,
    createdAt: '2026-02-04',
    description: 'Search arXiv for preprint research papers in science and technology',
    homepage: 'https://pho.chat/plugins/arxiv',
    identifier: 'arxiv',
    manifest: getManifestUrl('arxiv'),
    schemaVersion: 1,
    tags: ['research', 'arxiv', 'preprint', 'science', 'academic'],
    title: 'ArXiv Search',
  },
  {
    author: 'Phở Chat',
    avatar: '💊',
    category: PluginCategory.ScienceEducation,
    createdAt: '2026-02-04',
    description: 'Check drug interactions and search FDA drug database',
    homepage: 'https://pho.chat/plugins/drug-interactions',
    identifier: 'drug-interactions',
    manifest: getManifestUrl('drug-interactions'),
    schemaVersion: 1,
    tags: ['drug', 'interaction', 'pharmacy', 'fda', 'medical'],
    title: 'Drug Interactions',
  },
];

/**
 * Get bundled plugin by identifier
 */
export const getBundledPluginById = (identifier: string): BundledPlugin | undefined => {
  return BUNDLED_PLUGINS.find((p) => p.identifier === identifier);
};

/**
 * Check if a plugin identifier is a bundled plugin
 */
export const isBundledPlugin = (identifier: string): boolean => {
  return BUNDLED_PLUGINS.some((p) => p.identifier === identifier);
};

/**
 * Get all bundled plugin identifiers
 */
export const getBundledPluginIds = (): string[] => {
  return BUNDLED_PLUGINS.map((p) => p.identifier);
};
