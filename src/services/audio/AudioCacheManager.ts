interface AudioCacheEntry {
  url: string;
  createdAt: number;
}

export class AudioCacheManager {
  private cache = new Map<string, AudioCacheEntry>();
  private readonly cacheDurationMs: number;

  constructor(cacheDurationMs: number = 30 * 60 * 1000) {
    this.cacheDurationMs = cacheDurationMs;
  }

  get(id: string): string | null {
    const entry = this.cache.get(id);
    if (!entry) return null;

    // Check if cache is expired
    if (Date.now() - entry.createdAt > this.cacheDurationMs) {
      this.delete(id);
      return null;
    }

    return entry.url;
  }

  set(id: string, url: string): void {
    // Clean up old URL if exists
    this.delete(id);

    this.cache.set(id, {
      url,
      createdAt: Date.now(),
    });
  }

  delete(id: string): void {
    const entry = this.cache.get(id);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      this.cache.delete(id);
    }
  }

  cleanupExpired(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    this.cache.forEach((entry, id) => {
      if (now - entry.createdAt > this.cacheDurationMs) {
        entriesToDelete.push(id);
      }
    });

    entriesToDelete.forEach((id) => this.delete(id));
  }

  clear(): void {
    this.cache.forEach((_, id) => this.delete(id));
  }

  get size(): number {
    return this.cache.size;
  }
}
