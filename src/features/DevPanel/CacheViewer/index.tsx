'use client';

import { Empty } from 'antd';
import { Center } from 'react-layout-kit';

import DataTable from './DataTable';
import { CachePanelContextProvider } from './cacheProvider';

const CacheViewer = () => {
  // Render an empty state first; provider will fetch data client-side
  return (
    <CachePanelContextProvider entries={[]}>
      <DataTable />
    </CachePanelContextProvider>
  );
};

export default CacheViewer;
