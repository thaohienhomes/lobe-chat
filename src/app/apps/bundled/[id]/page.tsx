import { getUserAuth } from '@lobechat/utils/server';
import { notFound } from 'next/navigation';
import { Flexbox } from 'react-layout-kit';

import { BundledAppModel } from '@/database/models/bundledApp';
import { serverDB } from '@/database/server';
import { PagePropsWithId } from '@/types/next';

import BundledAppLandingView from './BundledAppLandingView';

const BundledAppLandingPage = async (props: PagePropsWithId) => {
  const params = await props.params;
  const { id } = params;

  // Get bundled app (public access - no auth required for viewing)
  const model = new BundledAppModel(serverDB);
  const bundledApp = await model.findById(id);

  if (!bundledApp) {
    notFound();
  }

  // Check if app is public
  if (!bundledApp.isPublic) {
    notFound();
  }

  // Check if user is authenticated
  const auth = await getUserAuth();

  // If user clicks "Start Chat", they need to be authenticated
  // But they can view the landing page without auth

  return (
    <Flexbox height={'100%'} width={'100%'}>
      <BundledAppLandingView bundledApp={bundledApp} isAuthenticated={!!auth} />
    </Flexbox>
  );
};

export default BundledAppLandingPage;

// Make this page dynamic (no static generation)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate metadata for SEO and social sharing
export async function generateMetadata(props: PagePropsWithId) {
  const params = await props.params;
  const { id } = params;

  try {
    const model = new BundledAppModel(serverDB);
    const bundledApp = await model.findById(id);

    if (!bundledApp || !bundledApp.isPublic) {
      return {
        description: 'The requested bundled app could not be found.',
        title: 'Bundled App Not Found',
      };
    }

    const title = `${bundledApp.title} - pho.chat`;
    const description =
      bundledApp.description ||
      `Try ${bundledApp.title} on pho.chat - an AI assistant ready to help you.`;
    const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://pho.chat'}/apps/bundled/${id}`;

    return {
      alternates: {
        canonical: url,
      },
      description,
      openGraph: {
        description,
        images: [
          {
            alt: bundledApp.title,
            height: 630,
            url: bundledApp.avatar || '/images/og-image.png',
            width: 1200,
          },
        ],
        siteName: 'pho.chat',
        title,
        type: 'website',
        url,
      },
      title,
      twitter: {
        card: 'summary_large_image',
        description,
        images: [bundledApp.avatar || '/images/og-image.png'],
        title,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      description: 'Discover and use AI assistants on pho.chat',
      title: 'pho.chat - AI Assistant',
    };
  }
}
