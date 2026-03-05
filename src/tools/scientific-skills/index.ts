import { BuiltinToolManifest } from '@/types/tool';

import { scientificSkillsSystemPrompt } from './systemRole';

export const ScientificSkillsManifest: BuiltinToolManifest = {
  api: [],
  identifier: 'pho-scientific-skills',
  meta: {
    avatar: '🔬',
    title: 'Scientific Skills',
  },
  systemRole: scientificSkillsSystemPrompt,
  type: 'builtin',
};
