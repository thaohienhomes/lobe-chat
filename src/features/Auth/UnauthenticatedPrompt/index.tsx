'use client';

import { SignIn } from '@clerk/nextjs';
import { ActionIcon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { X } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Flexbox } from 'react-layout-kit';

import { AUTH_PROMPT_DISMISSED_KEY } from '@/const/localStorage';
import { useAppearance } from '@/layout/AuthProvider/Clerk/useAppearance';
import { useUserStore } from '@/store/user';

const useStyles = createStyles(({ css, token, isDarkMode }) => ({
  closeButton: css`
    position: absolute;
    z-index: 10;
    inset-block-start: 8px;
    inset-inline-end: 8px;
  `,
  container: css`
    position: fixed;
    z-index: 1000;
    inset-block-end: 24px;
    inset-inline-end: 24px;

    overflow: hidden;

    border-radius: ${token.borderRadiusLG}px;

    background: ${isDarkMode ? token.colorBgElevated : token.colorBgContainer};
    box-shadow: ${token.boxShadowSecondary};

    @media (max-width: 768px) {
      inset-block-end: 12px;
      inset-inline: 12px;
      max-width: calc(100vw - 24px);
    }
  `,
  signInWrapper: css`
    /* stylelint-disable selector-class-pattern */
    .cl-cardBox {
      border: none !important;
      box-shadow: none !important;
    }

    .cl-rootBox {
      width: 100%;
    }
    /* stylelint-enable selector-class-pattern */
  `,
}));

interface UnauthenticatedPromptProps {
  /**
   * Whether to show on mobile devices
   */
  mobile?: boolean;
}

const UnauthenticatedPrompt = memo<UnauthenticatedPromptProps>(({ mobile }) => {
  const { styles, cx } = useStyles();
  const appearance = useAppearance();
  const [isSignedIn, isLoaded] = useUserStore((s) => [s.isSignedIn, s.isLoaded]);
  const [isDismissed, setIsDismissed] = useState(true); // Default to hidden until we check

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem(AUTH_PROMPT_DISMISSED_KEY);
      setIsDismissed(dismissed === 'true');
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_PROMPT_DISMISSED_KEY, 'true');
    }
  }, []);

  // Don't show if:
  // - Still loading auth state
  // - User is signed in
  // - User dismissed the prompt
  if (!isLoaded || isSignedIn || isDismissed) {
    return null;
  }

  return (
    <Flexbox className={cx(styles.container)}>
      <ActionIcon
        className={styles.closeButton}
        icon={X}
        onClick={handleDismiss}
        size="small"
        title="Dismiss"
      />
      <div className={styles.signInWrapper}>
        <SignIn
          afterSignInUrl="/"
          appearance={{
            ...appearance,
            elements: {
              ...appearance.elements,
              cardBox: {
                border: 'none',
                boxShadow: 'none',
              },
              footer: {
                display: mobile ? 'none' : undefined,
              },
            },
          }}
          fallbackRedirectUrl="/"
          routing="hash"
          signUpUrl="/signup"
        />
      </div>
    </Flexbox>
  );
});

UnauthenticatedPrompt.displayName = 'UnauthenticatedPrompt';

export default UnauthenticatedPrompt;
