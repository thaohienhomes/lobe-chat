import { StateCreator } from 'zustand/vanilla';

import { ChatStore } from '@/store/chat/store';
import { ArtifactType, PortalArtifact } from '@/types/artifact';

import { ArtifactDisplayMode, PortalFile } from './initialState';

// Artifact types that support live preview (used to decide initial display mode)
const PREVIEWABLE_ARTIFACT_TYPES = new Set<string>([
  ArtifactType.React,
  ArtifactType.Mermaid,
  ArtifactType.SVG,
  ArtifactType.InteractiveImage,
  ArtifactType.GenerativeDiagram,
  ArtifactType.ContentVisualizer,
  ArtifactType.AIRendering,
  // Also match raw MIME strings that may be used before enum mapping
  'text/html',
]);

export interface ChatPortalAction {
  clearPendingResearchQuery: () => void;
  closeArtifact: () => void;
  closeDeepResearch: () => void;
  closeFilePreview: () => void;
  closeMessageDetail: () => void;
  closeResearchMode: () => void;
  closeToolUI: () => void;
  openArtifact: (artifact: PortalArtifact) => void;
  openDeepResearch: (query?: string) => void;
  openFilePreview: (portal: PortalFile) => void;
  openMessageDetail: (messageId: string) => void;
  openResearchMode: (query?: string) => void;
  openToolUI: (messageId: string, identifier: string) => void;
  togglePortal: (open?: boolean) => void;
}

export const chatPortalSlice: StateCreator<
  ChatStore,
  [['zustand/devtools', never]],
  [],
  ChatPortalAction
> = (set, get) => ({
  clearPendingResearchQuery: () => {
    set({ pendingResearchQuery: undefined }, false, 'clearPendingResearchQuery');
  },
  closeArtifact: () => {
    get().togglePortal(false);
    set({ portalArtifact: undefined }, false, 'closeArtifact');
  },
  closeDeepResearch: () => {
    get().togglePortal(false);
    set({ portalDeepResearch: false }, false, 'closeDeepResearch');
  },
  closeFilePreview: () => {
    set({ portalFile: undefined }, false, 'closeFilePreview');
  },
  closeMessageDetail: () => {
    set({ portalMessageDetail: undefined }, false, 'openMessageDetail');
  },
  closeResearchMode: () => {
    get().togglePortal(false);
    set({ portalResearch: false }, false, 'closeResearchMode');
  },
  closeToolUI: () => {
    set({ portalToolMessage: undefined }, false, 'closeToolUI');
  },
  openArtifact: (artifact) => {
    get().togglePortal(true);

    // For previewable types: start in Split mode (code left + live preview right)
    // matching Claude.ai UX where user sees preview building in real-time.
    // After generation ends, Body/index.tsx auto-switches to full Preview mode.
    const initialDisplayMode = artifact.type && PREVIEWABLE_ARTIFACT_TYPES.has(artifact.type)
      ? ArtifactDisplayMode.Split
      : ArtifactDisplayMode.Code;

    // Dismiss Deep Research / Research panels so artifact panel takes priority
    // in the router (DeepResearch is at index 0, Artifacts at index 4 — first enabled wins).
    set(
      {
        portalArtifact: artifact,
        portalArtifactDisplayMode: initialDisplayMode,
        portalDeepResearch: false,
        portalResearch: false,
      },
      false,
      'openArtifact',
    );
  },
  openDeepResearch: (query) => {
    get().togglePortal(true);

    set({ pendingResearchQuery: query, portalDeepResearch: true, portalResearch: false }, false, 'openDeepResearch');
  },
  openFilePreview: (portal) => {
    get().togglePortal(true);

    set({ portalFile: portal }, false, 'openFilePreview');
  },
  openMessageDetail: (messageId) => {
    get().togglePortal(true);

    set({ portalMessageDetail: messageId }, false, 'openMessageDetail');
  },
  openResearchMode: (query) => {
    get().togglePortal(true);

    set({ pendingResearchQuery: query, portalDeepResearch: false, portalResearch: true }, false, 'openResearchMode');
  },

  openToolUI: (id, identifier) => {
    get().togglePortal(true);

    set({ portalToolMessage: { id, identifier } }, false, 'openToolUI');
  },
  togglePortal: (open) => {
    const showInspector = open === undefined ? !get().showPortal : open;
    set({ showPortal: showInspector }, false, 'toggleInspector');
  },
  // updateArtifactContent: (content) => {
  //   set({ portalArtifact: content }, false, 'updateArtifactContent');
  // },
});
