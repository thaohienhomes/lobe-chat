'use client';

import { Dropdown, DropdownProps } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo } from 'react';

import { useIsMobile } from '@/hooks/useIsMobile';

const useStyles = createStyles(({ css, prefixCls, token }) => ({
  dropdownMenu: css`
    &.${prefixCls}-dropdown-menu {
      border: 1px solid ${token.colorBorderSecondary};
      border-radius: 12px;

      /* Dark theme for dropdown */
      background: ${token.colorBgElevated} !important;
      box-shadow:
        0 6px 16px 0 rgba(0, 0, 0, 20%),
        0 3px 6px -4px rgba(0, 0, 0, 12%),
        0 9px 28px 8px rgba(0, 0, 0, 5%);

      .${prefixCls}-dropdown-menu-item-group-list {
        margin: 0;
      }
      .${prefixCls}-avatar {
        margin-inline-end: var(--ant-margin-xs);
      }

      /* Ensure menu items have proper dark theme text color */
      .${prefixCls}-dropdown-menu-item, .${prefixCls}-dropdown-menu-item-group-title {
        color: ${token.colorText} !important;
      }

      .${prefixCls}-dropdown-menu-item:hover:not(.${prefixCls}-dropdown-menu-item-disabled) {
        background: ${token.colorBgTextHover} !important;
      }

      .${prefixCls}-dropdown-menu-item-disabled {
        cursor: not-allowed;
        color: ${token.colorTextQuaternary} !important;
      }

      .${prefixCls}-dropdown-menu-item-divider {
        background: ${token.colorBorderSecondary};
      }
    }
  `,
}));

export interface ActionDropdownProps extends DropdownProps {
  maxHeight?: number | string;
  maxWidth?: number | string;
  minWidth?: number | string;
}

const ActionDropdown = memo<ActionDropdownProps>(
  ({ menu, maxHeight, minWidth, maxWidth, children, placement = 'top', ...rest }) => {
    const { cx, styles } = useStyles();
    const isMobile = useIsMobile();

    return (
      <Dropdown
        arrow={false}
        menu={{
          ...menu,
          className: cx(styles.dropdownMenu, menu.className),
          onClick: (e) => {
            e.domEvent.preventDefault();
            menu.onClick?.(e);
          },
          style: {
            maxHeight,
            maxWidth: isMobile ? undefined : maxWidth,
            minWidth: isMobile ? undefined : minWidth,
            overflowX: 'hidden',
            overflowY: 'scroll',
            width: isMobile ? '100vw' : undefined,
            ...menu.style,
          },
        }}
        placement={isMobile ? 'top' : placement}
        {...rest}
      >
        {children}
      </Dropdown>
    );
  },
);

export default ActionDropdown;
