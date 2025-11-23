import { and, desc, eq, sql } from 'drizzle-orm';

import { NewSharedConversation, SharedConversation, sharedConversations } from '../schemas';
import { LobeChatDatabase } from '../type';

export class SharedConversationModel {
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }
  /**
   * Create a new shared conversation
   */
  async create(data: NewSharedConversation): Promise<SharedConversation> {
    const [result] = await this.db.insert(sharedConversations).values(data).returning();
    return result;
  }

  /**
   * Find shared conversation by ID
   */
  async findById(id: string): Promise<SharedConversation | undefined> {
    const [result] = await this.db
      .select()
      .from(sharedConversations)
      .where(eq(sharedConversations.id, id));

    return result;
  }

  /**
   * Get public shared conversation by ID (increments view count)
   */
  async getPublicById(id: string): Promise<SharedConversation | undefined> {
    const conversation = await this.findById(id);

    if (!conversation || !conversation.isPublic) {
      return undefined;
    }

    // Increment view count
    await this.incrementViewCount(id);

    return conversation;
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.db
      .update(sharedConversations)
      .set({
        viewCount: sql`${sharedConversations.viewCount} + 1`,
        accessedAt: new Date(),
      })
      .where(eq(sharedConversations.id, id));
  }

  /**
   * Increment fork count
   */
  async incrementForkCount(id: string): Promise<void> {
    await this.db
      .update(sharedConversations)
      .set({
        forkCount: sql`${sharedConversations.forkCount} + 1`,
      })
      .where(eq(sharedConversations.id, id));
  }

  /**
   * Get user's shared conversations
   */
  async getUserSharedConversations(userId: string): Promise<SharedConversation[]> {
    return this.db
      .select()
      .from(sharedConversations)
      .where(eq(sharedConversations.userId, userId))
      .orderBy(desc(sharedConversations.createdAt));
  }

  /**
   * Get public shared conversations (for discovery)
   */
  async getPublicConversations(limit: number = 20): Promise<SharedConversation[]> {
    return this.db
      .select()
      .from(sharedConversations)
      .where(eq(sharedConversations.isPublic, true))
      .orderBy(desc(sharedConversations.createdAt))
      .limit(limit);
  }

  /**
   * Delete shared conversation
   */
  async delete(id: string, userId?: string): Promise<void> {
    const conditions = userId
      ? and(eq(sharedConversations.id, id), eq(sharedConversations.userId, userId))
      : eq(sharedConversations.id, id);

    await this.db.delete(sharedConversations).where(conditions!);
  }

  /**
   * Update shared conversation
   */
  async update(
    id: string,
    data: Partial<NewSharedConversation>,
    userId?: string,
  ): Promise<SharedConversation | undefined> {
    const conditions = userId
      ? and(eq(sharedConversations.id, id), eq(sharedConversations.userId, userId))
      : eq(sharedConversations.id, id);

    const [result] = await this.db
      .update(sharedConversations)
      .set({ ...data, updatedAt: new Date() })
      .where(conditions!)
      .returning();

    return result;
  }
}

