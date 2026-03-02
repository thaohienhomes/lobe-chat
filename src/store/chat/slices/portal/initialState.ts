import { PortalArtifact } from '@/types/artifact';

export enum ArtifactDisplayMode {
  Code = 'code',
  Preview = 'preview',
  Split = 'split', // Side-by-side code + preview
}

export interface PortalFile {
  chunkId?: string;
  chunkText?: string;
  fileId: string;
}

// Extended to support manual content injection
declare module '@/types/artifact' {
  interface PortalArtifact {
    content?: string;
  }
}

export interface ChatPortalState {
  portalArtifact?: PortalArtifact;
  portalArtifactDisplayMode?: ArtifactDisplayMode;
  portalFile?: PortalFile;
  portalMessageDetail?: string;
  portalResearch?: boolean;
  portalThreadId?: string;
  portalToolMessage?: { id: string; identifier: string };
  showPortal: boolean;
}

export const initialChatPortalState: ChatPortalState = {
  portalArtifactDisplayMode: ArtifactDisplayMode.Preview,
  portalResearch: false,
  showPortal: false,
};
