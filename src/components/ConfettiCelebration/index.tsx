'use client';

import Lottie from 'lottie-react';
import { memo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import confettiAnimation from '@/../public/animations/confetti.json';

interface ConfettiCelebrationProps {
  /**
   * Duration in milliseconds before auto-dismiss
   * @default 4000
   */
  duration?: number;
  /**
   * Callback when animation completes
   */
  onComplete?: () => void;
  /**
   * Whether to show the confetti animation
   */
  show: boolean;
}

/**
 * Fullscreen confetti celebration animation
 * Uses Lottie for smooth, performant animations
 * Does not block UI interaction (pointer-events: none)
 */
const ConfettiCelebration = memo<ConfettiCelebrationProps>(
  ({ show, duration = 4000, onComplete }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (show) {
        setIsVisible(true);

        // Auto-dismiss after duration
        const timer = setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [show, duration, onComplete]);

    if (!mounted || !isVisible) return null;

    const content = (
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          height: '100vh',
          justifyContent: 'center',
          left: 0,
          pointerEvents: 'none',
          position: 'fixed',
          top: 0,
          width: '100vw',
          zIndex: 9999,
        }}
      >
        <Lottie
          animationData={confettiAnimation}
          autoplay
          loop={false}
          style={{
            height: '100%',
            maxHeight: '100vh',
            maxWidth: '100vw',
            width: '100%',
          }}
        />
      </div>
    );

    // Use portal to render at document body level
    return createPortal(content, document.body);
  },
);

ConfettiCelebration.displayName = 'ConfettiCelebration';

export default ConfettiCelebration;
