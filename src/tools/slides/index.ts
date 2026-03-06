import { slidesSystemPrompt } from '@/tools/slides/systemRole';
import { BuiltinToolManifest } from '@/types/tool';

export const SlidesManifest: BuiltinToolManifest = {
  api: [],
  identifier: 'lobe-slides',
  meta: {
    avatar: '🎞️',
    title: 'Slides Creator',
  },
  systemRole: slidesSystemPrompt,
  type: 'builtin',
};
