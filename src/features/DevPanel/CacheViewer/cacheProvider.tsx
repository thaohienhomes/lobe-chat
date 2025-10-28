'use client';

import { usePathname } from 'next/navigation';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
} from 'react';

import type { NextCacheFileData } from './schema';

interface CachePanelContextProps {
  entries: NextCacheFileData[];
  isLoading: boolean;
  refreshData: () => void;
  setEntries: (value: NextCacheFileData[]) => void;
}

const CachePanelContext = createContext<CachePanelContextProps>({
  entries: [],
  isLoading: false,
  refreshData: () => {},
  setEntries: () => {},
});

export const useCachePanelContext = () => useContext(CachePanelContext);

export const CachePanelContextProvider = (
  props: PropsWithChildren<{
    entries: NextCacheFileData[];
  }>,
) => {
  const [isLoading, startTransition] = useTransition();
  const [entries, setEntries] = useState(props.entries);
  const pathname = usePathname();

  const refreshData = () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/dev/cache-files');
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          setEntries(json.data);
        } else {
          setEntries([]);
        }
      } catch {
        setEntries([]);
      }
    });
  };

  useEffect(() => {
    refreshData();
  }, [pathname]);

  return (
    <CachePanelContext.Provider
      value={{
        entries,
        isLoading,
        refreshData,
        setEntries,
      }}
    >
      {props.children}
    </CachePanelContext.Provider>
  );
};
