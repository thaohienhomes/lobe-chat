'use client';

import { ActionIcon } from '@lobehub/ui';
import { ChatHeader } from '@lobehub/ui/mobile';
import { useTheme } from 'antd-style';
import { Moon, Sun } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { MOBILE_HEADER_ICON_SIZE } from '@/const/layoutTokens';
import LangButton from '@/features/User/UserPanel/LangButton';
import { useGlobalStore } from '@/store/global';
import { mobileHeaderSticky } from '@/styles/mobileHeader';

const Header = memo(() => {
  const theme = useTheme();
  const switchThemeMode = useGlobalStore((s) => s.switchThemeMode);

  return (
    <ChatHeader
      right={
        <Flexbox align="center" gap={4} horizontal>
          <LangButton placement="bottom" />
          <ActionIcon
            icon={theme.isDarkMode ? Moon : Sun}
            onClick={() => switchThemeMode(theme.isDarkMode ? 'light' : 'dark')}
            size={MOBILE_HEADER_ICON_SIZE}
          />
        </Flexbox>
      }
      style={mobileHeaderSticky}
    />
  );
});

export default Header;
