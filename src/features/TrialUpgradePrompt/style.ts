import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css }) => ({
  // Outer container with border beam effect
  outerContainer: css`
    --border-beam-color-start: #ff6b35;
    --border-beam-color-end: #ffd700;
    --border-beam-size: 120px;
    --border-beam-duration: 8s;
    --border-radius: 16px;
    --border-width: 2px;

    position: relative;
    margin: 8px;
    padding: var(--border-width);
    border-radius: var(--border-radius);
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    overflow: hidden;

    /* Subtle static border */
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--border-radius);
      padding: var(--border-width);
      background: linear-gradient(
        135deg,
        rgba(255, 107, 53, 0.3) 0%,
        rgba(255, 215, 0, 0.2) 50%,
        rgba(255, 107, 53, 0.3) 100%
      );
      mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      mask-composite: exclude;
      pointer-events: none;
    }
  `,

  // Animated border beam - a single beam traveling along the border
  animatedBorder: css`
    position: absolute;
    inset: 0;
    border-radius: var(--border-radius, 16px);
    pointer-events: none;

    /* The traveling beam */
    &::after {
      content: '';
      position: absolute;
      width: var(--border-beam-size, 120px);
      aspect-ratio: 1;
      border-radius: 50%;

      /* Gradient beam with fade edges */
      background: radial-gradient(
        ellipse at center,
        var(--border-beam-color-end, #ffd700) 0%,
        var(--border-beam-color-start, #ff6b35) 40%,
        transparent 70%
      );

      /* Travel along the border path */
      offset-path: rect(0 auto auto 0 round var(--border-radius, 16px));
      offset-distance: 0%;

      animation: borderBeamTravel var(--border-beam-duration, 8s) linear infinite;
    }

    @keyframes borderBeamTravel {
      0% {
        offset-distance: 0%;
      }
      100% {
        offset-distance: 100%;
      }
    }
  `,

  compact: css`
    --border-beam-size: 80px;
    padding: 2px;
  `,

  // Inner container
  container: css`
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 1;

    padding: 16px;

    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border-radius: 14px;
  `,

  // Header icon wrapper
  iconWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 28px;
    height: 28px;

    color: #a855f7;

    background: rgba(168, 85, 247, 0.15);
    border-radius: 8px;
  `,

  title: css`
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  `,

  messagesText: css`
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  `,

  // Black Friday card
  blackFridayCard: css`
    position: relative;
    overflow: hidden;
    padding: 12px;
    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%);
    border-radius: 12px;
  `,

  shimmerOverlay: css`
    position: absolute;
    inset: 0;
    background: linear-gradient(
      110deg,
      transparent 20%,
      rgba(255, 255, 255, 0.3) 50%,
      transparent 80%
    );
    animation: shimmer 2s infinite;

    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
  `,

  blackFridayContent: css`
    position: relative;
    z-index: 1;
  `,

  giftIcon: css`
    color: #ffffff;
    animation: float 2s ease-in-out infinite;

    @keyframes float {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-3px);
      }
    }
  `,

  blackFridayText: css`
    font-size: 12px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 1px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  `,

  // Countdown timer styles
  countdownContainer: css`
    margin-top: 4px;
  `,

  countdownItem: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 40px;
    padding: 6px 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
  `,

  countdownItemHighlight: css`
    background: rgba(255, 255, 0, 0.3);
  `,

  countdownNumber: css`
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
  `,

  countdownLabel: css`
    font-size: 8px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 2px;
  `,

  countdownSeparator: css`
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 2px;
    animation: blink 1s infinite;

    @keyframes blink {
      0%, 50% {
        opacity: 1;
      }
      51%, 100% {
        opacity: 0.3;
      }
    }
  `,

  // Pricing section
  pricingHint: css`
    padding: 12px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  `,

  pricingMain: css`
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;

    strong {
      color: #ffd700;
    }
  `,

  pricingDetail: css`
    font-size: 11px;
    color: rgba(255, 255, 255, 0.6);
  `,

  // CTA Button with glow effect
  ctaButton: css`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    overflow: hidden;

    padding: 14px 24px;

    font-size: 15px;
    font-weight: 700;
    color: #000000 !important;
    text-decoration: none !important;

    background: linear-gradient(135deg, #ffd700 0%, #ffb700 50%, #ff9500 100%);
    border-radius: 10px;

    transition: all 0.3s ease;

    &:hover {
      color: #000000 !important;
      transform: translateY(-2px) scale(1.02);
      box-shadow:
        0 0 20px rgba(255, 215, 0, 0.6),
        0 0 40px rgba(255, 183, 0, 0.4),
        0 0 60px rgba(255, 149, 0, 0.2);
      text-decoration: none !important;
    }

    &:active {
      color: #000000 !important;
      transform: translateY(0) scale(1);
    }

    &:visited {
      color: #000000 !important;
    }

    span {
      position: relative;
      z-index: 1;
      color: #000000 !important;
      font-weight: 700 !important;
    }
  `,

  ctaGlow: css`
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.4),
      transparent
    );
    animation: ctaShine 2s infinite;

    @keyframes ctaShine {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
      }
    }
  `,

  ctaIcon: css`
    position: relative;
    z-index: 1;
    color: #000000 !important;
    animation: zap 0.5s ease-in-out infinite alternate;

    @keyframes zap {
      0% {
        transform: scale(1);
      }
      100% {
        transform: scale(1.1);
      }
    }
  `,
}));

