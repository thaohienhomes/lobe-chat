import { Typography } from '@lobehub/ui';
import { Divider } from 'antd';
import Link from 'next/link';
import urlJoin from 'url-join';

import { CustomMDX } from '@/components/mdx';
import Image from '@/components/mdx/Image';
import { OFFICIAL_SITE } from '@/const/url';
import { Locales } from '@/locales/resources';
import { PhoChangelogService } from '@/server/services/changelog/pho';
import { ChangelogIndexItem } from '@/types/changelog';

import GridLayout from './GridLayout';
import PublishedTime from './PublishedTime';
import VersionTag from './VersionTag';

const Post = async ({
  id,
  mobile,
  versionRange,
  locale,
}: ChangelogIndexItem & { branch?: string; locale: Locales; mobile?: boolean }) => {
  const changelogService = new PhoChangelogService();
  const data = await changelogService.getPostById(id, { locale });

  if (!data || !data.title) return null;

  // Safely construct URL with fallback
  let changelogUrl: string;
  try {
    changelogUrl = urlJoin(OFFICIAL_SITE || 'https://pho.chat', '/changelog', id || '');
  } catch (error) {
    console.warn('Failed to construct changelog URL:', error);
    changelogUrl = `https://pho.chat/changelog/${id || ''}`;
  }

  return (
    <>
      <Divider />
      <GridLayout
        date={
          <PublishedTime
            date={data.date.toISOString()}
            style={{ lineHeight: mobile ? undefined : '60px' }}
            template={'MMMM D, YYYY'}
          />
        }
        mobile={mobile}
      >
        <Typography headerMultiple={mobile ? 0.2 : 0.3}>
          <Link href={changelogUrl} style={{ color: 'inherit' }}>
            <h1 id={id}>{data.rawTitle || data.title}</h1>
          </Link>
          {data.image && <Image alt={data.title || ''} src={data.image} />}
          <CustomMDX source={data.content} />
          <Link href={changelogUrl} style={{ color: 'inherit' }}>
            <VersionTag range={versionRange} />
          </Link>
        </Typography>
      </GridLayout>
    </>
  );
};

export default Post;
