import { getUserAuth } from '@lobechat/utils/server';
import { notFound } from 'next/navigation';
import { Flexbox } from 'react-layout-kit';

import FileViewer from '@/features/FileViewer';
import { createCallerFactory } from '@/libs/trpc/lambda';
import { minimalFileRouter } from '@/server/routers/minimal-file';
import { PagePropsWithId } from '@/types/next';

import FileDetail from '../features/FileDetail';
import Header from './Header';

// Use minimal file router instead of full lambdaRouter to reduce bundle size
// The full lambdaRouter pulls in 200+ MB of dependencies (AWS SDK, file loaders,
// Sharp, AI runtimes, etc.) which causes Vercel serverless function size limit errors.
const createCaller = createCallerFactory(minimalFileRouter);

const FilePage = async (props: PagePropsWithId) => {
  const params = await props.params;

  const { userId } = await getUserAuth();

  const caller = createCaller({ userId });

  const file = await caller.getFileItemById({ id: params.id });

  if (!file) return notFound();

  return (
    <Flexbox horizontal width={'100%'}>
      <Flexbox flex={1}>
        <Flexbox height={'100%'}>
          <Header filename={file.name} id={params.id} url={file.url} />
          <Flexbox height={'100%'} style={{ overflow: 'scroll' }}>
            <FileViewer {...file} />
          </Flexbox>
        </Flexbox>
      </Flexbox>
      <FileDetail {...file} />
    </Flexbox>
  );
};

export default FilePage;
