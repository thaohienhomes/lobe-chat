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

const SandpackLayout = dynamic(
  () => import('@codesandbox/sandpack-react').then((mod) => mod.SandpackLayout),
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
          '@ant-design/icons': 'latest',
          '@lshay/ui': 'latest',
          '@radix-ui/react-alert-dialog': 'latest',
          '@radix-ui/react-dialog': 'latest',
          '@radix-ui/react-icons': 'latest',
          'antd': 'latest',
          'class-variance-authority': 'latest',
          'clsx': 'latest',
          'lucide-react': 'latest',
          'recharts': 'latest',
          'tailwind-merge': 'latest',
        },
      }}
      files={{
        'App.tsx': code,
        ...createTemplateFiles({ title }),
      }}
      options={{
        externalResources: ['https://cdn.tailwindcss.com'],
        visibleFiles: ['App.tsx'],
      }}
      style={{ height: '100%' }}
      template="vite-react-ts"
      theme="auto"
    >
      <SandpackLayout style={{ height: '100%' }}>
        <SandpackPreview style={{ height: '100%' }} />
      </SandpackLayout>
    </SandpackProvider>
  );
});

export default ReactRenderer;
