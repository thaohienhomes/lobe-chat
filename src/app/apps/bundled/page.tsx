import { getUserAuth } from '@lobechat/utils/server';
import { Flexbox } from 'react-layout-kit';

import { BundledAppModel } from '@/database/models/bundledApp';
import { serverDB } from '@/database/server';

import BundledAppsDiscoveryView from './BundledAppsDiscoveryView';

const BundledAppsDiscoveryPage = async () => {
  // Get all public bundled apps
  const model = new BundledAppModel(serverDB);
  const [featuredApps, allApps] = await Promise.all([
    model.getFeatured(),
    model.query({ isPublic: true }),
  ]);

  // Check if user is authenticated
  const auth = await getUserAuth();

  return (
    <Flexbox height={'100%'} width={'100%'}>
      <BundledAppsDiscoveryView
        allApps={allApps}
        featuredApps={featuredApps}
        isAuthenticated={!!auth}
      />
    </Flexbox>
  );
};

export default BundledAppsDiscoveryPage;

// Make this page dynamic (no static generation)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate metadata for SEO
export const metadata = {
  description:
    'Discover and use pre-configured AI assistants for various tasks. From code review to content writing, find the perfect AI assistant for your needs.',
  openGraph: {
    description: 'Discover and use pre-configured AI assistants for various tasks.',
    siteName: 'pho.chat',
    title: 'Discover AI Assistants - pho.chat',
    type: 'website',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://pho.chat'}/apps/bundled`,
  },
  title: 'Discover AI Assistants - pho.chat',
  twitter: {
    card: 'summary_large_image',
    description: 'Discover and use pre-configured AI assistants for various tasks.',
    title: 'Discover AI Assistants - pho.chat',
  },
};
