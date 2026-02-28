'use client';

import { createStyles, keyframes } from 'antd-style';

const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeSlideOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-8px);
  }
`;

export const useStyles = createStyles(({ css, token, responsive }) => ({
  banner: css`
    cursor: default;

    position: relative;

    display: flex;
    gap: 12px;
    align-items: center;

    max-width: 580px;
    margin: 0 auto;
    padding: 8px 16px;

    font-size: 14px;
    line-height: 1.4;
    color: ${token.colorTextSecondary};

    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 28px;
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.15);

    transition: border-color 300ms ease;

    &:hover {
      border-color: rgba(255, 255, 255, 0.14);
    }

    ${responsive.mobile} {
      max-width: 100%;
      padding: 6px 12px;
      font-size: 13px;
    }
  `,

  container: css`
    display: flex;
    justify-content: center;

    width: 100%;
    padding: 0 12px 8px;

    animation: ${fadeSlideIn} 400ms cubic-bezier(0.22, 1, 0.36, 1) both;

    ${responsive.mobile} {
      padding: 0 8px 6px;
    }
  `,

  cta: css`
    cursor: pointer;

    flex-shrink: 0;

    padding: 4px 14px;

    font-size: 12px;
    font-weight: 600;
    line-height: 1.5;
    color: #fff;
    white-space: nowrap;

    border: none;
    border-radius: 14px;

    transition: all 200ms ease;

    &:hover {
      filter: brightness(1.15);
      transform: translateX(1px);
    }

    &:active {
      transform: scale(0.97);
    }
  `,

  dismiss: css`
    cursor: pointer;

    flex-shrink: 0;

    padding: 2px;

    font-size: 14px;
    line-height: 1;
    color: ${token.colorTextQuaternary};

    background: none;
    border: none;
    border-radius: 50%;

    transition: all 200ms ease;

    &:hover {
      color: ${token.colorTextTertiary};
      background: rgba(255, 255, 255, 0.08);
    }
  `,

  emoji: css`
    flex-shrink: 0;
    font-size: 18px;
    line-height: 1;

    ${responsive.mobile} {
      font-size: 16px;
    }
  `,

  exiting: css`
    animation: ${fadeSlideOut} 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
  `,

  tagline: css`
    overflow: hidden;

    font-size: 12px;
    color: ${token.colorTextTertiary};
    text-overflow: ellipsis;
    white-space: nowrap;

    ${responsive.mobile} {
      display: none;
    }
  `,

  text: css`
    overflow: hidden;

    display: flex;
    gap: 6px;
    align-items: center;

    min-width: 0;
  `,

  title: css`
    font-size: 14px;
    font-weight: 600;
    color: ${token.colorText};
    white-space: nowrap;

    ${responsive.mobile} {
      font-size: 13px;
    }
  `,
}));
