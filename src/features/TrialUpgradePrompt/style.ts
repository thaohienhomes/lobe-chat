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
    
    padding: 10px 16px;
    
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    text-decoration: none;
    
    background: linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%);
    border-radius: 8px;
    
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px ${token.colorPrimaryBg};
    }
    
    &:active {
      transform: translateY(0);
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
}));

