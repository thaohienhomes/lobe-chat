import { LobeChatDatabase } from '@lobechat/database';

import { BundledAppModel } from '@/database/models/bundledApp';

/**
 * BundledAppService - Server-side service for bundled apps
 *
 * Bundled apps are system-wide templates, so this service does NOT require userId
 */
export class BundledAppService {
  private readonly db: LobeChatDatabase;
  private readonly model: BundledAppModel;

  constructor(db: LobeChatDatabase) {
    this.db = db;
    this.model = new BundledAppModel(db);
  }

  /**
   * Get all public bundled apps
   */
  async getPublicApps() {
    return this.model.query({ isPublic: true });
  }

  /**
   * Get featured bundled apps
   */
  async getFeaturedApps() {
    return this.model.getFeatured();
  }

  /**
   * Get bundled app by ID
   */
  async getAppById(id: string) {
    return this.model.findById(id);
  }

  /**
   * Get bundled apps by category
   */
  async getAppsByCategory(category: string) {
    return this.model.getByCategory(category);
  }

  /**
   * Increment usage count when user uses a bundled app
   */
  async trackUsage(id: string) {
    return this.model.incrementUsageCount(id);
  }
}
