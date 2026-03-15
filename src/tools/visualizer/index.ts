import { BuiltinToolManifest } from '@lobechat/types';

import { VisualizerAPIs } from './apis';
import { visualizerSystemPrompt } from './systemRole';

export { VisualizerApiNames } from './apis';

export const VisualizerManifest: BuiltinToolManifest = {
  api: VisualizerAPIs as any,
  identifier: 'pho-visualizer',
  meta: {
    avatar: '📊',
    title: 'Visualizer',
  },
  systemRole: visualizerSystemPrompt,
  type: 'builtin',
};
