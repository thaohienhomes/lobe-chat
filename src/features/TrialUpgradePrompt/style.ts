import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css }) => ({
  // Animated border beam - a single beam traveling along the border
  animatedBorder: css`
    pointer-events: none;
    position: absolute;
    inset: 0;
    border-radius: var(--border-radius, 16px);

    /* The traveling beam */
    &::after {
      content: '';

      position: absolute;

      /* Travel along the border path */
      offset-path: rect(0 auto auto 0 round var(--border-radius, 16px));
      offset-distance: 0%;

      aspect-ratio: 1;
      width: var(--border-beam-size, 120px);
      border-radius: 50%;

      /* Gradient beam with fade edges */
      background: radial-gradient(
        ellipse at center,
        var(--border-beam-color-end, #ffd700) 0%,
        var(--border-beam-color-start, #ff6b35) 40%,
        transparent 70%
      );

      animation: border-beam-travel var(--border-beam-duration, 8s) linear infinite;
    }

    @keyframes border-beam-travel {
      0% {
        offset-distance: 0%;
      }

      100% {
        offset-distance: 100%;
      }
    }
  `,

  // Black Friday card
  blackFridayCard: css`
    position: relative;

    overflow: hidden;

    padding: 12px;
    border-radius: 12px;

    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff8c42 100%);
  `,

  blackFridayContent: css`
    position: relative;
    z-index: 1;
  `,

  blackFridayText: css`
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 20%);
    letter-spacing: 1px;
  `,

  compact: css`
    --border-beam-size: 80px;

    padding: 2px;
  `,

  // Inner container
  container: css`
    position: relative;
    z-index: 1;

    display: flex;
    flex-direction: column;
    gap: 12px;

    padding: 16px;
    border-radius: 14px;

    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  `,

  // Countdown timer styles
  countdownContainer: css`
    margin-block-start: 4px;
  `,

  countdownItem: css`
    display: flex;
    flex-direction: column;
    align-items: center;

    min-width: 40px;
    padding-block: 6px;
    padding-inline: 8px;
    border-radius: 6px;

    background: rgba(255, 255, 255, 20%);
  `,

  countdownItemHighlight: css`
    background: rgba(255, 255, 0, 30%);
  `,

  countdownLabel: css`
    margin-block-start: 2px;

    font-size: 8px;
    font-weight: 600;
    color: rgba(255, 255, 255, 80%);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,

  countdownNumber: css`
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
    color: #fff;
  `,

  countdownSeparator: css`
    margin-block: 0;
    margin-inline: 2px;

    font-size: 18px;
    font-weight: 700;
    color: #fff;

    animation: blink 1s infinite;

    @keyframes blink {
      0%,
      50% {
        opacity: 1;
      }

      51%,
      100% {
        opacity: 0.3;
      }
    }
  `,

  // CTA Button with glow effect
  ctaButton: css`
    position: relative;

    overflow: hidden;
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: center;

    padding-block: 14px;
    padding-inline: 24px;
    border-radius: 10px;

    font-size: 15px;
    font-weight: 700;
    color: #000 !important;
    text-decoration: none !important;

    background: linear-gradient(135deg, #ffd700 0%, #ffb700 50%, #ff9500 100%);

    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px) scale(1.02);
      color: #000 !important;
      text-decoration: none !important;
      box-shadow:
        0 0 20px rgba(255, 215, 0, 60%),
        0 0 40px rgba(255, 183, 0, 40%),
        0 0 60px rgba(255, 149, 0, 20%);
    }

    &:active {
      transform: translateY(0) scale(1);
      color: #000 !important;
    }

    &:visited {
      color: #000 !important;
    }

    span {
      position: relative;
      z-index: 1;
      font-weight: 700 !important;
      color: #000 !important;
    }
  `,

  ctaGlow: css`
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 40%), transparent);
    animation: cta-shine 2s infinite;

    @keyframes cta-shine {
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
    color: #000 !important;
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

  giftIcon: css`
    color: #fff;
    animation: float 2s ease-in-out infinite;

    @keyframes float {
      0%,
      100% {
        transform: translateY(0);
      }

      50% {
        transform: translateY(-3px);
      }
    }
  `,

  // Header icon wrapper
  iconWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 28px;
    height: 28px;
    border-radius: 8px;

    color: #a855f7;

    background: rgba(168, 85, 247, 15%);
  `,

  messagesText: css`
    font-size: 12px;
    color: rgba(255, 255, 255, 70%);
  `,

  // Outer container with border beam effect
  outerContainer: css`
    --border-beam-color-start: #ff6b35;
    --border-beam-color-end: #ffd700;
    --border-beam-size: 120px;
    --border-beam-duration: 8s;
    --border-radius: 16px;
    --border-width: 2px;

    position: relative;

    overflow: hidden;

    margin: 8px;
    padding: var(--border-width);
    border-radius: var(--border-radius);

    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);

    /* Subtle static border */
    &::before {
      pointer-events: none;
      content: '';

      position: absolute;
      inset: 0;

      padding: var(--border-width);
      border-radius: var(--border-radius);

      background: linear-gradient(
        135deg,
        rgba(255, 107, 53, 30%) 0%,
        rgba(255, 215, 0, 20%) 50%,
        rgba(255, 107, 53, 30%) 100%
      );

      mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);

      mask-composite: exclude;
    }
  `,

  pricingDetail: css`
    font-size: 11px;
    color: rgba(255, 255, 255, 60%);
  `,

  // Pricing section
  pricingHint: css`
    padding: 12px;
    border: 1px solid rgba(255, 255, 255, 10%);
    border-radius: 8px;
    background: rgba(255, 255, 255, 5%);
  `,

  pricingMain: css`
    font-size: 16px;
    font-weight: 700;
    color: #fff;

    strong {
      color: #ffd700;
    }
  `,

  shimmerOverlay: css`
    position: absolute;
    inset: 0;
    background: linear-gradient(
      110deg,
      transparent 20%,
      rgba(255, 255, 255, 30%) 50%,
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

  title: css`
    font-size: 14px;
    font-weight: 600;
    color: #fff;
  `,
}));
