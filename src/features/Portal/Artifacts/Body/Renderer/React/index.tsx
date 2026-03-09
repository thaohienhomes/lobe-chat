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
            // UI Libraries
            '@ant-design/icons': 'latest',
            '@lshay/ui': 'latest',
            '@radix-ui/react-alert-dialog': 'latest',
            '@radix-ui/react-dialog': 'latest',
            '@radix-ui/react-icons': 'latest',

            '@react-spring/three': 'latest',

            // 3D Graphics (Three.js ecosystem)
            '@react-three/drei': 'latest',

            '@react-three/fiber': 'latest',

            'antd': 'latest',

            'class-variance-authority': 'latest',

            'clsx': 'latest',

            // Interactive math visualization library
            'd3': 'latest',

            // Data visualization
            // Animation
            'framer-motion': 'latest',

            // Mathematics & Visualization
            'katex': 'latest',

            'lucide-react': 'latest',

            'mafs': 'latest',

            'react-katex': 'latest',

            'recharts': 'latest',

            'tailwind-merge': 'latest',

            'three': 'latest',
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
