/* eslint-disable sort-keys-fix/sort-keys-fix */

/**
 * Profession categories for user onboarding
 * Used to personalize recommendations for agents, plugins, and features
 */
export const PROFESSION_CATEGORIES = [
  {
    id: 'biomedical_researcher',
    icon: '🔬',
    label: {
      en: 'Biomedical Researcher',
      vi: 'Nghiên cứu Y sinh',
    },
    color: '#0ea5e9',
    suggestedAgents: ['biomedical-research-assistant'],
    suggestedPlugins: ['pubmed-search', 'arxiv', 'semantic-scholar', 'doi-resolver'],
    suggestedModels: ['gemini-2.5-pro', 'deepseek-r1'],
    suggestedFeatures: ['web-search'],
  },
  {
    id: 'graduate_researcher',
    icon: '🎓',
    label: {
      en: 'Graduate Student / PhD',
      vi: 'Nghiên cứu sinh / Tiến sĩ',
    },
    color: '#7c3aed',
    suggestedAgents: ['biomedical-research-assistant'],
    suggestedPlugins: ['arxiv', 'semantic-scholar', 'doi-resolver'],
    suggestedModels: ['gemini-2.5-pro', 'deepseek-r1'],
    suggestedFeatures: ['deep-research', 'web-search', 'artifacts'],
  },
  {
    id: 'doctor_physician',
    icon: '👨‍⚕️',
    label: {
      en: 'Doctor / Physician',
      vi: 'Bác sỹ / Y sỹ',
    },
    color: '#14b8a6',
    suggestedAgents: ['clinical-literature-reviewer'],
    suggestedPlugins: [
      'clinical-calculator',
      'pubmed-search',
      'drug-interactions',
      'semantic-scholar',
      'doi-resolver',
    ],
    suggestedModels: ['gemini-2.5-flash', 'gpt-4.1'],
    suggestedFeatures: ['web-search'],
  },
  {
    id: 'pharmacist',
    icon: '💊',
    label: {
      en: 'Pharmacist',
      vi: 'Dược sỹ',
    },
    color: '#8b5cf6',
    suggestedAgents: ['clinical-literature-reviewer'],
    suggestedPlugins: [
      'drug-interactions',
      'clinical-calculator',
      'semantic-scholar',
      'doi-resolver',
    ],
    suggestedModels: ['gemini-2.5-flash', 'gpt-4.1'],
    suggestedFeatures: ['web-search'],
  },
  {
    id: 'nurse',
    icon: '👩‍⚕️',
    label: {
      en: 'Nurse',
      vi: 'Điều dưỡng',
    },
    color: '#ec4899',
    suggestedAgents: ['medical-educator'],
    suggestedPlugins: [],
    suggestedModels: ['gemini-2.0-flash'],
    suggestedFeatures: [],
  },
  {
    id: 'medical_teacher',
    icon: '👩‍🏫',
    label: {
      en: 'Medical Educator',
      vi: 'Giảng viên Y khoa',
    },
    color: '#f59e0b',
    suggestedAgents: ['medical-educator'],
    suggestedPlugins: [],
    suggestedModels: ['gemini-2.5-flash', 'gpt-4.1'],
    suggestedFeatures: ['artifacts'],
  },
  {
    id: 'medical_student',
    icon: '📚',
    label: {
      en: 'Medical Student',
      vi: 'Sinh viên Y',
    },
    color: '#3b82f6',
    suggestedAgents: ['medical-educator'],
    suggestedPlugins: ['semantic-scholar', 'arxiv'],
    suggestedModels: ['gemini-2.0-flash', 'gemini-2.5-flash'],
    suggestedFeatures: ['artifacts'],
  },
  {
    id: 'researcher_general',
    icon: '🔍',
    label: {
      en: 'General Researcher',
      vi: 'Nhà nghiên cứu',
    },
    color: '#6366f1',
    suggestedAgents: ['biomedical-research-assistant'],
    suggestedPlugins: ['arxiv', 'semantic-scholar', 'doi-resolver'],
    suggestedModels: ['gemini-2.5-pro', 'deepseek-r1'],
    suggestedFeatures: ['deep-research', 'web-search'],
  },
  {
    id: 'teacher_educator',
    icon: '🎓',
    label: {
      en: 'Teacher / Educator',
      vi: 'Giảng viên / Giáo viên',
    },
    color: '#10b981',
    suggestedAgents: ['content-writer'],
    suggestedPlugins: [],
    suggestedModels: ['gemini-2.5-flash', 'gpt-4.1'],
    suggestedFeatures: ['artifacts'],
  },
  {
    id: 'developer',
    icon: '💻',
    label: {
      en: 'Developer',
      vi: 'Lập trình viên',
    },
    color: '#64748b',
    suggestedAgents: ['artifact-creator', 'code-reviewer'],
    suggestedPlugins: [],
    suggestedModels: ['gpt-5.2', 'gemini-2.5-pro'],
    suggestedFeatures: ['artifacts'],
  },
  {
    id: 'creative',
    icon: '🎨',
    label: {
      en: 'Content Creator',
      vi: 'Sáng tạo nội dung',
    },
    color: '#f43f5e',
    suggestedAgents: ['content-writer', 'artifact-creator'],
    suggestedPlugins: [],
    suggestedModels: ['gpt-5.2', 'gemini-2.5-flash'],
    suggestedFeatures: ['artifacts'],
  },
  {
    id: 'business',
    icon: '📊',
    label: {
      en: 'Business',
      vi: 'Doanh nghiệp',
    },
    color: '#0891b2',
    suggestedAgents: ['email-writer', 'content-writer'],
    suggestedPlugins: [],
    suggestedModels: ['gemini-2.0-flash'],
    suggestedFeatures: [],
  },
  {
    id: 'other',
    icon: '✨',
    label: {
      en: 'Other',
      vi: 'Khác',
    },
    color: '#9ca3af',
    suggestedAgents: [],
    suggestedPlugins: [],
    suggestedModels: ['gemini-2.0-flash'],
    suggestedFeatures: [],
  },
] as const;

export type ProfessionId = (typeof PROFESSION_CATEGORIES)[number]['id'];

export const getProfessionById = (id: string) => {
  return PROFESSION_CATEGORIES.find((p) => p.id === id);
};

export const getRecommendationsForProfession = (id: string) => {
  const profession = getProfessionById(id);
  if (!profession) return null;

  return {
    agents: profession.suggestedAgents,
    plugins: profession.suggestedPlugins,
    models: profession.suggestedModels,
    features: profession.suggestedFeatures,
  };
};

/**
 * Get aggregated recommendations from multiple professions
 * Deduplicates across all selected professions
 */
export const getAggregatedRecommendations = (professionIds: string[]) => {
  const result = {
    agents: new Set<string>(),
    plugins: new Set<string>(),
    models: new Set<string>(),
    features: new Set<string>(),
  };

  professionIds.forEach((id) => {
    const prof = getProfessionById(id);
    if (prof) {
      prof.suggestedAgents.forEach((a) => result.agents.add(a));
      prof.suggestedPlugins.forEach((p) => result.plugins.add(p));
      prof.suggestedModels.forEach((m) => result.models.add(m));
      prof.suggestedFeatures.forEach((f) => result.features.add(f));
    }
  });

  return {
    agents: [...result.agents],
    features: [...result.features],
    models: [...result.models],
    plugins: [...result.plugins],
  };
};

export interface RecommendationSelections {
  defaultModel?: string;
  enabledAgents: string[];
  enabledFeatures: string[];
  enabledPlugins: string[];
}
