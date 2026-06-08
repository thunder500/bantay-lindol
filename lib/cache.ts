// Tiny in-memory TTL cache. `now` is injectable for testing.
export class TtlCache<T> {
  private value: T | null = null;
  private storedAt = 0;
  constructor(private ttlMs: number) {}

  set(value: T, now: number = Date.now()): void {
    this.value = value;
    this.storedAt = now;
  }

  get(now: number = Date.now()): T | null {
    if (this.value === null) return null;
    return now - this.storedAt <= this.ttlMs ? this.value : null;
  }

  peek(): T | null {
    return this.value;
  }
}
