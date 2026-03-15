/**
 * Visualizer builtin tool action handlers.
 *
 * These handlers are matched by `transformApiArgumentsToAiState` using the apiName
 * as the key. The key names must match VisualizerApiNames values exactly.
 *
 * - show_widget: Returns confirmation string. Actual rendering is handled client-side
 *   by the VisualizerRenderer component which reads the tool call arguments directly.
 * - visualizer_read_me: Returns design guidelines text for the LLM to follow.
 *   Uses ModuleManager to provide rich, per-module content.
 */
import { StateCreator } from 'zustand/vanilla';

import { getModuleContent } from '@/features/visualizer/modules';

import { ToolStore } from '../../store';

interface ShowWidgetParams {
  i_have_seen_read_me: boolean;
  loading_messages: string[];
  title: string;
  widget_code: string;
}

interface VisualizerReadMeParams {
  modules: string[];
}

function handleShowWidget(params: ShowWidgetParams) {
  // Must return valid JSON — BuiltinType checks isJSON and bails out otherwise.
  // The actual widget rendering uses `args` (tool arguments), not `content` (tool result).
  return JSON.stringify({ status: 'rendered', title: params.title });
}

function handleVisualizerReadMe(params: VisualizerReadMeParams) {
  // Return rich per-module guidelines via ModuleManager
  const guidelines = getModuleContent(params.modules);
  return JSON.stringify({
    guidelines,
    modules: params.modules,
  });
}

export interface VisualizerToolAction {
  // Key names MUST match VisualizerApiNames values
  /* eslint-disable @typescript-eslint/naming-convention */
  show_widget: (params: ShowWidgetParams) => string;
  visualizer_read_me: (params: VisualizerReadMeParams) => string;
  /* eslint-enable @typescript-eslint/naming-convention */
}

export const createVisualizerToolSlice: StateCreator<
  ToolStore,
  [['zustand/devtools', never]],
  [],
  VisualizerToolAction
> = () => ({
  show_widget: handleShowWidget,
  visualizer_read_me: handleVisualizerReadMe,
});
