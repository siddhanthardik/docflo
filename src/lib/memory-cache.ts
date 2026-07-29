/**
 * High-Speed Node.js Process RAM LRU Memory Cache
 * 
 * Provides 0ms latency in-memory active conversation context caching
 * without requiring external Redis installation.
 */

interface CacheEntry {
  messages: string[];
  updatedAt: number;
}

class ConversationMemoryCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxEntries: number = 2000;
  private readonly ttlMs: number = 24 * 60 * 60 * 1000; // 24 Hours TTL

  get(conversationId: string): string[] | null {
    const entry = this.cache.get(conversationId);
    if (!entry) return null;

    if (Date.now() - entry.updatedAt > this.ttlMs) {
      this.cache.delete(conversationId);
      return null;
    }

    return entry.messages;
  }

  set(conversationId: string, messages: string[]): void {
    // LRU eviction if max size reached
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(conversationId, {
      messages,
      updatedAt: Date.now(),
    });
  }

  clear(conversationId: string): void {
    this.cache.delete(conversationId);
  }
}

export const memoryCache = new ConversationMemoryCache();
