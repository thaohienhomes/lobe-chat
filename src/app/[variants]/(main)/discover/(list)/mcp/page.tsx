import StructuredData from '@/components/StructuredData';
import { ldModule } from '@/server/ld';
import { metadataModule } from '@/server/metadata';
import { DynamicLayoutProps } from '@/types/next';
import { parsePageMetaProps } from '@/utils/server/pageProps';

import Client from './Client';

// ISR with 5-minute revalidation — Clerk hooks run client-side, not during SSR
export const revalidate = 300;

export const generateMetadata = async (props: DynamicLayoutProps) => {
  const { locale, t } = await parsePageMetaProps(props);

  return metadataModule.generate({
    alternate: true,
    canonical: 'https://lobehub.com/mcp',
    description: t('discover.plugins.description'),
    locale,
    title: t('discover.plugins.title'),
    url: '/discover/mcp',
  });
};

const Page = async (props: DynamicLayoutProps) => {
  const { locale, t, isMobile } = await parsePageMetaProps(props);

  const ld = ldModule.generate({
    description: t('discover.plugins.description'),
    locale,
    title: t('discover.plugins.title'),
    url: '/discover/mcp',
    webpage: {
      enable: true,
      search: '/discover/mcp',
    },
  });

  return (
    <>
      <StructuredData ld={ld} />
      <Client mobile={isMobile} />
    </>
  );
};

Page.DisplayName = 'DiscoverMCP';

export default Page;
