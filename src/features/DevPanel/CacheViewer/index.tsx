'use client';


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
