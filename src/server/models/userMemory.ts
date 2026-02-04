import {
  MemoryCategory,
  NewUserMemory,
  UserMemoryItem,
  userMemories,
} from '@lobechat/database/schemas';
import { and, desc, eq, sql } from 'drizzle-orm';

import { serverDB } from '@/database/server';

/**
 * UserMemoryModel - Database model for cross-session user memories
 */
export class UserMemoryModel {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Create a new memory
   */
  async create(data: Omit<NewUserMemory, 'userId' | 'id'>): Promise<UserMemoryItem> {
    const [result] = await serverDB
      .insert(userMemories)
      .values({
        ...data,
        userId: this.userId,
      })
      .returning();

    return result;
  }

  /**
   * Get all memories for user, optionally filtered by category
   */
  async getAll(category?: MemoryCategory): Promise<UserMemoryItem[]> {
    const conditions = [eq(userMemories.userId, this.userId)];

    if (category) {
      conditions.push(eq(userMemories.category, category));
    }

    return serverDB
      .select()
      .from(userMemories)
      .where(and(...conditions))
      .orderBy(desc(userMemories.importance), desc(userMemories.usageCount));
  }

  /**
   * Get top N most important memories for context injection
   */
  async getTopMemories(limit: number = 10): Promise<UserMemoryItem[]> {
    return serverDB
      .select()
      .from(userMemories)
      .where(eq(userMemories.userId, this.userId))
      .orderBy(desc(userMemories.importance), desc(userMemories.usageCount))
      .limit(limit);
  }

  /**
   * Get formatted memories string for system prompt injection
   */
  async getMemoriesForPrompt(limit: number = 10): Promise<string> {
    const memories = await this.getTopMemories(limit);

    if (memories.length === 0) return '';

    const formatted = memories.map((m) => `- [${m.category}] ${m.content}`).join('\n');

    return `## User Memories\nThe following are memories about this user from previous conversations:\n${formatted}`;
  }

  /**
   * Update a memory
   */
  async update(id: string, data: Partial<NewUserMemory>): Promise<UserMemoryItem | null> {
    const [result] = await serverDB
      .update(userMemories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(userMemories.id, id), eq(userMemories.userId, this.userId)))
      .returning();

    return result || null;
  }

  /**
   * Delete a memory
   */
  async delete(id: string): Promise<boolean> {
    const result = await serverDB
      .delete(userMemories)
      .where(and(eq(userMemories.id, id), eq(userMemories.userId, this.userId)));

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Increment usage count when memory is used in context
   */
  async markAsUsed(id: string): Promise<void> {
    await serverDB
      .update(userMemories)
      .set({
        lastUsedAt: new Date(),
        usageCount: sql`${userMemories.usageCount} + 1`,
      })
      .where(and(eq(userMemories.id, id), eq(userMemories.userId, this.userId)));
  }

  /**
   * Check if similar memory already exists (to avoid duplicates)
   */
  async findSimilar(content: string): Promise<UserMemoryItem | null> {
    // Simple substring matching for now
    // Could be enhanced with embeddings similarity in future
    const memories = await this.getAll();

    const normalized = content.toLowerCase().trim();

    for (const memory of memories) {
      const memoryNormalized = memory.content.toLowerCase().trim();
      // Check if either contains the other (simple similarity)
      if (memoryNormalized.includes(normalized) || normalized.includes(memoryNormalized)) {
        return memory;
      }
    }

    return null;
  }

  /**
   * Batch create memories (for auto-extraction)
   */
  async batchCreate(
    memories: Array<Omit<NewUserMemory, 'userId' | 'id'>>,
  ): Promise<UserMemoryItem[]> {
    if (memories.length === 0) return [];

    const results = await serverDB
      .insert(userMemories)
      .values(
        memories.map((m) => ({
          ...m,
          userId: this.userId,
        })),
      )
      .returning();

    return results;
  }

  /**
   * Get memory count
   */
  async count(): Promise<number> {
    const [result] = await serverDB
      .select({ count: sql<number>`count(*)` })
      .from(userMemories)
      .where(eq(userMemories.userId, this.userId));

    return result?.count || 0;
  }
}
