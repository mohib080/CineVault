/**
 * Zero-dependency In-Memory LRU & Stale-While-Revalidate Cache
 * Eliminates round-trip latency to remote NeonDB and TMDB APIs.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  staleUntil: number;
}

export class MemoryCache {
  private store: Map<string, CacheEntry<any>> = new Map();
  private maxItems: number;
  private defaultTtlMs: number;
  private staleGraceMs: number;

  constructor(options: { maxItems?: number; defaultTtlMs?: number; staleGraceMs?: number } = {}) {
    this.maxItems = options.maxItems || 1500;
    this.defaultTtlMs = options.defaultTtlMs || 15 * 60 * 1000; // 15 minutes default
    this.staleGraceMs = options.staleGraceMs || 30 * 60 * 1000; // 30 minutes stale grace
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    const now = Date.now();
    if (now > entry.staleUntil) {
      this.store.delete(key);
      return undefined;
    }

    // Refresh LRU order on hit
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs !== undefined ? ttlMs : this.defaultTtlMs;
    const now = Date.now();

    // Evict oldest if reaching capacity
    if (this.store.size >= this.maxItems) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: now + ttl,
      staleUntil: now + ttl + this.staleGraceMs
    });
  }

  /**
   * Stale-While-Revalidate execution:
   * Returns fresh cache instantly (<1ms).
   * If stale, returns stale data immediately and triggers background refresh.
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (entry) {
      // 1. Fresh hit -> return instantly
      if (now <= entry.expiresAt) {
        return entry.value as T;
      }

      // 2. Stale hit -> return stale data immediately & trigger background revalidation
      if (now <= entry.staleUntil) {
        setImmediate(async () => {
          try {
            const freshValue = await fetchFn();
            this.set(key, freshValue, ttlMs);
          } catch (err) {
            // Ignore background revalidation errors, stale data was already served
          }
        });
        return entry.value as T;
      }
    }

    // 3. Cache miss or completely expired -> fetch synchronously
    const freshValue = await fetchFn();
    this.set(key, freshValue, ttlMs);
    return freshValue;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  deletePrefix(prefix: string): number {
    let deletedCount = 0;
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  invalidatePrefix(prefix: string): number {
    return this.deletePrefix(prefix);
  }

  deletePattern(pattern: RegExp): number {
    let deletedCount = 0;
    for (const key of Array.from(this.store.keys())) {
      if (pattern.test(key)) {
        this.store.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  invalidatePattern(pattern: RegExp): number {
    return this.deletePattern(pattern);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

// Global server-side cache instances
export const tmdbCache = new MemoryCache({
  maxItems: 2000,
  defaultTtlMs: 15 * 60 * 1000, // 15 mins
  staleGraceMs: 60 * 60 * 1000 // 1 hour stale-while-revalidate
});

export const appDataCache = new MemoryCache({
  maxItems: 1000,
  defaultTtlMs: 5 * 60 * 1000, // 5 mins
  staleGraceMs: 15 * 60 * 1000
});
