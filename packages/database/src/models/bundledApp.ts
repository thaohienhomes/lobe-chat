import { and, desc, eq } from 'drizzle-orm';

import { BundledAppItem, NewBundledApp, bundledApps } from '../schemas';
import { LobeChatDatabase } from '../type';

/**
 * BundledAppModel - Manages system-wide bundled app templates
 *
 * Unlike other models, bundled apps are NOT user-specific.
 * They are system-wide templates that any user can use.
 *
 * Usage:
 * ```ts
 * const model = new BundledAppModel(db);
 * const app = await model.findById('artifact-creator');
 * ```
 */
export class BundledAppModel {
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  /**
   * Create a new bundled app (admin only)
   */
  create = async (params: NewBundledApp) => {
    const [result] = await this.db.insert(bundledApps).values(params).returning();

    return result;
  };

  /**
   * Delete a bundled app by ID (admin only)
   */
  delete = async (id: string) => {
    return this.db.delete(bundledApps).where(eq(bundledApps.id, id));
  };

  /**
   * Query all bundled apps
   * @param options - Query options
   * @param options.isPublic - Filter by public visibility (default: true)
   * @param options.isFeatured - Filter by featured status
   * @param options.category - Filter by category
   */
  query = async (options?: { category?: string, isFeatured?: boolean; isPublic?: boolean; }) => {
    const conditions = [];

    if (options?.isPublic !== undefined) {
      conditions.push(eq(bundledApps.isPublic, options.isPublic));
    }

    if (options?.isFeatured !== undefined) {
      conditions.push(eq(bundledApps.isFeatured, options.isFeatured));
    }

    if (options?.category) {
      conditions.push(eq(bundledApps.category, options.category));
    }

    return this.db.query.bundledApps.findMany({
      orderBy: [desc(bundledApps.usageCount), desc(bundledApps.createdAt)],
      where: conditions.length > 0 ? and(...conditions) : undefined,
    });
  };

  /**
   * Find a bundled app by ID
   */
  findById = async (id: string) => {
    return this.db.query.bundledApps.findFirst({
      where: eq(bundledApps.id, id),
    });
  };

  /**
   * Update a bundled app (admin only)
   */
  update = async (id: string, value: Partial<BundledAppItem>) => {
    return this.db
      .update(bundledApps)
      .set({ ...value, updatedAt: new Date() })
      .where(eq(bundledApps.id, id));
  };

  /**
   * Increment usage count for analytics
   */
  incrementUsageCount = async (id: string) => {
    const app = await this.findById(id);
    if (!app) return;

    const currentCount = (app.usageCount as number) || 0;
    return this.update(id, { usageCount: currentCount + 1 });
  };

  /**
   * Get featured bundled apps
   */
  getFeatured = async () => {
    return this.query({ isFeatured: true, isPublic: true });
  };

  /**
   * Get bundled apps by category
   */
  getByCategory = async (category: string) => {
    return this.query({ category, isPublic: true });
  };
}
