import { Metadata } from 'next';

import ServerLayout from '@/components/server/ServerLayout';
import { metadataModule } from '@/server/metadata';
import { translation } from '@/server/translation';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

import Desktop from './_layout/Desktop';
import Mobile from './_layout/Mobile';
import ManageContent from './features/ManageContent';

export const generateMetadata = async (props: DynamicLayoutProps): Promise<Metadata> => {
  const locale = await RouteVariants.getLocale(props);
  const { t } = await translation('setting', locale);

  return metadataModule.generate({
    description: t('subscription.manage.title', { defaultValue: 'Manage Subscription' }),
    locale,
    title: t('subscription.manage.title', { defaultValue: 'Manage Subscription' }),
    url: '/subscription/manage',
  });
};

const Layout = ServerLayout({ Desktop, Mobile });

const SubscriptionManagePage = async (props: DynamicLayoutProps) => {
  return (
    <Layout {...props}>
      <ManageContent />
    </Layout>
  );
};

export default SubscriptionManagePage;
