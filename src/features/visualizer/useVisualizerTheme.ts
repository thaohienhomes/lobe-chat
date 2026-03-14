'use client';

import { theme } from 'antd';

import type { ShellThemeVars } from '@/features/visualizer/shellHTML';

/**
 * Maps antd design tokens to ShellThemeVars for the Visualizer iframe.
 */
export function useVisualizerTheme(): ShellThemeVars {
  const { token } = theme.useToken();

  return {
    accent: token.colorPrimary,
    bg: token.colorBgContainer,
    border: token.colorBorderSecondary,
    surface: token.colorBgElevated,
    text: token.colorText,
    textSecondary: token.colorTextSecondary,
  };
}
