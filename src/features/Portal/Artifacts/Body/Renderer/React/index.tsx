import dynamic from 'next/dynamic';
import { memo } from 'react';

import CircleLoading from '@/components/Loading/CircleLoading';
import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';

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

interface ReactRendererProps {
  code: string;
}

const ReactRenderer = memo<ReactRendererProps>(({ code }) => {
  const title = useChatStore(chatPortalSelectors.artifactTitle);

  return (
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
        '/App.tsx': code,
        ...createTemplateFiles({ title }),
      }}
      options={{
        externalResources: ['https://cdn.tailwindcss.com'],
      }}
      style={{ height: '100%' }}
      template="vite-react-ts"
      theme="auto"
    >
      {/* Preview-only mode: no code editor, maximize preview space */}
      <SandpackPreview
        showNavigator={false}
        showOpenInCodeSandbox={false}
        showRefreshButton
        style={{ height: '100%', width: '100%' }}
      />
    </SandpackProvider>
  );
});

export default ReactRenderer;
