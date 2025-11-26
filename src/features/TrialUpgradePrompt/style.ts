import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ css, token }) => ({
  compact: css`
    padding: 12px;
  `,

  container: css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    padding: 16px;
    margin: 8px;
    
    background: linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgElevated} 100%);
    border: 1px solid ${token.colorPrimaryBorder};
    border-radius: 12px;
  `,

  ctaButton: css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    padding: 12px 20px;

    font-size: 14px;
    font-weight: 700;
    color: #000000 !important;
    text-decoration: none !important;

    background: linear-gradient(135deg, #ffd700 0%, #ffb700 50%, #ff9500 100%);
    border-radius: 8px;
    border: 2px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(255, 165, 0, 0.4);

    transition: all 0.2s ease;

    &:hover {
      color: #000000 !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 165, 0, 0.5);
      text-decoration: none !important;
      background: linear-gradient(135deg, #ffe44d 0%, #ffcc00 50%, #ffa500 100%);
    }

    &:active {
      color: #000000 !important;
      transform: translateY(0);
    }

    &:visited {
      color: #000000 !important;
    }

    span {
      color: #000000 !important;
      font-weight: 700 !important;
    }

    svg {
      color: #000000 !important;
    }
  `,

  iconWrapper: css`
    display: flex;
    align-items: center;
    justify-content: center;
    
    width: 28px;
    height: 28px;
    
    color: ${token.colorPrimary};
    
    background: ${token.colorPrimaryBg};
    border-radius: 6px;
  `,

  pricingDetail: css`
    font-size: 11px;
    color: ${token.colorTextSecondary};
  `,

  pricingHint: css`
    padding: 8px;
    
    font-size: 12px;
    color: ${token.colorTextSecondary};
    text-align: center;
    
    background: ${token.colorBgContainer};
    border-radius: 6px;
  `,

  progressBar: css`
    width: 100%;
    height: 6px;
    
    overflow: hidden;
    
    background: ${token.colorBgContainer};
    border-radius: 3px;
  `,

  progressExpired: css`
    background: ${token.colorError};
  `,

  progressFill: css`
    height: 100%;
    
    background: linear-gradient(90deg, ${token.colorPrimary} 0%, ${token.colorSuccess} 100%);
    border-radius: 3px;
    
    transition: width 0.3s ease;
  `,

  progressText: css`
    font-size: 11px;
    color: ${token.colorTextSecondary};
  `,

  title: css`
    font-size: 13px;
    font-weight: 600;
    color: ${token.colorText};
  `,

  blackFridayBanner: css`
    padding: 6px 8px;

    font-size: 10px;
    font-weight: 700;
    text-align: center;

    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
    border-radius: 4px;

    animation: pulse 2s infinite;

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.02);
      }
    }
  `,

  blackFridayText: css`
    color: #ffffff;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,

  giftIcon: css`
    color: #ffffff;
    animation: bounce 1s infinite;

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-3px);
      }
      60% {
        transform: translateY(-1px);
      }
    }
  `,
}));

