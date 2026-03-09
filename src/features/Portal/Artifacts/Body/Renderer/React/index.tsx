import dynamic from 'next/dynamic';
import { memo, useMemo } from 'react';

import CircleLoading from '@/components/Loading/CircleLoading';
import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';

import ErrorOverlay from './ErrorOverlay';
import { escapeJsxTextContent } from './escapeJsx';
import { createTemplateFiles } from './template';

// Lazy load Sandpack components for better bundle size (~3MB savings)
const SandpackProvider = dynamic(
  () => import('@codesandbox/sandpack-react').then((mod) => mod.SandpackProvider),
  {
    loading: () => <CircleLoading />,
    ssr: false,
  },
);

const SandpackPreview = dynamic(
  () => import('@codesandbox/sandpack-react').then((mod) => mod.SandpackPreview),
  {
    loading: () => <CircleLoading />,
    ssr: false,
  },
);

// Dark theme matching the app's dark UI — prevents white flash in iframe
const DARK_THEME = {
  colors: {
    accent: '#60a5fa',
    surface1: '#0f172a',
    surface2: '#1e293b',
    surface3: '#334155',
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"Fira Code", "Fira Mono", Menlo, Consolas, monospace',
    size: '13px',
  },
} as const;

interface ReactRendererProps {
  code: string;
}

const ReactRenderer = memo<ReactRendererProps>(({ code }) => {
  const title = useChatStore(chatPortalSelectors.artifactTitle);

  // Pre-process JSX to escape bare > < in text content (prevents parse errors)
  const processedCode = useMemo(() => escapeJsxTextContent(code), [code]);

  return (
    <div style={{ background: '#0f172a', height: '100%', position: 'relative', width: '100%' }}>
      <SandpackProvider
        customSetup={{
          dependencies: {
            // Data visualization
            'recharts': '^2.12.7',
            'd3': '^7.9.0',

            // UI Components
            'lucide-react': '^0.469.0',
            '@radix-ui/react-alert-dialog': '^1.1.4',
            '@radix-ui/react-dialog': '^1.1.4',
            '@radix-ui/react-icons': '^1.3.2',

            // Animation
            'framer-motion': '^11.15.0',

            // Utility
            'clsx': '^2.1.1',
            'class-variance-authority': '^0.7.1',
            'tailwind-merge': '^2.6.0',

            // Math / Katex
            'katex': '^0.16.11',
            'react-katex': '^3.0.1',

            // 3D (Three.js ecosystem)
            'three': '^0.170.0',
            '@react-three/fiber': '^8.17.14',
            '@react-three/drei': '^9.122.0',
            '@react-spring/three': '^9.7.5',
          },
        }}
        files={{
          '/App.tsx': processedCode,
          ...createTemplateFiles({ title }),
        }}
        options={{
          externalResources: ['https://cdn.tailwindcss.com'],
        }}
        style={{ height: '100%', position: 'relative' }}
        template="vite-react-ts"
        theme={DARK_THEME}
      >
        {/* Custom error overlay with Copy Error + View Code actions */}
        <ErrorOverlay />
        {/* Preview-only mode: no code editor, maximize preview space */}
        <SandpackPreview
          showNavigator={false}
          showOpenInCodeSandbox={false}
          showRefreshButton
          showSandpackErrorOverlay={false}
          style={{ height: '100%', width: '100%' }}
        />
      </SandpackProvider>
    </div>
  );
});

export default ReactRenderer;
