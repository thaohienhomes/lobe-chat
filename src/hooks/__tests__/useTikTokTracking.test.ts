import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import * as tikTokEvents from '@/utils/tiktok-events';

import { useTikTokTracking } from '../useTikTokTracking';

// Mock TikTok events utilities
vi.mock('@/utils/tiktok-events', () => ({
  trackClickButton: vi.fn(),
  trackSearch: vi.fn(),
  trackViewContent: vi.fn(),
}));

describe('useTikTokTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide tracking methods', () => {
    const { result } = renderHook(() => useTikTokTracking());

    expect(result.current).toHaveProperty('trackButtonClick');
    expect(result.current).toHaveProperty('trackSearchAction');
    expect(result.current).toHaveProperty('trackContentView');
    expect(result.current).toHaveProperty('trackUpgradeClick');
    expect(result.current).toHaveProperty('trackNavigationClick');
    expect(result.current).toHaveProperty('trackFeatureClick');
    expect(result.current).toHaveProperty('trackCTAClick');
  });

  describe('trackButtonClick', () => {
    it('should call trackClickButton with correct parameters', () => {
      const { result } = renderHook(() => useTikTokTracking());
      
      result.current.trackButtonClick('Subscribe Now', 'Pricing page');
      
      expect(tikTokEvents.trackClickButton).toHaveBeenCalledWith('Subscribe Now', 'Pricing page');
    });

    it('should call trackClickButton without context', () => {
      const { result } = renderHook(() => useTikTokTracking());
      
      result.current.trackButtonClick('Subscribe Now');
      
      expect(tikTokEvents.trackClickButton).toHaveBeenCalledWith('Subscribe Now', undefined);
    });
  });

  describe('trackSearchAction', () => {
    it('should call trackSearch with search query', () => {
      const { result } = renderHook(() => useTikTokTracking());
      
      result.current.trackSearchAction('AI models');
      
      expect(tikTokEvents.trackSearch).toHaveBeenCalledWith('AI models');
    });
  });

  describe('trackContentView', () => {
    it('should call trackViewContent with all parameters', () => {
      const { result } = renderHook(() => useTikTokTracking());
      
      result.current.trackContentView('premium', 'Premium Plan', 129000);
      
      expect(tikTokEvents.trackViewContent).toHaveBeenCalledWith('premium', 'Premium Plan', 129000);
    });

    it('should call trackViewContent without value', () => {
      const { result } = renderHook(() => useTikTokTracking());
      
      result.current.trackContentView('premium', 'Premium Plan');
      
      expect(tikTokEvents.trackViewContent).toHaveBeenCalledWith('premium', 'Premium Plan', undefined);
    });
  });

  describe('trackUpgradeClick', () => {
    it('should call trackClickButton with upgrade context', () => {
      const { result } = renderHook(() => useTikTokTracking());
      
      result.current.trackUpgradeClick('Premium', 'Settings page');
      
      expect(tikTokEvents.trackClickButton).toHaveBeenCalledWith(
        'Upgrade to Premium',
        'Clicked from Settings page'
      );
    });
  });

  describe('trackNavigationClick', () => {
    it('should call trackClickButton with navigation context', () => {
      const { result } = renderHook(() => useTikTokTracking());
      
      result.current.trackNavigationClick('Subscription', 'Main menu');
      
      expect(tikTokEvents.trackClickButton).toHaveBeenCalledWith(
        'Navigate to Subscription',
        'From Main menu'
      );
    });
  });

  describe('trackFeatureClick', () => {
    it('should call trackClickButton with feature context', () => {
      const { result } = renderHook(() => useTikTokTracking());
      
      result.current.trackFeatureClick('AI Chat', 'Start');
      
      expect(tikTokEvents.trackClickButton).toHaveBeenCalledWith(
        'Start AI Chat',
        'Feature interaction'
      );
    });
  });

  describe('trackCTAClick', () => {
    it('should call trackClickButton with CTA context', () => {
      const { result } = renderHook(() => useTikTokTracking());
      
      result.current.trackCTAClick('Get Started', 'Hero section');
      
      expect(tikTokEvents.trackClickButton).toHaveBeenCalledWith(
        'Get Started',
        'CTA placement: Hero section'
      );
    });
  });

  describe('callback stability', () => {
    it('should return stable callback references', () => {
      const { result, rerender } = renderHook(() => useTikTokTracking());
      
      const firstRender = result.current;
      rerender();
      const secondRender = result.current;
      
      expect(firstRender.trackButtonClick).toBe(secondRender.trackButtonClick);
      expect(firstRender.trackSearchAction).toBe(secondRender.trackSearchAction);
      expect(firstRender.trackContentView).toBe(secondRender.trackContentView);
      expect(firstRender.trackUpgradeClick).toBe(secondRender.trackUpgradeClick);
      expect(firstRender.trackNavigationClick).toBe(secondRender.trackNavigationClick);
      expect(firstRender.trackFeatureClick).toBe(secondRender.trackFeatureClick);
      expect(firstRender.trackCTAClick).toBe(secondRender.trackCTAClick);
    });
  });
});
