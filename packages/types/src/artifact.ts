export interface PortalArtifact {
  children?: string;
  content?: string; // Manual content injection for previews
  id: string;
  identifier?: string;
  language?: string;
  title?: string;
  type?: string;
}

export enum ArtifactType {
  Code = 'application/lobe.artifacts.code',
  Default = 'html',
  Html = 'text/html',
  Mermaid = 'application/lobe.artifacts.mermaid',
  Python = 'python',
  React = 'application/lobe.artifacts.react',
  SVG = 'image/svg+xml',
}
