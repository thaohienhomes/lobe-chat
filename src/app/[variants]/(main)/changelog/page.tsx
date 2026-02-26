import { Divider, Skeleton } from 'antd';
import { notFound } from 'next/navigation';
import { Fragment, Suspense } from 'react';
import { Flexbox } from 'react-layout-kit';
import urlJoin from 'url-join';

import { UpdateChangelogStatusWrapper as UpdateChangelogStatus } from '@/app/[variants]/@modal/(.)changelog/modal/features/UpdateChangelogStatusWrapper';
import StructuredData from '@/components/StructuredData';
import { serverFeatureFlags } from '@/config/featureFlags';
import { BRANDING_NAME } from '@/const/branding';
import { OFFICIAL_SITE } from '@/const/url';
import { ldModule } from '@/server/ld';
import { metadataModule } from '@/server/metadata';
import { PhoChangelogService } from '@/server/services/changelog/pho';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import GridLayout from './features/GridLayout';
import Post from './features/Post';

export const dynamic = 'force-dynamic';

export const generateMetadata = async (props: DynamicLayoutProps) => {
  const locale = await RouteVariants.getLocale(props);
  const { t } = await translation('metadata', locale);
  return metadataModule.generate({
    canonical: urlJoin(OFFICIAL_SITE, 'changelog'),
    description: t('changelog.description', { appName: BRANDING_NAME }),
    title: t('changelog.title'),
    url: '/changelog',
  });
};

const Page = async (props: DynamicLayoutProps) => {
  const hideDocs = serverFeatureFlags().hideDocs;
  if (hideDocs) return notFound();

  const { isMobile, locale } = await RouteVariants.getVariantsFromProps(props);
  const { t } = await translation('metadata', locale);
  const changelogService = new PhoChangelogService();
  const data = await changelogService.getChangelogIndex();

  if (!data) return notFound();

  const ld = ldModule.generate({
    description: t('changelog.description', { appName: BRANDING_NAME }),
    title: t('changelog.title', { appName: BRANDING_NAME }),
    url: '/changelog',
  });

  return (
    <>
      <StructuredData ld={ld} />
      <Flexbox gap={isMobile ? 16 : 48}>
        {data?.map((item) => (
          <Fragment key={item.id}>
            <Suspense
              fallback={
                <GridLayout>
                  <Divider />
                  <Skeleton active paragraph={{ rows: 5 }} />
                </GridLayout>
              }
            >
              <Post locale={locale} mobile={isMobile} {...item} />
            </Suspense>
          </Fragment>
        ))}
      </Flexbox>
      {/* Pagination removed - Phở Chat has only 3 changelogs */}
      <UpdateChangelogStatus currentId={data[0]?.id} />
    </>
  );
};

export default Page;
