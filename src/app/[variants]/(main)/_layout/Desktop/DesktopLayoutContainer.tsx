import { useTheme } from 'antd-style';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { PropsWithChildren, memo } from 'react';
import { Flexbox } from 'react-layout-kit';

// Lazy-load SideBar — it's not part of the LCP element (the main content area is).
// This defers parsing/evaluating SideBar + its subcomponents (Avatar, TopActions,
// BottomActions, PinList) and their dependencies (@lobehub/ui SideNav, store selectors).
const SideBar = dynamic(() => import('./SideBar'));

const DesktopLayoutContainer = memo<PropsWithChildren>(({ children }) => {
  const theme = useTheme();
  const pathname = usePathname();
  const hideSideBar = pathname.startsWith('/settings');
  return (
    <>
      {!hideSideBar && <SideBar />}
      <Flexbox
        style={{
          background: theme.colorBgLayout,
          borderInlineStart: `1px solid ${theme.colorBorderSecondary}`,
          borderStartStartRadius: !hideSideBar ? 12 : undefined,
          borderTop: `1px solid ${theme.colorBorderSecondary}`,
          overflow: 'hidden',
        }}
        width={'100%'}
      >
        {children}
      </Flexbox>
    </>
  );
});
export default DesktopLayoutContainer;
