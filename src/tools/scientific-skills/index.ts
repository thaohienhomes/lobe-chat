import { BuiltinToolManifest } from '@/types/tool';

import { ScientificSkillsAPIs } from './apis';
import { scientificSkillsSystemPrompt } from './systemRole';

export const ScientificSkillsManifest: BuiltinToolManifest = {
  api: ScientificSkillsAPIs as any,
  identifier: 'pho-scientific-skills',
  meta: {
    avatar: '🔬',
    title: 'Scientific Skills',
  },
  systemRole: scientificSkillsSystemPrompt,
  type: 'builtin',
};
