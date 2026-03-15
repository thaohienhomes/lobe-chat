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
    canonical: 'https://lobehub.com/agent',
    description: t('discover.assistants.description'),
    locale,
    title: t('discover.assistants.title'),
    url: '/discover/assistant',
  });
};

const Page = async (props: DynamicLayoutProps) => {
  const { locale, t, isMobile } = await parsePageMetaProps(props);

  const ld = ldModule.generate({
    description: t('discover.assistants.description'),
    locale,
    title: t('discover.assistants.title'),
    url: '/discover/assistant',
    webpage: {
      enable: true,
      search: '/discover/assistant',
    },
  });

  return (
    <>
      <StructuredData ld={ld} />
      <Client mobile={isMobile} />
    </>
  );
};

Page.DisplayName = 'DiscoverAssistants';

export default Page;
