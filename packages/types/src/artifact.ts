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
  AIRendering = 'application/lobe.artifacts.ai-rendering',
  Code = 'application/lobe.artifacts.code',
  ContentVisualizer = 'application/lobe.artifacts.content-visualizer',
  Default = 'html',
  GenerativeDiagram = 'application/lobe.artifacts.generative-diagram',
  Html = 'text/html',
  InteractiveImage = 'application/lobe.artifacts.interactive-image',
  Mermaid = 'application/lobe.artifacts.mermaid',
  Python = 'python',
  React = 'application/lobe.artifacts.react',
  SVG = 'image/svg+xml',
}
